"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { ColorGuessABI } from "@/abi/ColorGuessABI";
import { ColorGuessAddresses } from "@/abi/ColorGuessAddresses";

export function getColorGuessByChainId(chainId: number | undefined): {
  abi: typeof ColorGuessABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
} {
  if (!chainId) return { abi: ColorGuessABI.abi };
  const entry = ColorGuessAddresses[chainId.toString() as keyof typeof ColorGuessAddresses];
  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: ColorGuessABI.abi, chainId };
  }
  return { address: entry.address as `0x${string}`, chainId: entry.chainId ?? chainId, chainName: entry.chainName, abi: ColorGuessABI.abi };
}

export const useColorGuess = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  signer: ethers.JsonRpcSigner | undefined;
  readonlyProvider: ethers.ContractRunner | undefined;
}) => {
  const { instance, fhevmDecryptionSignatureStorage, chainId, signer, readonlyProvider } = parameters;

  const [params, setParams] = useState<{
    numColors?: number;
    participationFee?: bigint;
    rewardOnWin?: bigint;
  }>({});
  const [lastResultHandle, setLastResultHandle] = useState<string | undefined>(undefined);
  const [clearLastResult, setClearLastResult] = useState<boolean | undefined>(undefined);
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const cg = useMemo(() => getColorGuessByChainId(chainId), [chainId]);

  const canCall = useMemo(() => Boolean(cg.address && readonlyProvider), [cg.address, readonlyProvider]);

  const refreshParams = useCallback(async () => {
    if (!cg.address || !readonlyProvider) return;
    const c = new ethers.Contract(cg.address, cg.abi, readonlyProvider);
    const [numColors, participationFee, rewardOnWin] = await Promise.all([
      c.numColors(),
      c.participationFee(),
      c.rewardOnWin(),
    ]);
    setParams({ numColors: Number(numColors), participationFee, rewardOnWin });
  }, [cg.address, cg.abi, readonlyProvider]);

  const refreshLastResultHandle = useCallback(async () => {
    if (!cg.address || !signer) return;
    const user = await signer.getAddress();
    if (!user) return;
    // 必须以 signer 调用，以便合约中的 msg.sender = 用户地址
    const c = new ethers.Contract(cg.address, cg.abi, signer);
    const h = await c.getMyLastResultHandle();
    setLastResultHandle(h);
  }, [cg.address, cg.abi, signer]);

  useEffect(() => { refreshParams(); }, [refreshParams]);
  useEffect(() => { refreshLastResultHandle(); }, [refreshLastResultHandle]);

  const startGame = useCallback(async () => {
    if (!cg.address || !signer || !params.participationFee) return;
    setBusy(true); setMessage("Start game...");
    try {
      const c = new ethers.Contract(cg.address, cg.abi, signer);
      const tx = await c.startGame({ value: params.participationFee, gasLimit: 3000000n });
      await tx.wait();
      setMessage("Game started");
      await refreshParams();
    } catch (e) { setMessage("startGame failed"); } finally { setBusy(false); }
  }, [cg.address, cg.abi, signer, params.participationFee, refreshParams]);

  const guess = useCallback(async (choice: number) => {
    if (!cg.address || !signer || !instance) return;
    setBusy(true); setMessage("Encrypt guess...");
    try {
      const c = new ethers.Contract(cg.address, cg.abi, signer);
      const input = instance.createEncryptedInput(cg.address, (await signer.getAddress()));
      input.add8(choice);
      const enc = await input.encrypt();
      setMessage("Submit guess...");
      const tx = await c.guess(enc.handles[0], enc.inputProof, { gasLimit: 5000000n });
      await tx.wait();
      setMessage("Guess submitted");
      await refreshLastResultHandle();
    } catch (e) { setMessage("guess failed"); } finally { setBusy(false); }
  }, [cg.address, cg.abi, signer, instance, refreshLastResultHandle]);

  const canDecryptLast = useMemo(() => Boolean(instance && signer && lastResultHandle && lastResultHandle !== ethers.ZeroHash), [instance, signer, lastResultHandle]);

  const decryptLast = useCallback(async () => {
    if (!cg.address || !instance || !signer || !lastResultHandle) return;
    setBusy(true); setMessage("Decrypt last result...");
    try {
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [cg.address as `0x${string}`],
        signer,
        fhevmDecryptionSignatureStorage
      );
      if (!sig) { setMessage("Build signature failed"); return; }
      const res = await instance.userDecrypt(
        [{ handle: lastResultHandle, contractAddress: cg.address }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );
      const clear = res[lastResultHandle];
      setClearLastResult(Boolean(clear));
      setMessage(`Decrypted: ${Boolean(clear)}`);
    } catch (e) { setMessage("decrypt failed"); } finally { setBusy(false); }
  }, [cg.address, instance, signer, lastResultHandle, fhevmDecryptionSignatureStorage]);

  return {
    contractAddress: cg.address,
    params,
    startGame,
    guess,
    canCall,
    lastResultHandle,
    canDecryptLast,
    decryptLast,
    clearLastResult,
    busy,
    message,
  };
};


