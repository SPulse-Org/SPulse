# StellarPulse

A production-oriented prediction market built on **Stellar** and **Soroban**.

StellarPulse is a monorepo containing the full product stack:
- Soroban smart contracts in Rust
- A Next.js frontend with TypeScript
- Deployment scripts for Stellar testnet and mainnet

---

## What is StellarPulse?

StellarPulse is a binary prediction market where users bet YES/NO on real-world outcomes.
The platform is designed for low-cost, fast on-chain settlement using Stellar assets and Soroban smart contracts.

Key capabilities:
- Binary bets on prediction markets
- Token rewards and leaderboard points
- On-chain referral rewards
- Fee sponsorship and gasless transactions
- Upgradeable contract architecture

---

## Repo Layout

- `contracts/` — Soroban smart contracts. Includes `prediction_market`, `ipredict_token`, `referral_registry`, and `leaderboard`.
- `frontend/` — Next.js frontend app with wallet integration, market UI, and leaderboard views.
- `scripts/` — deployment and helper scripts for testnet/mainnet workflows.
- `docs/` — deployment docs and contract call examples.

---

## Quick Start

### Prerequisites

- Rust + Cargo
- Soroban toolchain (`soroban` + `wasm`)
- Node.js 18+
- Git

### Run locally

```bash
git clone https://github.com/Steller-StellarPulse-org/StellarPulse.git
cd StellarPulse
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Run contract tests

```bash
cd contracts
cargo test --workspace
```

### Run frontend tests

```bash
cd frontend
npm run test
```

---

## Development Workflow

1. Update contract logic in `contracts/<crate>/src`.
2. Run `cargo test -p <crate>`.
3. Update frontend code in `frontend/`.
4. Run `npm run test` and `npm run lint` as needed.
5. Commit focused changes with clear messages.

---

## Deployment

Deployment scripts are available under `scripts/`:
- `deploy-testnet.sh` — testnet deployment flow
- `deploy-mainnet.sh` — mainnet deployment flow
- `create-mainnet-markets.sh` — create seed markets after mainnet deployment

For contract call examples and deployed addresses, see `docs/CONTRACT_CALLS.md`.

---

## Verify Deployment on Stellar

To confirm whether the project is deployed on Stellar, search the Stellar explorer for contract IDs, account addresses, or transaction hashes.

Recommended explorers:

- [Stellar Expert](https://stellar.expert)
- [Soroban Explorer](https://soroban.stellar.org/explorer)

Search for a known contract ID or account to verify live status on Mainnet or Testnet.
If the contract exists, the explorer will show its deployment details and history.

For contract addresses and example calls, see `docs/CONTRACT_CALLS.md`.

---

## Architecture

StellarPulse is built as a modular, upgradeable Soroban contract system with a modern frontend.

### Contract responsibilities

- `prediction_market` — market creation, bets, resolution, claims
- `ipredict_token` — PULSE reward token
- `referral_registry` — referral tracking and bonus distribution
- `leaderboard` — leaderboards, points, and metrics

### Frontend

- Connects to Stellar wallets
- Uses Soroban RPC for contract interactions
- Displays markets, bets, referral rewards, and leaderboard data
- Supports testnet and mainnet configuration through env variables

---

## Contributing

Contributions are welcome. Please open issues for bugs or feature requests.

If you plan to force-push or rewrite history, coordinate with project maintainers.

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.
