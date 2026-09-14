const LOCAL_SDK_PATH = "./vendor/stellar-sdk.js";
const SDK_URL = "https://esm.sh/@stellar/stellar-sdk@14.5.0?bundle";

export const TESTNET = Object.freeze({
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  explorerUrl: "https://stellar.expert/explorer/testnet/tx",
  predictionMarketContract: "CAPCAPWPGPOCENAJFYYIE22WYNFEDVZ3CT73M5MAKILFMBQ5TN2MIS6T",
});

let sdkPromise;

function loadSdk() {
  if (!sdkPromise) {
    sdkPromise = import(LOCAL_SDK_PATH).catch((localErr) => {
      console.warn("Vendored SDK load fallback to CDN:", localErr);
      return import(SDK_URL).catch((error) => {
        sdkPromise = null;
        throw new Error(`Stellar SDK could not load: ${error.message}`);
      });
    });
  }
  return sdkPromise;
}

function xlmToStroops(value) {
  const normalized = String(value).trim();
  if (!/^\d+(\.\d{1,7})?$/.test(normalized)) {
    throw new Error("Enter a valid XLM amount with no more than 7 decimal places.");
  }
  const [whole, fraction = ""] = normalized.split(".");
  const stroops = BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, "0"));
  if (stroops <= 0n) throw new Error("Position amount must be greater than zero.");
  return stroops;
}

function simulationError(error) {
  const message = error?.message || String(error || "Transaction simulation failed.");
  if (message.includes("Error(Contract, #")) {
    const code = message.match(/Error\(Contract, #(\d+)\)/)?.[1];
    const known = {
      4: "The requested market does not exist.",
      5: "This market has already ended.",
      7: "This market has already been resolved.",
      8: "This market has been cancelled.",
      10: "The position amount is below the 1 XLM contract minimum.",
      11: "A position already exists on the opposite outcome.",
      14: "The contract rejected the position amount.",
      17: "This account has reached the position limit for the market.",
    };
    return known[code] || `The contract rejected this transaction (error ${code}).`;
  }
  return message;
}

export class TransactionTimeoutError extends Error {
  constructor(message, hash, explorerUrl) {
    super(message);
    this.name = "TransactionTimeoutError";
    this.hash = hash;
    this.explorerUrl = explorerUrl;
  }
}

export class TransactionFailedError extends Error {
  constructor(message, hash, errorResult) {
    super(message);
    this.name = "TransactionFailedError";
    this.hash = hash;
    this.errorResult = errorResult;
  }
}

export async function checkTransactionStatus(hash) {
  if (!hash) return null;
  const sdk = await loadSdk();
  const server = new sdk.rpc.Server(TESTNET.rpcUrl);
  return await server.getTransaction(hash);
}

async function waitForTransaction(server, hash, explorerUrl, attempts = 60, onStatus) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    onStatus?.(`Waiting for confirmation (${attempt + 1}/${attempts})`);
    const result = await server.getTransaction(hash);
    if (result.status === "SUCCESS") return result;
    if (result.status === "FAILED") {
      throw new TransactionFailedError("The transaction failed on Stellar Testnet.", hash, result.errorResult || result);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new TransactionTimeoutError(
    `The transaction is still pending on Stellar Testnet after ${Math.round(attempts * 1.5)}s. Hash: ${hash}. Check explorer: ${explorerUrl}`,
    hash,
    explorerUrl
  );
}

export async function placeBet({ address, marketId, isYes, amountXlm, signTransaction, onStatus, onSubmitted, pollAttempts = 60 }) {
  if (!address) throw new Error("Connect a funded Testnet wallet first.");
  if (!Number.isSafeInteger(marketId) || marketId < 1) throw new Error("Invalid on-chain market ID.");
  if (typeof signTransaction !== "function") throw new Error("Wallet signing is unavailable.");

  const amount = xlmToStroops(amountXlm);
  const sdk = await loadSdk();
  const { BASE_FEE, Contract, Networks, TransactionBuilder, nativeToScVal, rpc } = sdk;
  const server = new rpc.Server(TESTNET.rpcUrl);

  onStatus?.("Loading Testnet account");
  const source = await server.getAccount(address);
  const contract = new Contract(TESTNET.predictionMarketContract);
  const transaction = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(
      "place_bet",
      nativeToScVal(address, { type: "address" }),
      nativeToScVal(BigInt(marketId), { type: "u64" }),
      nativeToScVal(Boolean(isYes), { type: "bool" }),
      nativeToScVal(amount, { type: "i128" }),
    ))
    .setTimeout(60)
    .build();

  let prepared;
  try {
    onStatus?.("Simulating contract call");
    prepared = await server.prepareTransaction(transaction);
  } catch (error) {
    throw new Error(simulationError(error));
  }

  onStatus?.("Confirm in Freighter");
  const signed = await signTransaction(prepared.toXDR(), {
    address,
    networkPassphrase: TESTNET.networkPassphrase,
  });
  if (!signed?.signedTxXdr) throw new Error(signed?.error?.message || "Transaction signing was cancelled.");

  const signedTransaction = TransactionBuilder.fromXDR(signed.signedTxXdr, Networks.TESTNET);
  onStatus?.("Submitting to Testnet");
  const submission = await server.sendTransaction(signedTransaction);
  if (submission.status !== "PENDING") {
    const errorDetail = submission.errorResultXdr || (submission.errorResult ? JSON.stringify(submission.errorResult) : submission.status);
    const err = new Error(`Stellar RPC rejected transaction (${submission.status}): ${errorDetail}`);
    err.status = submission.status;
    err.errorResult = submission.errorResult;
    throw err;
  }

  const explorerUrl = `${TESTNET.explorerUrl}/${submission.hash}`;
  onSubmitted?.({
    hash: submission.hash,
    explorerUrl,
    amountStroops: amount,
  });

  onStatus?.("Waiting for confirmation");
  await waitForTransaction(server, submission.hash, explorerUrl, pollAttempts, onStatus);
  return {
    hash: submission.hash,
    explorerUrl,
    amountStroops: amount,
  };
}

function createDummySource(address) {
  const addr = address || "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
  return {
    accountId: () => addr,
    sequenceNumber: () => "0",
    incrementSequenceNumber: () => {},
  };
}

export async function getUserPositions(address) {
  if (!address) return [];
  try {
    const rawSdk = await loadSdk();
    const sdk = rawSdk?.Contract ? rawSdk : (rawSdk?.default || rawSdk);
    const { BASE_FEE, Contract, TransactionBuilder, nativeToScVal, scValToNative, rpc } = sdk;
    const server = new rpc.Server(TESTNET.rpcUrl);
    const contract = new Contract(TESTNET.predictionMarketContract);

    const simulateCall = async (op) => {
      const tx = new TransactionBuilder(createDummySource(address), {
        fee: BASE_FEE,
        networkPassphrase: TESTNET.networkPassphrase,
      })
        .addOperation(op)
        .setTimeout(30)
        .build();
      return await server.simulateTransaction(tx);
    };

    let marketCount = 3;
    try {
      const simCount = await simulateCall(contract.call("get_market_count"));
      if (rpc.Api.isSimulationSuccess(simCount)) {
        const count = Number(scValToNative(simCount.result.retval));
        if (Number.isSafeInteger(count) && count > 0) marketCount = count;
      }
    } catch {
      // Fallback to default marketCount
    }

    const marketIds = [];
    for (let i = 1; i <= marketCount; i += 1) marketIds.push(i);

    const positions = await Promise.all(
      marketIds.map(async (id) => {
        try {
          const simBet = await simulateCall(
            contract.call("get_bet", nativeToScVal(BigInt(id), { type: "u64" }), nativeToScVal(address, { type: "address" }))
          );
          if (!rpc.Api.isSimulationSuccess(simBet)) return null;

          const bet = scValToNative(simBet.result.retval);
          if (!bet || typeof bet !== "object" || !bet.amount) return null;

          let market = null;
          try {
            const simMarket = await simulateCall(contract.call("get_market", nativeToScVal(BigInt(id), { type: "u64" })));
            if (rpc.Api.isSimulationSuccess(simMarket)) {
              market = scValToNative(simMarket.result.retval);
            }
          } catch {
            // Market detail fallback
          }

          const isYes = Boolean(bet.is_yes);
          const outcome = isYes ? "yes" : "no";
          const rawAmount = Number(bet.amount);
          const stakeNum = rawAmount / 10_000_000;
          const stake = stakeNum.toFixed(2);

          let marketStatus = "Open";
          let payoutState = "Active";
          let returns = (stakeNum * 2).toFixed(2);

          if (market?.cancelled) {
            marketStatus = "Cancelled";
            payoutState = bet.claimed ? "Refunded" : "Refund Available";
            returns = stake;
          } else if (market?.resolved) {
            const resolvedYes = Boolean(market.outcome);
            marketStatus = `Resolved (${resolvedYes ? "YES" : "NO"})`;
            const won = isYes === resolvedYes;
            if (won) {
              payoutState = bet.claimed ? "Claimed" : "Won (Unclaimed)";
              const winningPool = resolvedYes ? Number(market.total_yes) : Number(market.total_no);
              const totalPool = Number(market.total_yes) + Number(market.total_no);
              returns = winningPool > 0
                ? ((rawAmount / winningPool) * totalPool / 10_000_000).toFixed(2)
                : stake;
            } else {
              payoutState = "Lost";
              returns = "0.00";
            }
          } else if (market) {
            const sidePool = isYes ? Number(market.total_yes) : Number(market.total_no);
            const totalPool = Number(market.total_yes) + Number(market.total_no);
            if (sidePool > 0 && totalPool > 0) {
              returns = ((rawAmount / sidePool) * totalPool / 10_000_000).toFixed(2);
            }
          }

          return {
            marketId: id,
            title: market?.question || `Market #${id}`,
            outcome,
            stake,
            returns,
            marketStatus,
            payoutState,
            status: "confirmed",
            explorerUrl: `https://stellar.expert/explorer/testnet/contract/${TESTNET.predictionMarketContract}`,
            time: "On-chain",
          };
        } catch {
          return null;
        }
      })
    );

    return positions.filter(Boolean);
  } catch (err) {
    console.warn("Could not load user on-chain positions:", err);
    return [];
  }
}

export const units = Object.freeze({ xlmToStroops });

