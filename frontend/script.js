const markets = [
  {
    name: "XLM/USD Close Above $0.65",
    description: "Will Stellar Lumens settle above $0.65 at 00:00 UTC on Sep 1, 2026?",
    status: "Open",
    oddsYes: "54%",
    oddsNo: "46%",
    volume: "37.2k XLM",
    closeTime: "Sep 1, 2026",
  },
  {
    name: "Core 20 Activation",
    description: "Will Stellar Core 20 activate onchain before Oct 15, 2026?",
    status: "Open",
    oddsYes: "63%",
    oddsNo: "37%",
    volume: "14.8k XLM",
    closeTime: "Oct 15, 2026",
  },
  {
    name: "Freighter Wallet Growth",
    description: "Will Freighter exceed 2 million active Stellar wallets by Dec 31, 2026?",
    status: "Open",
    oddsYes: "42%",
    oddsNo: "58%",
    volume: "9.5k XLM",
    closeTime: "Dec 31, 2026",
  },
];

const leaderboard = [
  {
    position: 1,
    name: "AvaTrader",
    profit: "+1,250 XLM",
    winRate: "78%",
    bets: 42,
  },
  {
    position: 2,
    name: "NovaStake",
    profit: "+980 XLM",
    winRate: "72%",
    bets: 34,
  },
  {
    position: 3,
    name: "PulseEdge",
    profit: "+740 XLM",
    winRate: "69%",
    bets: 29,
  },
];

const faqList = [
  {
    question: "How do I place a prediction?",
    answer: "Connect your Stellar wallet, pick YES or NO, and stake XLM.",
  },
  {
    question: "How does settlement work?",
    answer: "Resolved markets pay winners automatically onchain.",
  },
];

function renderMarkets() {
  const container = document.getElementById("market-list");
  if (!container) return;
  container.innerHTML = markets
    .map(
      (market) => `
      <article class="feature-card">
        <div class="market-header">
          <h3>${market.name}</h3>
          <span class="market-status">${market.status}</span>
        </div>
        <p>${market.description}</p>
        <div class="market-meta">
          <span>${market.volume}</span>
          <span>Close: ${market.closeTime}</span>
        </div>
        <div class="market-footer">
          <div class="odds-pill odds-yes">YES ${market.oddsYes}</div>
          <div class="odds-pill odds-no">NO ${market.oddsNo}</div>
          <a href="#hero" class="text-link">Place bet</a>
        </div>
      </article>
    `
    )
    .join("");
}

function renderLeaderboard() {
  const container = document.getElementById("leaderboard-list");
  if (!container) return;
  container.innerHTML = leaderboard
    .map(
      (entry) => `
      <article class="leaderboard-card">
        <div class="leaderboard-header">
          <strong>#${entry.position} ${entry.name}</strong>
          <span>${entry.profit}</span>
        </div>
        <p>${entry.winRate} win rate • ${entry.bets} bets</p>
      </article>
    `
    )
    .join("");
}

function renderFaq() {
  const container = document.getElementById("faq-list");
  if (!container) return;
  container.innerHTML = faqList
    .map(
      (item) => `
      <article class="faq-card">
        <strong>${item.question}</strong>
        <p>${item.answer}</p>
      </article>
    `
    )
    .join("");
}

window.addEventListener("DOMContentLoaded", () => {
  renderMarkets();
  renderLeaderboard();
  renderFaq();
});
