# StellarPulse

A compact, production-oriented prediction market built on Stellar + Soroban.

StellarPulse is a monorepo containing on-chain smart contracts (Soroban/Rust)
and a modern Next.js frontend. This repository includes the core contracts,
front-end app, tests, and deployment helpers so you can run, test, and
iterate locally or deploy to a network.

Author: WITTIG

---

## Quick Start

### Requirements

- Rust + Cargo (stable toolchain)
- `soroban`/`wasm` toolchain for Soroban contract builds
- Node.js 18+ and pnpm/npm/yarn
- Git

### Clone the repo

```bash
git clone https://github.com/Steller-StellarPulse-org/StellarPulse.git
cd StellarPulse
```

### Run the frontend locally

```bash
cd frontend
npm install
npm run dev
# open http://localhost:3000
```

### Build and test contracts

```bash
cd contracts
cargo test --workspace
```

### Run the full test suite

```bash
cd contracts && cargo test
cd ../frontend && npm run test
```

---

## Repository Layout

- `contracts/` — Soroban smart contracts written in Rust. Sub-crates include `prediction_market`, `ipredict_token`, `referral_registry`, and `leaderboard`.
- `frontend/` — Next.js 14 frontend (App Router) with Tailwind CSS and TypeScript.
- `scripts/` — deployment and helper scripts for testnet/mainnet flows.

---

## Development Notes

- The frontend runs on `http://localhost:3000` by default.
- Environment config lives under `frontend/src/config`.
- Contracts are organized as independent crates for targeted testing and isolated upgrades.
- Contracts use the Rust test harness; frontend uses Vitest.

Suggested workflow:

1. Change contract logic in `contracts/<crate>/src`.
2. Run `cargo test -p <crate>`.
3. Test frontend changes in `frontend/`.
4. Commit focused changes with clear messages.

---

## Contributing

Contributions are welcome. Open issues for bugs or features, and use feature branches for non-trivial work.

If you plan to rewrite history or force-push, coordinate with maintainers.

---

## License

This project uses the MIT license. See `LICENSE` for details.

---

## Deployed Contracts (Stellar Mainnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| Prediction Market | `CDGNPRYTFDXJLWZE4YDKZXW4IEN2RLPSE4N7VM5HJ7NLPL2QC45GIXI5` | [stellar.expert](https://stellar.expert/explorer/public/contract/CDGNPRYTFDXJLWZE4YDKZXW4IEN2RLPSE4N7VM5HJ7NLPL2QC45GIXI5) |
| PULSE Token | `CAYL4TKNRMXAX5ZLQGFEZ6XOC2QHTCTN5QC2SB5BEEHLVO6SDU2UBLRH` | [stellar.expert](https://stellar.expert/explorer/public/contract/CAYL4TKNRMXAX5ZLQGFEZ6XOC2QHTCTN5QC2SB5BEEHLVO6SDU2UBLRH) |
| Referral Registry | `CAGJVX6EXMCKKWDJCQFIEJ34CZTHZOGLWJM6KQTGDEXEO723CJZ5773H` | [stellar.expert](https://stellar.expert/explorer/public/contract/CAGJVX6EXMCKKWDJCQFIEJ34CZTHZOGLWJM6KQTGDEXEO723CJZ5773H) |
| Leaderboard | `CCWWOQSDSO3XXLCMA6A2HYRUFYVNUJZ2HPAMFQSPOB4JWYIBY2HWVTOB` | [stellar.expert](https://stellar.expert/explorer/public/contract/CCWWOQSDSO3XXLCMA6A2HYRUFYVNUJZ2HPAMFQSPOB4JWYIBY2HWVTOB) |

> **Network:** Stellar Mainnet (Public) | **Admin:** `GDZ4VJWNJPLNU3PAWDYX3V5XNATO7X257DPHWRPFXSCCNEUZ7QTXIIUI` | **7 seed markets live** | All contracts upgradeable
>
> **Native XLM SAC:** `CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA`

---

## User Validation

The table below records pre-launch testnet validation from early users.

| # | Wallet Address | Action | Points |
|---|----------------|--------|--------|
| 1 | `GDHQ6TNWZ4V2JVCDWEUVW7YKFBXCOQZRRUCT27LAKES3PGOE6JSZMSMD` | Admin — Created markets, placed bets, claimed rewards | 83 |
| 2 | `GA5OIFR4TLRJC54B3FIDWHIQKVFGVOWQFE3NXIIGCGLSGTJRUY6RHR2Q` | Placed bets, claimed rewards, referral registration | 38 |
| 3 | `GAIWJS35TTF2XMYGHY6AX6YBGI4IG3RWSEL2FEXV3DESW5RITGPWIIED` | Placed bets, claimed rewards, referral registration | 29 |
| 4 | `GA7GFCGUDLWZ6DIDCNERHA5CI7MATE6NT3MKDVJKFYIM5Y543OTLO3UY` | Placed bets, referral registration | 20 |

*Pre-launch testnet wallets are verifiable on Stellar Expert Testnet.*

---

## User Feedback

- **Form:** [https://forms.gle/WrTyoCzQ6LJegL8a9](https://forms.gle/WrTyoCzQ6LJegL8a9)
- **Spreadsheet:** [https://docs.google.com/spreadsheets/d/1rGhq1rgeDPiF6hI4iDL2eFt0vUMBDA6LSm9zS2txpiA/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1rGhq1rgeDPiF6hI4iDL2eFt0vUMBDA6LSm9zS2txpiA/edit?usp=sharing)

### Feedback Implementation

The following updates were added based on early user validation:

- Added more filtering and default sorting options to the leaderboard on Active.

| User Name | Email | Wallet | Commit ID |
|-----------|-------|--------|-----------|
| best_bettor | `malyyen@gmail.com` | `GA7GFCGUDLWZ6DIDCNERHA5CI7MATE6NT3MKDVJKFYIM5Y543OTLO3UY` | `77c37784589046eeeb917a9015085dfa6fb26a52` |

---

## Product Update

### Fee Sponsorship and Gasless Transactions

We added fee sponsorship and gasless transactions to the MVP, allowing users
to interact with the prediction market without holding XLM for transaction
fees. This makes the platform more inclusive and easier to use.

---

## Features

- **Binary Prediction Markets** — Bet YES or NO on any question with XLM.
- **Inclusive Reward System** — Winners and losers earn points plus PULSE tokens.
- **Onchain Referral Program** — Share your link, earn 0.5% of referred bets plus bonus points.
- **Real-Time Leaderboard** — Rankings by points, volume, and win rate.
- **Social Sharing** — One-tap sharing to X, Telegram, and WhatsApp.
- **4 Independent Smart Contracts** — Independently testable and upgradeable.
- **Near-Zero Fees** — 2% total (1.5% platform + 0.5% referrer).
- **Fast Finality** — Near-instant settlement on Stellar/Soroban.
- **Mobile-First Design** — Fully responsive UI.
- **Non-Custodial** — Your keys, your funds.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js 14 Frontend                        │
│  (App Router • Tailwind CSS • Stellar Wallets Kit)             │
└──────────────┬──────────────┬──────────────┬──────────────┬─────┘
               │              │              │              │
        Soroban RPC      Soroban RPC    Soroban RPC    Soroban RPC
               │              │              │              │
  ┌────────────▼──┐ ┌────────▼────┐ ┌───────▼──────┐ ┌────▼────────┐
  │  Prediction   │ │  PULSE      │ │   Referral   │ │ Leaderboard │
  │    Market     │ │    Token    │ │   Registry   │ │             │
  │               │ │             │ │              │ │             │
  │ create_market │ │ mint        │ │ register     │ │ add_pts     │
  │ place_bet ────┼─┼─► mint ◄───┼─┤ credit ──────┼─┤ record_bet  │
  │ resolve    ───┼─┼─► mint     │ │ get_referrer │ │ get_stats   │
  │ claim      ───┼─┼─► mint     │ │ get_earnings │ │ get_top     │
  │ cancel        │ │ transfer   │ │ is_registered│ │ get_rank    │
  │ withdraw_fees │ │ balance    │ │              │ │             │
  └───────────────┘ └────────────┘ └──────────────┘ └─────────────┘
```

### Inter-Contract Call Flow

**Place Bet:** `PredictionMarket.place_bet()` → Transfers XLM via SAC →
`ReferralRegistry.credit()` (splits fee: 0.5% to referrer, 1.5% to platform) →
`Leaderboard.record_bet()` → `PulseToken.mint()`

**Resolve Market:** `PredictionMarket.resolve_market()` → Stores outcome onchain
