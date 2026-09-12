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
    sdkPromise = import(SDK_URL).catch((error) => {
      sdkPromise = null;
      throw new Error(`Stellar SDK could not load: ${error.message}`);
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

export const units = Object.freeze({ xlmToStroops });
