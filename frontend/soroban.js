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
      2: "This market is not open.",
      3: "This market has already ended.",
      4: "This market has already been resolved.",
      5: "The position amount is below the contract minimum.",
      6: "A position already exists on the opposite outcome.",
      7: "The requested market does not exist.",
    };
    return known[code] || `The contract rejected this transaction (error ${code}).`;
  }
  return message;
}

async function waitForTransaction(server, hash, attempts = 30) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await server.getTransaction(hash);
    if (result.status === "SUCCESS") return result;
    if (result.status === "FAILED") throw new Error("The transaction failed on Stellar Testnet.");
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("The transaction is still pending. Check it in the Testnet explorer.");
}

export async function placeBet({ address, marketId, isYes, amountXlm, signTransaction, onStatus }) {
  if (!address) throw new Error("Connect a funded Testnet wallet first.");
  if (!Number.isSafeInteger(marketId) || marketId < 1) throw new Error("Invalid on-chain market ID.");
  if (typeof signTransaction !== "function") throw new Error("Wallet signing is unavailable.");

  const amount = xlmToStroops(amountXlm);
  const sdk = await loadSdk();
  const { Address, BASE_FEE, Contract, Networks, TransactionBuilder, nativeToScVal, rpc } = sdk;
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
      new Address(address).toScVal(),
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
    throw new Error(submission.errorResult ? "Stellar RPC rejected the transaction." : `Unexpected submission status: ${submission.status}`);
  }

  onStatus?.("Waiting for confirmation");
  await waitForTransaction(server, submission.hash);
  return {
    hash: submission.hash,
    explorerUrl: `${TESTNET.explorerUrl}/${submission.hash}`,
    amountStroops: amount,
  };
}

export const units = Object.freeze({ xlmToStroops });
