# BattleForge

> Fair competitive gaming with privacy — powered by Zama FHEVM

BattleForge is a decentralized gaming platform where match logic and anti‑cheat checks run over encrypted data. Using Fully Homomorphic Encryption (FHE) via Zama’s FHEVM, player inputs stay private while results remain publicly verifiable on‑chain.

---

## Why BattleForge

- ❌ Leaked gameplay signals → ✅ Encrypted inputs and telemetry (FHE)
- ❌ Opaque anti‑cheat → ✅ Verifiable on‑chain validation without data exposure
- ❌ Centralized progression → ✅ Self‑sovereign profiles, assets, and rewards

---

## Zama FHEVM for Encrypted Play

FHEVM enables smart contracts to execute computations over ciphertexts. BattleForge validates moves, tallies scores, and issues rewards without seeing plaintext inputs.

```
Player Client
  └─ FHE Encrypt (inputs, proofs)
         └─ Encrypted Payload → FHEVM Contracts
                                  └─ Encrypted Rule Checks & Scoring
                                           └─ Verifiable Result → On‑chain Rewards
```

Key properties
- No plaintext anti‑cheat signals on‑chain
- Encrypted rule checks and scoring
- Auditable results and reward distribution

---

## Getting Started

Prerequisites: Node.js 18+, MetaMask, Sepolia ETH

Setup
```bash
git clone https://github.com/lovegirlslikealot/BattleForge
cd BattleForge
npm install
cp .env.example .env.local
```

Deploy
```bash
npm run deploy:sepolia
```

Run
```bash
npm run dev
```

---

## Match Flow

1) Queue and matchmaking
2) Client encrypts gameplay inputs and submits
3) FHEVM contracts validate actions and compute scores
4) Results posted on‑chain; rewards/NFTs minted

Privacy model
- Encrypted: inputs, telemetry, anti‑cheat signals
- Transparent: match result, leaderboard, reward logic

---

## Architecture

| Layer            | Technology            | Role                                  |
|------------------|-----------------------|---------------------------------------|
| Encryption       | Zama FHE              | Client‑side encryption of inputs       |
| Smart Contracts  | Solidity + FHEVM      | Encrypted rule checks & scoring        |
| Blockchain       | Ethereum Sepolia      | Execution and persistence              |
| Frontend         | React + TypeScript    | Game UI + local cryptography           |
| Tooling          | Hardhat, Ethers       | Build/test/deploy                      |

Core contracts
- MatchFactory: lobbies/matches lifecycle
- EncryptedRules: pluggable rule validation (encrypted)
- Rewards: token/NFT rewards for wins and milestones

---

## Features

- 🔐 Encrypted gameplay validation
- 🏆 Ranked ladders and tournaments
- 🎟️ NFT achievements and cosmetics
- 🧩 Modular game modes/rulesets
- 🧾 Verifiable results and payouts

---

## Security & Best Practices

- Independent audits for circuits and contracts recommended
- EIP‑712 signed epochs for replay protection
- Minimize metadata; rotate FHE keys per season
- Monitor gas impact of FHE computations

---

## Roadmap

- v1: Core encrypted validation, match flow, rewards
- v1.1: Tournament brackets, spectate proofs
- v1.2: Mobile client, cross‑mode profiles
- v2: Cross‑chain deployments, decentralized oracle sets

---

## Contributing

PRs welcome — gameplay circuits, audits, UI/UX, documentation.

---

## Resources

- Zama: https://www.zama.ai
- FHEVM Docs: https://docs.zama.ai/fhevm
- Sepolia Explorer: https://sepolia.etherscan.io

---

## License

MIT — see LICENSE.

Built with Zama FHEVM — private inputs, fair results, public trust.
