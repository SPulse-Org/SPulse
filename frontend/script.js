import { placeBet } from "./soroban.js";

const HORIZON_URL = "https://horizon.stellar.org";
const COINGECKO_URL = "https://api.coingecko.com/api/v3";
const POSITION_STORAGE_KEY = "spulse:session-positions";
const TESTNET_EXPLORER_PREFIX = "https://stellar.expert/explorer/testnet/tx/";

const state = { price: null, change: null, selectedMarket: 0, outcome: "yes", positions: [] };
const baseMarkets = [
  { category: "crypto", title: "Will Stellar XLM trade above $0.50 before September 30, 2026?", detail: "Live Stellar Testnet market #3. Resolution is controlled by the deployed SPulse market contract.", yes: 50, volume: "Testnet live", close: "Sep 30, 2026", onchainId: 3 },
  { category: "network", title: "Will Stellar pass 70 million ledgers this year?", detail: "Resolves from the public Stellar mainnet ledger sequence.", yes: 68, volume: "Preview", close: "Dec 31" },
  { category: "network", title: "Will average ledger close stay below 6 seconds?", detail: "Measured against public Horizon ledger timestamps.", yes: 76, volume: "Preview", close: "7-day window" },
  { category: "crypto", title: "Will XLM gain 10% over the next seven days?", detail: "Resolves from the CoinGecko XLM/USD seven-day price change.", yes: 47, volume: "Preview", close: "7 days" },
  { category: "network", title: "Will mainnet process 100+ operations in one ledger?", detail: "Resolves from operation counts published by Stellar Horizon.", yes: 61, volume: "Preview", close: "24 hours" },
  { category: "crypto", title: "Will XLM outperform Bitcoin this month?", detail: "Compares monthly USD returns from the same public pricing source.", yes: 43, volume: "Preview", close: "Month end" },
];

function loadPositions() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(POSITION_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    const marketTitles = new Set(baseMarkets.map((market) => market.title));
    return saved.filter((position) => {
      if (!position || typeof position !== "object") return false;
      const validExplorer = !position.explorerUrl
        || (typeof position.explorerUrl === "string" && position.explorerUrl.startsWith(TESTNET_EXPLORER_PREFIX));
      return marketTitles.has(position.title)
        && ["yes", "no"].includes(position.outcome)
        && /^\d{1,4}(\.\d{1,2})?$/.test(position.stake)
        && /^\d{1,8}(\.\d{1,2})?$/.test(position.returns)
        && typeof position.time === "string"
        && /^[0-9: APMapm.]{1,20}$/.test(position.time)
        && validExplorer;
    }).slice(0, 20);
  } catch {
    return [];
  }
}

function savePositions() {
  try {
    sessionStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(state.positions.slice(0, 20)));
  } catch {
    // Storage can be unavailable in private browsing; positions still work in memory.
  }
}

state.positions = loadPositions();

const $ = (selector) => document.querySelector(selector);
const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value);
const formatPrice = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);

function setUpdated() {
  $("#last-updated").textContent = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date());
}

async function fetchJson(url, timeout = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

async function updateNetwork() {
  try {
    const data = await fetchJson(`${HORIZON_URL}/ledgers?order=desc&limit=1`);
    const ledger = data._embedded.records[0];
    const age = Math.max(0, Math.round((Date.now() - new Date(ledger.closed_at).getTime()) / 1000));
    $("#latest-ledger").textContent = `#${formatNumber(ledger.sequence)}`;
    $("#ledger-age").textContent = age < 60 ? `${age}s ago` : `${Math.floor(age / 60)}m ago`;
    $("#operation-count").textContent = formatNumber(ledger.operation_count);
    $("#network-state").textContent = "Live";
    $("#network-state").classList.add("online");
    $("#connection-label").textContent = "Live on Stellar mainnet";
    setUpdated();
  } catch (error) {
    $("#network-state").textContent = "Unavailable";
    $("#connection-label").textContent = "Public data temporarily unavailable";
    console.warn("Stellar network data could not be loaded", error);
  }
}

function renderChart(prices) {
  const values = prices.map((point) => point[1]);
  const min = Math.min(...values), max = Math.max(...values), spread = max - min || 1;
  const width = 500, height = 126, pad = 5;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * width},${pad + (1 - (value - min) / spread) * (height - pad * 2)}`).join(" ");
  const area = `0,${height} ${points} ${width},${height}`;
  $("#price-chart").innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Seven day XLM price movement"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7df7bd" stop-opacity=".24"/><stop offset="1" stop-color="#7df7bd" stop-opacity="0"/></linearGradient></defs><polyline class="area" points="${area}"/><polyline points="${points}" vector-effect="non-scaling-stroke"/></svg>`;
  $("#price-range").textContent = `${formatPrice(min)} – ${formatPrice(max)}`;
}

async function updatePrice() {
  try {
    const [spot, chart] = await Promise.all([
      fetchJson(`${COINGECKO_URL}/simple/price?ids=stellar&vs_currencies=usd&include_24hr_change=true`),
      fetchJson(`${COINGECKO_URL}/coins/stellar/market_chart?vs_currency=usd&days=7&interval=hourly`),
    ]);
    state.price = spot.stellar.usd;
    state.change = spot.stellar.usd_24h_change;
    $("#xlm-price").textContent = formatPrice(state.price);
    const change = $("#xlm-change");
    change.textContent = `${state.change >= 0 ? "+" : ""}${state.change.toFixed(2)}% 24h`;
    change.classList.toggle("negative", state.change < 0);
    renderChart(chart.prices);
    renderMarkets();
    selectMarket(state.selectedMarket, false);
    setUpdated();
  } catch (error) {
    $("#xlm-change").textContent = "Unavailable";
    $("#price-chart").innerHTML = '<span class="chart-loading">Price feed temporarily unavailable</span>';
    console.warn("XLM price data could not be loaded", error);
  }
}

function renderMarkets(filter = "all") {
  const markets = baseMarkets.map((market) => {
    if (!market.dynamic || !state.price) return market;
    const distance = (state.price - .5) / .5;
    return { ...market, yes: Math.max(8, Math.min(92, Math.round(50 + distance * 50))), detail: `XLM is currently ${formatPrice(state.price)}. Resolves from the CoinGecko daily close.` };
  }).filter((market) => filter === "all" || market.category === filter);
  $("#market-list").innerHTML = markets.map((market) => {
    const index = baseMarkets.findIndex((item) => item.title === market.title);
    const badge = market.onchainId ? `<span class="market-badge live">Testnet #${market.onchainId}</span>` : '<span class="market-badge">Demonstration</span>';
    const action = market.onchainId ? "Place position" : "Preview market";
    return `<article class="market-card"><div class="market-card-header"><span class="category">${market.category}</span>${badge}</div><h3>${market.title}</h3><p>${market.detail}</p><div class="probability" aria-label="Yes ${market.yes} percent"><span style="width:${market.yes}%"></span></div><div class="outcomes"><strong class="yes">Yes ${market.yes}%</strong><strong class="no">No ${100 - market.yes}%</strong></div><div class="market-card-action"><div class="market-meta"><span>${market.close}</span></div><button class="trade-link" type="button" data-trade-index="${index}">${action} <svg><use href="#i-arrow" /></svg></button></div></article>`;
  }).join("");
}

function currentMarket() {
  const market = { ...baseMarkets[state.selectedMarket] };
  if (market.dynamic && state.price) {
    market.yes = Math.max(8, Math.min(92, Math.round(50 + ((state.price - .5) / .5) * 50)));
    market.detail = `XLM is currently ${formatPrice(state.price)}. Resolves from the CoinGecko daily close.`;
  }
  return market;
}

function updateOrderPreview() {
  const market = currentMarket();
  const probability = state.outcome === "yes" ? market.yes : 100 - market.yes;
  const stake = Math.max(0, Number($("#stake-amount").value) || 0);
  const price = probability / 100;
  const returns = price ? stake / price : 0;
  $("#average-price").textContent = `${price.toFixed(2)} XLM`;
  $("#potential-return").textContent = `${returns.toFixed(2)} XLM`;
  $("#potential-profit").textContent = `${Math.max(0, returns - stake).toFixed(2)} XLM`;
}

function selectMarket(index, scroll = true) {
  state.selectedMarket = index;
  const market = currentMarket();
  $("#trade-category").textContent = market.category;
  $("#trade-title").textContent = market.title;
  $("#trade-detail").textContent = market.detail;
  $("#trade-close").textContent = market.close;
  $("#trade-probability").textContent = `${market.yes}% Yes`;
  $("#trade-probability-bar").style.width = `${market.yes}%`;
  $("#yes-price").textContent = `${market.yes}%`;
  $("#no-price").textContent = `${100 - market.yes}%`;
  const submitLabel = $("#submit-order span");
  const mode = $("#trade-mode");
  if (market.onchainId) {
    submitLabel.textContent = "Place Testnet position";
    mode.innerHTML = '<svg><use href="#i-zap" /></svg> Live Testnet market';
    mode.classList.add("live");
    $("#trade-status").textContent = "Testnet open";
    $("#order-disclaimer").textContent = "Freighter will show the exact contract transaction before anything is submitted.";
  } else {
    submitLabel.textContent = "Preview position";
    mode.innerHTML = '<svg><use href="#i-help" /></svg> Simulation mode';
    mode.classList.remove("live");
    $("#trade-status").textContent = "Preview";
    $("#order-disclaimer").textContent = "No funds will move. This interface demonstrates the intended trading flow.";
  }
  updateOrderPreview();
  if (scroll) $("#trade").scrollIntoView({ behavior: "smooth" });
}

function renderPositions() {
  if (!state.positions.length) return;
  $("#position-list").innerHTML = state.positions.map((position) => {
    const result = position.explorerUrl
      ? `<a class="position-result onchain" href="${position.explorerUrl}" target="_blank" rel="noreferrer">Confirmed <svg><use href="#i-external" /></svg></a>`
      : '<span class="position-result">Simulated</span>';
    return `<article class="position-card"><div><h3>${position.title}</h3><p>Created ${position.time}</p></div><div class="position-stat"><span>Outcome</span><strong class="${position.outcome}">${position.outcome.toUpperCase()}</strong></div><div class="position-stat"><span>Stake</span><strong>${position.stake} XLM</strong></div><div class="position-stat"><span>Potential return</span><strong>${position.returns} XLM</strong></div>${result}</article>`;
  }).join("");
}

function showToast(message, isError = false) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = `toast${isError ? " toast-error" : ""}`;
  toast.setAttribute("role", isError ? "alert" : "status");
  toast.setAttribute("aria-live", isError ? "assertive" : "polite");
  toast.innerHTML = '<svg aria-hidden="true"><use href="#i-check" /></svg><span></span>';
  toast.querySelector("span").textContent = String(message);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

window.showWalletNotice = (message, isError = false) => {
  showToast(message, isError);
};

document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
  button.classList.add("active"); renderMarkets(button.dataset.filter);
}));

$("#market-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-trade-index]");
  if (button) selectMarket(Number(button.dataset.tradeIndex));
});

document.querySelectorAll("[data-outcome]").forEach((button) => button.addEventListener("click", () => {
  state.outcome = button.dataset.outcome;
  document.querySelectorAll("[data-outcome]").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  updateOrderPreview();
}));
$("#stake-amount").addEventListener("input", updateOrderPreview);
document.querySelectorAll("[data-amount]").forEach((button) => button.addEventListener("click", () => { $("#stake-amount").value = button.dataset.amount; updateOrderPreview(); }));

$("#order-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const stake = Math.max(1, Math.min(1000, Number($("#stake-amount").value) || 1));
  const market = currentMarket();
  const probability = state.outcome === "yes" ? market.yes : 100 - market.yes;
  const position = { title: market.title, outcome: state.outcome, stake: stake.toFixed(0), returns: (stake / (probability / 100)).toFixed(2), time: new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date()) };

  if (!market.onchainId) {
    state.positions.unshift(position);
    savePositions();
    renderPositions();
    showToast("Position added to your simulation dashboard.");
    $("#activity").scrollIntoView({ behavior: "smooth" });
    return;
  }

  const wallet = window.stellarWallet;
  const walletState = wallet?.getState();
  if (!walletState?.address) {
    window.showWalletNotice("Connect a funded Freighter Testnet wallet first.", true);
    await wallet?.connect();
    return;
  }
  if (walletState.balance === 0) {
    window.showWalletNotice("Fund your Testnet wallet before placing a position.", true);
    return;
  }
  if (Number.isFinite(walletState.balance) && stake + 1 > walletState.balance) {
    window.showWalletNotice("Leave at least 1 test XLM available for account reserves and fees.", true);
    return;
  }

  const submit = $("#submit-order");
  const label = submit.querySelector("span");
  const originalLabel = label.textContent;
  submit.disabled = true;
  try {
    const transaction = await placeBet({
      address: walletState.address,
      marketId: market.onchainId,
      isYes: state.outcome === "yes",
      amountXlm: String(stake),
      signTransaction: wallet.signTransaction,
      onStatus: (status) => { label.textContent = status; },
    });
    state.positions.unshift({ ...position, explorerUrl: transaction.explorerUrl, hash: transaction.hash });
    savePositions();
    renderPositions();
    await wallet.refreshBalance();
    showToast("Position confirmed on Stellar Testnet.");
    $("#activity").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    window.showWalletNotice(error.message || "The Testnet position could not be submitted.", true);
  } finally {
    submit.disabled = false;
    label.textContent = originalLabel;
  }
});

document.querySelectorAll("[data-dashboard]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-dashboard]").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  const showPositions = button.dataset.dashboard === "positions";
  $("#positions-view").hidden = !showPositions;
  $("#feed-view").hidden = showPositions;
}));

const menuButton = $(".menu-button");
const siteNav = $("#main-navigation");

function setMenuOpen(open, returnFocus = false) {
  siteNav.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  if (open) requestAnimationFrame(() => siteNav.querySelector("a")?.focus());
  else if (returnFocus) menuButton.focus();
}

menuButton.addEventListener("click", () => setMenuOpen(!siteNav.classList.contains("open")));
siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuOpen(false)));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && siteNav.classList.contains("open")) setMenuOpen(false, true);
});
document.addEventListener("pointerdown", (event) => {
  if (siteNav.classList.contains("open") && !event.target.closest(".nav-wrap")) setMenuOpen(false);
});
window.matchMedia("(min-width: 681px)").addEventListener("change", (event) => {
  if (event.matches) setMenuOpen(false);
});

$("#year").textContent = new Date().getFullYear();
renderMarkets();
selectMarket(0, false);
renderPositions();
updateNetwork();
updatePrice();
setInterval(updateNetwork, 10000);
setInterval(updatePrice, 60000);
