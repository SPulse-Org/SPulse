# SPulse

SPulse is a prediction-market project built with Soroban smart contracts on Stellar and a lightweight static HTML frontend.

The frontend uses plain HTML, CSS, and JavaScript. It does not require Node.js, Next.js, React, npm, or a build step.

## Current status

The Soroban contracts are deployed and initialized on Stellar Testnet. The static frontend displays live public Stellar network data and XLM pricing, connects to Freighter, and submits positions for verified Testnet market #3 directly to the deployed prediction-market contract. The other market cards remain clearly labeled demonstrations.

### Testnet contracts

| Contract | Testnet address |
| --- | --- |
| Prediction Market | `CAPCAPWPGPOCENAJFYYIE22WYNFEDVZ3CT73M5MAKILFMBQ5TN2MIS6T` |
| PULSE Token | `CBYUQUXPGWUQRV7STCV3YPVLWNTFJHKLEAG7LVAOK7H4FIFJGZW5P476` |
| Referral Registry | `CCKVUVYXR6FBB4VFYGDF3IDDUVBRJGKPDDRABTZYKI2LKAJNVLF3TTQ2` |
| Leaderboard | `CCMNYMUI4XMDBTTMM7E6KNQFF3OVKS3Q2ERJ4EVQGCLW4VQCGUGG2AQM` |

Testnet deployer: `GC5D4ENQ3U3Q23L5RUG2GGIDFFVKOVJ6GUFJRTNIQ6SRP5J7RMECKSL7`

The deployment output is stored locally in the ignored `deploy-output.json` file. Contract activity can be inspected with [Stellar Expert Testnet](https://stellar.expert/explorer/testnet).

## Repository layout

- `contracts/` — Rust/Soroban contracts for markets, rewards, referrals, and leaderboards.
- `frontend/` — static HTML, CSS, and JavaScript website.
- `scripts/` — testnet/mainnet deployment and smoke-test scripts.
- `docs/` — contract invocation examples and technical documentation.

## Run the static frontend

Opening `frontend/index.html` directly works for most UI features. A local HTTP server is recommended because browsers may restrict API requests from `file://` pages.

Using Python:

```bash
cd frontend
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

You can also use the VS Code Live Server extension or deploy the contents of `frontend/` to any static host.
## Frontend files

- `frontend/index.html` — page structure and inline SVG icon library.
- `frontend/markets.html` — searchable and filterable market catalog.
- `frontend/leaderboard.html` — community ranking page.
- `frontend/styles.css` — core theme and responsive layout.
- `frontend/product.css` — trading workspace, dashboard, FAQ, and expanded product sections.
- `frontend/pages.css` — shared styling for dedicated application pages.
- `frontend/script.js` — live data, market filters, Testnet order flow, simulations, and dashboard interactions.
- `frontend/soroban.js` — Soroban simulation, signing, submission, confirmation polling, and contract errors.
- `frontend/pages.js` — market catalog and leaderboard rendering.
- `frontend/wallet.js` — Freighter connection, testnet validation, balance display, and Friendbot funding.

## Connect a wallet

1. Install the [Freighter browser extension](https://www.freighter.app/).
2. Open Freighter and switch its network to **Testnet**.
3. Serve the frontend over HTTP and select **Connect wallet**.
4. Approve access in Freighter.
5. If the testnet account is empty, use the **Fund** action to request free test XLM from Friendbot.

The wallet integration uses the official `@stellar/freighter-api` package as a pinned browser module. The site never receives or stores the wallet secret key. Freighter asks the user for approval and exposes only the selected public address.

### Place a Testnet position

1. Connect a funded Freighter account on Testnet.
2. Select the market labeled **Testnet #3**.
3. Choose YES or NO and enter at least 1 test XLM.
4. Review and approve the exact contract transaction in Freighter.
5. Wait for confirmation, then open the transaction from the dashboard in Stellar Expert.

The browser loads the source account, builds a `place_bet` invocation, simulates it through Stellar RPC, asks Freighter to sign the prepared XDR, submits it to Testnet, and polls until the ledger confirms success. A failed or cancelled wallet request is never displayed as a completed position.

The page retrieves:

- Stellar ledger information from public Horizon APIs.
- XLM/USD market information from CoinGecko.

If a public API is unavailable, the interface displays an unavailable state instead of fabricated live values.

## Smart contracts

The Soroban workspace contains four contracts:

- `prediction_market` — market creation, YES/NO bets, resolution, claims, cancellations, refunds, and fees.
- `PULSE_token` — reward token and authorized minters.
- `referral_registry` — user registration, referrals, and bonuses.
- `leaderboard` — points, win/loss statistics, rankings, and token rewards.

### Contract tests

Install Rust and Stellar CLI, then run:

```bash
cd contracts
cargo test --workspace
```

The current contract suite contains 89 passing tests.

## Testnet deployment

The deployment script uses the ignored `.deploy.env` file and free Friendbot test XLM:

```bash
bash scripts/deploy-testnet.sh
```

The script:

1. Builds optimized WASM artifacts.
2. Funds the deployer on testnet.
3. Deploys all four contracts.
4. Initializes and connects the contracts.
5. Configures token-minter permissions.
6. Writes the public deployment details to `deploy-output.json`.

Run the end-to-end contract workflow with:

```bash
bash scripts/smoke-test.sh
```

The smoke test creates temporary Friendbot-funded users and checks registration, betting, cancellation, refunds, resolution, claims, token rewards, fees, and leaderboard data.


## Security

- Never commit `.deploy.env`, secret keys, seed phrases, or wallet exports.
- Contract IDs and public account addresses are safe to publish.
- Wallet connection, balance lookup, and positions on market #3 are real Testnet operations. All other market cards remain simulations and are labeled accordingly.

## License

This project is licensed under the MIT License.
