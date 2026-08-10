const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const FRIENDbot = "https://friendbot.stellar.org";
const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

const state = { address: "", balance: null, network: "" };
const connectButton = document.querySelector("#connect-wallet");
const panelAction = document.querySelector("#wallet-panel-action");
const panelTitle = document.querySelector("#wallet-panel-title");
const panelDetail = document.querySelector("#wallet-panel-detail");
let apiPromise;

function loadApi() {
  if (!apiPromise) {
    apiPromise = import("https://esm.sh/@stellar/freighter-api@5.0.0?bundle")
      .catch(() => {
        apiPromise = null;
        throw new Error("Wallet service could not load. Check your connection or browser privacy settings.");
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
    return;
  }

  connectButton.classList.add("connected");
  connectButton.querySelector("span").textContent = shorten(state.address);
  panelTitle.textContent = shorten(state.address);
  panelDetail.textContent = state.balance === null
    ? "Stellar testnet"
    : `${state.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} test XLM · Testnet`;
  panelAction.textContent = state.balance === 0 ? "Fund" : "Disconnect";
  panelAction.dataset.action = state.balance === 0 ? "fund" : "disconnect";
}

async function loadBalance() {
  try {
    const response = await fetch(`${HORIZON_TESTNET}/accounts/${state.address}`);
    if (response.status === 404) { state.balance = 0; return; }
    if (!response.ok) throw new Error("Balance unavailable");
    const account = await response.json();
    const native = account.balances.find((item) => item.asset_type === "native");
    state.balance = native ? Number(native.balance) : 0;
  } catch {
    state.balance = null;
  }
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
  render();
  window.dispatchEvent(new CustomEvent("spulse:wallet", { detail: { ...state } }));
}

connectButton.addEventListener("click", () => state.address ? disconnect() : connect());
panelAction.addEventListener("click", () => {
  if (panelAction.dataset.action === "fund") fund();
  else if (panelAction.dataset.action === "disconnect") disconnect();
  else connect();
});

window.stellarWallet = { connect, disconnect, getState: () => ({ ...state }) };
render();
restore();
