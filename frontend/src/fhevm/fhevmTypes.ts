import type { Eip1193Provider } from "ethers";

export type FhevmInstanceConfig = {
  network: string | Eip1193Provider;
  aclContractAddress: `0x${string}`;
  coprocessorContractAddress: `0x${string}`;
  kmsVerifierContractAddress: `0x${string}`;
  decryptionOracleAddress: `0x${string}`;
  protocolId: number;
  publicKey?: { data: Uint8Array | null; id: string | null };
  publicParams?: { "2048": { publicParamsId: string; publicParams: Uint8Array } } | null;
};

export type FhevmInstance = {
  createEncryptedInput: (
    contractAddress: string,
    userAddress: string
  ) => {
    add8: (v: number) => void;
    add32: (v: number) => void;
    encrypt: () => Promise<{ handles: string[]; inputProof: string }>;
  };
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ) => any;
  generateKeypair: () => { publicKey: string; privateKey: string };
  userDecrypt: (
    handles: { handle: string; contractAddress: string }[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<string, string | number | boolean | bigint>>;
  getPublicKey: () => { publicKeyId: string; publicKey: Uint8Array } | null;
  getPublicParams: (bits: 2048) => { publicParamsId: string; publicParams: Uint8Array } | null;
};

export type FhevmWindowType = Window & {
  relayerSDK: FhevmRelayerSDKType & { __initialized__?: boolean };
};

export type FhevmRelayerSDKType = {
  initSDK: (options?: { trace?: unknown }) => Promise<boolean>;
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
  SepoliaConfig: {
    aclContractAddress: `0x${string}`;
    coprocessorContractAddress: `0x${string}`;
    kmsVerifierContractAddress: `0x${string}`;
    decryptionOracleAddress: `0x${string}`;
    protocolId: number;
  };
};

export type EIP712Type = {
  domain: any;
  types: any;
  message: any;
};

export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};


