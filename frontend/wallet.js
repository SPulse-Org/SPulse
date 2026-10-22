import { getPulseWalletData, claimPendingRewards } from "./soroban.js";

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const FRIENDbot = "https://friendbot.stellar.org";
const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

const state = { address: "", balance: null, pulseBalance: null, pendingRewards: null, tokenSymbol: "PULSE", network: "" };
const connectButton = document.querySelector("#connect-wallet");
const panelAction = document.querySelector("#wallet-panel-action");
const claimButton = document.querySelector("#wallet-claim-rewards");
const panelTitle = document.querySelector("#wallet-panel-title");
const panelDetail = document.querySelector("#wallet-panel-detail");
const LOCAL_API_PATH = "./vendor/freighter-api.js";
const CDN_API_URL = "https://esm.sh/@stellar/freighter-api@5.0.0?bundle";
let apiPromise;

function loadApi() {
  if (!apiPromise) {
    apiPromise = import(LOCAL_API_PATH).catch((localErr) => {
      console.warn("Vendored Freighter API fallback to CDN:", localErr);
      return import(CDN_API_URL).catch(() => {
        apiPromise = null;
        throw new Error("Wallet service could not load. Check your connection or browser privacy settings.");
      });
    });
  }
  return apiPromise;
}

function shorten(address) {
  return address ? `${address.slice(0, 5)}…${address.slice(-5)}` : "";
}

function errorMessage(error) {
  if (!error) return "Wallet request failed";
  if (typeof error === "string") return error;
  return error.message || error.error?.message || "Wallet request failed";
}

function setBusy(message) {
  connectButton.disabled = true;
  connectButton.querySelector("span").textContent = message;
  panelAction.disabled = true;
}

function render() {
  connectButton.disabled = false;
  panelAction.disabled = false;
  if (!state.address) {
    connectButton.classList.remove("connected");
    connectButton.querySelector("span").textContent = "Connect wallet";
    panelTitle.textContent = "Wallet not connected";
    panelDetail.textContent = "Connect Freighter on Stellar testnet";
    panelAction.textContent = "Connect";
    panelAction.dataset.action = "connect";
    if (claimButton) claimButton.hidden = true;
    return;
  }

  connectButton.classList.add("connected");
  connectButton.querySelector("span").textContent = shorten(state.address);
  panelTitle.textContent = shorten(state.address);
  const xlmPart = state.balance === null
    ? "Stellar testnet"
    : `${state.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} test XLM`;
  const pulsePart = state.pulseBalance !== null
    ? ` · ${state.pulseBalance} ${state.tokenSymbol || "PULSE"}`
    : "";
  panelDetail.textContent = `${xlmPart}${pulsePart} · Testnet`;
  panelAction.textContent = state.balance === 0 ? "Fund" : "Disconnect";
  panelAction.dataset.action = state.balance === 0 ? "fund" : "disconnect";

  if (claimButton) {
    if (state.pendingRewards && Number(state.pendingRewards) > 0) {
      claimButton.hidden = false;
      claimButton.disabled = false;
      claimButton.textContent = `Claim ${state.pendingRewards} ${state.tokenSymbol || "PULSE"}`;
    } else {
      claimButton.hidden = true;
    }
  }
}

async function loadBalance() {
  try {
    const response = await fetch(`${HORIZON_TESTNET}/accounts/${state.address}`);
    if (response.status === 404) { state.balance = 0; }
    else if (!response.ok) throw new Error("Balance unavailable");
    else {
      const account = await response.json();
      const native = account.balances.find((item) => item.asset_type === "native");
      state.balance = native ? Number(native.balance) : 0;
    }
  } catch {
    state.balance = null;
  }

  try {
    const pulseData = await getPulseWalletData(state.address);
    state.pulseBalance = pulseData.balance;
    state.tokenSymbol = pulseData.symbol || "PULSE";
    state.pendingRewards = pulseData.pendingRewards;
  } catch (err) {
    console.warn("Could not load PULSE token data:", err);
  }
}

async function refreshBalance() {
  if (!state.address) return null;
  await loadBalance();
  render();
  return state.balance;
}

async function signWalletTransaction(transactionXdr, options = {}) {
  if (!state.address) throw new Error("Connect Freighter before signing a transaction.");
  await validateNetwork();
  const { signTransaction } = await loadApi();
  const result = await signTransaction(transactionXdr, {
    address: state.address,
    networkPassphrase: TESTNET_PASSPHRASE,
    ...options,
  });
  if (result.error) throw new Error(errorMessage(result.error));
  return result;
}

async function validateNetwork() {
  const { getNetwork } = await loadApi();
  const result = await getNetwork();
  if (result.error) throw new Error(errorMessage(result.error));
  state.network = result.network;
  if (result.networkPassphrase !== TESTNET_PASSPHRASE && result.network !== "TESTNET") {
    throw new Error("Switch Freighter to Testnet, then connect again.");
  }
}

async function connect() {
  setBusy("Connecting…");
  try {
    const { isConnected, requestAccess } = await loadApi();
    const installed = await isConnected();
    if (installed.error || !installed.isConnected) {
      throw new Error("Freighter is not installed. Install it from freighter.app first.");
    }
    const result = await requestAccess();
    if (result.error || !result.address) throw new Error(errorMessage(result.error));
    await validateNetwork();
    state.address = result.address;
    await loadBalance();
    render();
    window.dispatchEvent(new CustomEvent("spulse:wallet", { detail: { ...state } }));
  } catch (error) {
    state.address = "";
    render();
    window.showWalletNotice?.(errorMessage(error), true);
  }
}

async function restore() {
  try {
    const { getAddress, isConnected } = await loadApi();
    const installed = await isConnected();
    if (!installed.isConnected) return;
    const result = await getAddress();
    if (!result.address || result.error) return;
    await validateNetwork();
    state.address = result.address;
    await loadBalance();
    render();
  } catch { render(); }
}

async function fund() {
  setBusy("Funding…");
  try {
    const response = await fetch(`${FRIENDbot}?addr=${encodeURIComponent(state.address)}`);
    if (!response.ok) throw new Error("Friendbot could not fund this account right now.");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await loadBalance();
    render();
    window.showWalletNotice?.("Testnet account funded with test XLM.");
  } catch (error) {
    render();
    window.showWalletNotice?.(errorMessage(error), true);
  }
}

function disconnect() {
  state.address = "";
  state.balance = null;
  state.pulseBalance = null;
  state.pendingRewards = null;
  render();
  window.dispatchEvent(new CustomEvent("spulse:wallet", { detail: { ...state } }));
}

connectButton.addEventListener("click", () => state.address ? disconnect() : connect());
panelAction.addEventListener("click", () => {
  if (panelAction.dataset.action === "fund") fund();
  else if (panelAction.dataset.action === "disconnect") disconnect();
  else connect();
});

claimButton?.addEventListener("click", async () => {
  if (!state.address || claimButton.disabled) return;
  claimButton.disabled = true;
  const originalText = claimButton.textContent;
  try {
    claimButton.textContent = "Claiming…";
    window.showWalletNotice?.("Preparing reward claim transaction...", false);
    await claimPendingRewards({
      address: state.address,
      signTransaction: signWalletTransaction,
      onStatus: (status) => {
        claimButton.textContent = status;
      },
    });
    window.showWalletNotice?.("Rewards claimed successfully! Updating balance...", false);
    await refreshBalance();
  } catch (error) {
    claimButton.disabled = false;
    claimButton.textContent = originalText;
    window.showWalletNotice?.(errorMessage(error), true);
  }
});

window.stellarWallet = {
  connect,
  disconnect,
  getState: () => ({ ...state }),
  refreshBalance,
  signTransaction: signWalletTransaction,
};
render();
restore();
