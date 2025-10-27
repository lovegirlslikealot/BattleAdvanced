"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { GenericStringInMemoryStorage } from "@/fhevm/GenericStringStorage";
import { useColorGuess } from "@/hooks/useColorGuess";
// Icons replaced with emojis for better compatibility

export default function Page() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [readonlyProvider, setReadonlyProvider] = useState<ethers.ContractRunner | undefined>(undefined);
  const [userAddress, setUserAddress] = useState<string>("");

  // Connect MetaMask
  async function connect() {
    try {
      // @ts-ignore
      const eth = window.ethereum as ethers.Eip1193Provider | undefined;
      if (!eth) {
        alert("Please install MetaMask!");
        return;
      }
      await eth.request?.({ method: "eth_requestAccounts" });
      const web3 = new ethers.BrowserProvider(eth);
      const s = await web3.getSigner();
      const net = await web3.getNetwork();
      const address = await s.getAddress();
      
      setProvider(eth);
      setSigner(s);
      setChainId(Number(net.chainId));
      setReadonlyProvider(web3);
      setUserAddress(address);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  }

  // FHEVM instance (auto Mock for local; auto Relayer SDK for public networks)
  const { instance, status, error } = useFhevm({ 
    provider, 
    chainId, 
    enabled: true, 
    initialMockChains: { 31337: "http://localhost:8545" } 
  });

  const storage = useMemo(() => new GenericStringInMemoryStorage(), []);

  const cg = useColorGuess({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    provider,
    chainId,
    signer,
    readonlyProvider,
  });

  useEffect(() => {
    // Auto connect if MetaMask available
    // @ts-ignore
    if (window.ethereum && !provider) {
      connect();
    }
  }, []);

  const palette = useMemo(() => [
    { color: "linear-gradient(135deg, #ff6b6b, #ee5a24)", name: "Red" },
    { color: "linear-gradient(135deg, #feca57, #ff9ff3)", name: "Yellow" },
    { color: "linear-gradient(135deg, #48dbfb, #0abde3)", name: "Cyan" },
    { color: "linear-gradient(135deg, #1dd1a1, #10ac84)", name: "Green" },
    { color: "linear-gradient(135deg, #5f27cd, #341f97)", name: "Purple" },
    { color: "linear-gradient(135deg, #fd79a8, #e84393)", name: "Pink" },
    { color: "linear-gradient(135deg, #fdcb6e, #e17055)", name: "Orange" },
    { color: "linear-gradient(135deg, #6c5ce7, #a29bfe)", name: "Indigo" }
  ], []);

  const getStatusBadge = (status: string, error?: Error) => {
    if (error) {
      return (
        <span className="status-badge status-error">
          ❌ Error: {error.message}
        </span>
      );
    }
    
    switch (status) {
      case "connected":
        return (
          <span className="status-badge status-success">
            ✅ Connected
          </span>
        );
      case "connecting":
        return (
          <span className="status-badge status-info">
            ⏳ Connecting...
          </span>
        );
      default:
        return (
          <span className="status-badge status-warning">
            ⚠️ {status}
          </span>
        );
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatEther = (value: bigint | undefined) => {
    if (!value) return "0";
    return ethers.formatEther(value);
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8 relative">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-xl floating-element"></div>
        <div className="absolute top-3/4 right-1/4 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl floating-element" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-3/4 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-xl floating-element" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <div className="relative inline-block">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4 sm:mb-6 drop-shadow-2xl">
              ColorGuess
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur opacity-30 animate-pulse"></div>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-3 sm:mb-4 font-medium px-4">
            🎨 Privacy-Preserving Color Guessing Game
          </p>
          <p className="text-sm sm:text-lg text-white/70 backdrop-blur-sm bg-white/10 rounded-full px-4 sm:px-6 py-2 inline-block mx-4">
            🔒 Powered by FHEVM - Fully Homomorphic Encryption
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="game-card mb-6 sm:mb-8 animate-slide-up glow-effect">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">💳</span>
              Wallet Connection
            </h2>
            {getStatusBadge(status, error)}
          </div>
          
          {!signer ? (
            <button onClick={connect} className="btn-primary w-full text-lg font-bold">
              <span className="flex items-center justify-center gap-3">
                <span className="text-2xl">🔗</span>
                Connect MetaMask Wallet
              </span>
            </button>
          ) : (
            <div className="info-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-white/70 text-sm font-medium mb-2">Wallet Address:</span>
                  <span className="text-white font-mono text-lg bg-white/10 rounded-lg px-3 py-2">
                    {formatAddress(userAddress)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white/70 text-sm font-medium mb-2">Chain ID:</span>
                  <span className="text-white font-mono text-lg bg-white/10 rounded-lg px-3 py-2">
                    {chainId || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="game-card mb-6 sm:mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">ℹ️</span>
            Game Information
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="info-card text-center group hover:scale-105 transition-transform duration-300">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:animate-bounce">🎨</div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                {cg.params.numColors ?? "-"}
              </div>
              <div className="text-white/70 font-medium text-sm sm:text-base">Available Colors</div>
            </div>
            
            <div className="info-card text-center group hover:scale-105 transition-transform duration-300">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:animate-bounce">💰</div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                {formatEther(cg.params.participationFee)} ETH
              </div>
              <div className="text-white/70 font-medium text-sm sm:text-base">Entry Fee</div>
            </div>
            
            <div className="info-card text-center group hover:scale-105 transition-transform duration-300">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:animate-bounce">🏆</div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                {formatEther(cg.params.rewardOnWin)} ETH
              </div>
              <div className="text-white/70 font-medium text-sm sm:text-base">Win Reward</div>
            </div>
          </div>
          
          {cg.contractAddress && (
            <div className="mt-8 info-card">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <span className="text-white/70 font-medium">Contract Address:</span>
                <span className="text-white font-mono bg-white/10 rounded-lg px-4 py-2 flex-1">
                  {formatAddress(cg.contractAddress)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Game Controls */}
        <div className="game-card mb-6 sm:mb-8 animate-slide-up glow-effect" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">🎮</span>
            Game Controls
          </h2>
          
          <div className="space-y-6 sm:space-y-8">
            <button 
              disabled={!signer || !cg.params.participationFee || cg.busy} 
              onClick={cg.startGame}
              className="btn-primary w-full text-base sm:text-lg font-bold disabled:opacity-50"
            >
              {cg.busy ? (
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">▶️</span>
                  Start New Game ({formatEther(cg.params.participationFee)} ETH)
                </span>
              )}
            </button>
            
            {/* Color Palette */}
            {cg.params.numColors && cg.params.numColors > 0 && (
              <div className="info-card">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 text-center">
                  🌈 Choose Your Color:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 justify-items-center">
                  {palette.slice(0, cg.params.numColors).map((colorInfo, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <button
                        onClick={() => cg.guess(idx)}
                        disabled={cg.busy}
                        className="color-button group relative glow-effect"
                        style={{ background: colorInfo.color }}
                        title={colorInfo.name}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {idx + 1}
                        </div>
                      </button>
                      <span className="text-white/80 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                        {colorInfo.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="game-card animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">👁️</span>
            Game Results
          </h2>
          
          <div className="space-y-4 sm:space-y-6">
            <button 
              disabled={!cg.canDecryptLast || cg.busy} 
              onClick={cg.decryptLast}
              className="btn-secondary w-full text-base sm:text-lg font-bold disabled:opacity-50"
            >
              {cg.busy ? (
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                  Decrypting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">🔍</span>
                  Decrypt Last Result
                </span>
              )}
            </button>
            
            <div className="info-card space-y-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <span className="text-white/70 font-medium">Result Handle:</span>
                <span className="text-white font-mono bg-white/10 rounded-lg px-4 py-2">
                  {cg.lastResultHandle ? formatAddress(cg.lastResultHandle) : "None"}
                </span>
              </div>
              
              {cg.clearLastResult !== undefined && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <span className="text-white/70 font-medium text-sm sm:text-base">Game Result:</span>
                  <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-base sm:text-lg flex items-center gap-2 sm:gap-3 ${
                    cg.clearLastResult 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {cg.clearLastResult ? (
                      <>
                        <span className="text-xl sm:text-2xl">🎉</span>
                        You Won!
                      </>
                    ) : (
                      <>
                        <span className="text-xl sm:text-2xl">😔</span>
                        You Lost
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {cg.message && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <span className="text-white/70 font-medium text-sm sm:text-base">Status:</span>
                  <span className="text-blue-300 bg-blue-500/20 rounded-lg px-3 sm:px-4 py-2 font-medium text-sm sm:text-base">
                    {cg.message}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-12 mb-6 sm:mb-8">
          <div className="info-card">
            <p className="text-white/80 text-base sm:text-lg font-medium flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <span className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">❤️</span>
                Built with FHEVM for Privacy-Preserving Gaming
              </span>
              <span className="text-xl sm:text-2xl">🔒</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


