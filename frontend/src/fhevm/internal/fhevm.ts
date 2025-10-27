import { isAddress, Eip1193Provider, JsonRpcProvider } from "ethers";
import { RelayerSDKLoader, isFhevmWindowType } from "./RelayerSDKLoader";
import { publicKeyStorageGet, publicKeyStorageSet } from "./PublicKeyStorage";
import { FhevmInstance, FhevmInstanceConfig, FhevmWindowType } from "../fhevmTypes";

export class FhevmReactError extends Error {
  code: string;
  constructor(code: string, message?: string, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
    this.name = "FhevmReactError";
  }
}

function throwFhevmError(code: string, message?: string, cause?: unknown): never {
  throw new FhevmReactError(code, message, cause ? { cause } : undefined);
}

const isFhevmInitialized = (): boolean => {
  if (!isFhevmWindowType(window, console.log)) return false;
  return window.relayerSDK.__initialized__ === true;
};

const fhevmLoadSDK = () => {
  const loader = new RelayerSDKLoader({ trace: console.log });
  return loader.load();
};

const fhevmInitSDK = async (options?: { trace?: unknown }) => {
  if (!isFhevmWindowType(window, console.log)) throw new Error("window.relayerSDK is not available");
  const result = await window.relayerSDK.initSDK(options);
  window.relayerSDK.__initialized__ = result;
  if (!result) throw new Error("window.relayerSDK.initSDK failed.");
  return true;
};

async function getChainId(providerOrUrl: Eip1193Provider | string): Promise<number> {
  if (typeof providerOrUrl === "string") {
    const provider = new JsonRpcProvider(providerOrUrl);
    return Number((await provider.getNetwork()).chainId);
  }
  const chainId = await providerOrUrl.request({ method: "eth_chainId" });
  return Number.parseInt(chainId as string, 16);
}

async function getWeb3Client(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    const version = await rpc.send("web3_clientVersion", []);
    return version;
  } finally {
    rpc.destroy();
  }
}

async function tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl: string): Promise<
  | { ACLAddress: `0x${string}`; InputVerifierAddress: `0x${string}`; KMSVerifierAddress: `0x${string}` }
  | undefined
> {
  const version = await getWeb3Client(rpcUrl);
  if (typeof version !== "string" || !version.toLowerCase().includes("hardhat")) return undefined;
  try {
    const rpc = new JsonRpcProvider(rpcUrl);
    const metadata = await rpc.send("fhevm_relayer_metadata", []);
    rpc.destroy();
    if (
      !metadata ||
      typeof metadata !== "object" ||
      typeof metadata.ACLAddress !== "string" ||
      !metadata.ACLAddress.startsWith("0x")
    ) {
      return undefined;
    }
    return metadata as { ACLAddress: `0x${string}`; InputVerifierAddress: `0x${string}`; KMSVerifierAddress: `0x${string}` };
  } catch {
    return undefined;
  }
}

type MockResolveResult = { isMock: true; chainId: number; rpcUrl: string };
type GenericResolveResult = { isMock: false; chainId: number; rpcUrl?: string };
type ResolveResult = MockResolveResult | GenericResolveResult;

async function resolve(providerOrUrl: Eip1193Provider | string, mockChains?: Record<number, string>): Promise<ResolveResult> {
  const chainId = await getChainId(providerOrUrl);
  let rpcUrl = typeof providerOrUrl === "string" ? providerOrUrl : undefined;
  const _mockChains: Record<number, string> = { 31337: "http://localhost:8545", ...(mockChains ?? {}) };
  if (Object.hasOwn(_mockChains, chainId)) {
    if (!rpcUrl) rpcUrl = _mockChains[chainId];
    return { isMock: true, chainId, rpcUrl } as MockResolveResult;
  }
  return { isMock: false, chainId, rpcUrl } as GenericResolveResult;
}

export const createFhevmInstance = async (parameters: {
  provider: Eip1193Provider | string;
  mockChains?: Record<number, string>;
  signal: AbortSignal;
  onStatusChange?: (status: "sdk-loading" | "sdk-loaded" | "sdk-initializing" | "sdk-initialized" | "creating") => void;
}): Promise<FhevmInstance> => {
  const { signal, onStatusChange, provider: providerOrUrl, mockChains } = parameters;
  const throwIfAborted = () => { if (signal.aborted) throw new Error("aborted"); };
  const notify = (s: Parameters<NonNullable<typeof onStatusChange>>[0]) => onStatusChange?.(s);

  const { isMock, rpcUrl, chainId } = await resolve(providerOrUrl, mockChains);

  if (isMock) {
    const meta = await tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl);
    if (meta) {
      notify("creating");
      const fhevmMock = await import("./mock/fhevmMock");
      const mockInstance = await fhevmMock.fhevmMockCreateInstance({ rpcUrl, chainId, metadata: meta });
      throwIfAborted();
      return mockInstance as FhevmInstance;
    }
  }

  throwIfAborted();

  if (!isFhevmWindowType(window, console.log)) {
    notify("sdk-loading");
    await fhevmLoadSDK();
    throwIfAborted();
    notify("sdk-loaded");
  }

  if (!isFhevmInitialized()) {
    notify("sdk-initializing");
    await fhevmInitSDK();
    throwIfAborted();
    notify("sdk-initialized");
  }

  const relayerSDK = (window as unknown as FhevmWindowType).relayerSDK;
  const aclAddress = relayerSDK.SepoliaConfig.aclContractAddress;
  if (!isAddress(aclAddress)) throw new Error(`Invalid address: ${aclAddress}`);

  const pub = await publicKeyStorageGet(aclAddress);
  throwIfAborted();

  const config: FhevmInstanceConfig = {
    ...relayerSDK.SepoliaConfig,
    network: providerOrUrl,
    publicKey: pub.publicKey,
    publicParams: pub.publicParams,
  } as FhevmInstanceConfig;

  notify("creating");
  const instance = await relayerSDK.createInstance(config);
  await publicKeyStorageSet(
    aclAddress,
    instance.getPublicKey(),
    instance.getPublicParams(2048)
  );
  throwIfAborted();
  return instance;
};


