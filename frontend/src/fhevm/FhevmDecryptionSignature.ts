import { ethers } from "ethers";
import { EIP712Type, FhevmDecryptionSignatureType, FhevmInstance } from "./fhevmTypes";
import { GenericStringStorage } from "./GenericStringStorage";

function _timestampNow(): number { return Math.floor(Date.now() / 1000); }

class FhevmDecryptionSignatureStorageKey {
  #contractAddresses: `0x${string}`[];
  #userAddress: `0x${string}`;
  #key: string;

  constructor(instance: FhevmInstance, contractAddresses: string[], userAddress: string, publicKey?: string) {
    if (!ethers.isAddress(userAddress)) throw new TypeError(`Invalid address ${userAddress}`);
    const sorted = (contractAddresses as `0x${string}`[]).sort();
    const empty = instance.createEIP712(publicKey ?? ethers.ZeroAddress, sorted, 0, 0);
    const hash = ethers.TypedDataEncoder.hash(
      empty.domain,
      { UserDecryptRequestVerification: empty.types.UserDecryptRequestVerification },
      empty.message
    );
    this.#contractAddresses = sorted;
    this.#userAddress = userAddress as `0x${string}`;
    this.#key = `${userAddress}:${hash}`;
  }
  get key(): string { return this.#key; }
}

export class FhevmDecryptionSignature {
  #publicKey: string;
  #privateKey: string;
  #signature: string;
  #startTimestamp: number;
  #durationDays: number;
  #userAddress: `0x${string}`;
  #contractAddresses: `0x${string}`[];
  #eip712: EIP712Type;

  private constructor(parameters: FhevmDecryptionSignatureType) {
    this.#publicKey = parameters.publicKey;
    this.#privateKey = parameters.privateKey;
    this.#signature = parameters.signature;
    this.#startTimestamp = parameters.startTimestamp;
    this.#durationDays = parameters.durationDays;
    this.#userAddress = parameters.userAddress;
    this.#contractAddresses = parameters.contractAddresses;
    this.#eip712 = parameters.eip712;
  }

  get privateKey() { return this.#privateKey; }
  get publicKey() { return this.#publicKey; }
  get signature() { return this.#signature; }
  get contractAddresses() { return this.#contractAddresses; }
  get startTimestamp() { return this.#startTimestamp; }
  get durationDays() { return this.#durationDays; }
  get userAddress() { return this.#userAddress; }

  toJSON() { return {
    publicKey: this.#publicKey,
    privateKey: this.#privateKey,
    signature: this.#signature,
    startTimestamp: this.#startTimestamp,
    durationDays: this.#durationDays,
    userAddress: this.#userAddress,
    contractAddresses: this.#contractAddresses,
    eip712: this.#eip712,
  }; }

  static fromJSON(json: unknown) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    return new FhevmDecryptionSignature(data as FhevmDecryptionSignatureType);
  }

  isValid(): boolean {
    return _timestampNow() < this.#startTimestamp + this.#durationDays * 24 * 60 * 60;
  }

  static async loadFromGenericStringStorage(
    storage: GenericStringStorage,
    instance: FhevmInstance,
    contractAddresses: string[],
    userAddress: string,
    publicKey?: string
  ): Promise<FhevmDecryptionSignature | null> {
    try {
      const storageKey = new FhevmDecryptionSignatureStorageKey(instance, contractAddresses, userAddress, publicKey);
      const result = await storage.getItem(storageKey.key);
      if (!result) return null;
      const sig = FhevmDecryptionSignature.fromJSON(result);
      return sig.isValid() ? sig : null;
    } catch { return null; }
  }

  static async new(
    instance: FhevmInstance,
    contractAddresses: string[],
    publicKey: string,
    privateKey: string,
    signer: ethers.Signer
  ): Promise<FhevmDecryptionSignature | null> {
    try {
      const userAddress = (await signer.getAddress()) as `0x${string}`;
      const startTimestamp = _timestampNow();
      const durationDays = 365;
      const eip712 = instance.createEIP712(publicKey, contractAddresses, startTimestamp, durationDays);
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );
      return new FhevmDecryptionSignature({
        publicKey,
        privateKey,
        contractAddresses: contractAddresses as `0x${string}`[],
        startTimestamp,
        durationDays,
        signature,
        eip712: eip712 as EIP712Type,
        userAddress,
      });
    } catch { return null; }
  }

  static async loadOrSign(
    instance: FhevmInstance,
    contractAddresses: string[],
    signer: ethers.Signer,
    storage: GenericStringStorage,
    keyPair?: { publicKey: string; privateKey: string }
  ): Promise<FhevmDecryptionSignature | null> {
    const userAddress = (await signer.getAddress()) as `0x${string}`;
    const cached = await FhevmDecryptionSignature.loadFromGenericStringStorage(
      storage,
      instance,
      contractAddresses,
      userAddress,
      keyPair?.publicKey
    );
    if (cached) return cached;
    const { publicKey, privateKey } = keyPair ?? instance.generateKeypair();
    const sig = await FhevmDecryptionSignature.new(instance, contractAddresses, publicKey, privateKey, signer);
    if (!sig) return null;
    await storage.setItem(
      new FhevmDecryptionSignatureStorageKey(instance, contractAddresses, userAddress, keyPair?.publicKey).key,
      JSON.stringify(sig)
    );
    return sig;
  }
}


