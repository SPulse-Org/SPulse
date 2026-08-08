from pathlib import Path

index_html = '''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StellarPulse | Prediction Markets</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="page-shell">
      <header class="site-header">
        <div class="container header-inner">
          <a href="#hero" class="brand">StellarPulse</a>
          <nav class="site-nav">
            <a href="#markets">Markets</a>
            <a href="#leaderboard">Leaderboard</a>
            <a href="#faq">FAQ</a>
          </nav>
        </div>
      </header>

      <main>
        <section id="hero" class="hero-section fade-up">
          <div class="container hero-grid">
            <div class="hero-copy">
              <span class="hero-tag">LIVE ON STELLAR MAINNET</span>
              <h1>Black and green prediction markets.</h1>
              <p>Fast XLM bets, clear odds, instant claim flow, and sharp motion.</p>
              <div class="hero-actions">
                <a class="button button-primary" href="#markets">Explore markets</a>
                <a class="button button-secondary" href="#leaderboard">Leaderboard</a>
              </div>
            </div>
            <aside class="hero-panel fade-left">
              <div class="panel-heading">Platform stats</div>
              <div class="panel-row">
                <div class="panel-value">
                  <span>Markets</span>
                  <strong>12</strong>
                </div>
                <div class="panel-value">
                  <span>Claim speed</span>
                  <strong>5 sec</strong>
                </div>
                <div class="panel-value">
                  <span>Fees</span>
                  <strong>2%</strong>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="markets" class="section-block fade-up">
          <div class="container section-header">
            <p class="eyebrow">Markets</p>
            <h2>Live markets now</h2>
          </div>
          <div id="market-list" class="cards-grid"></div>
        </section>

        <section id="leaderboard" class="section-block section-alt fade-up">
          <div class="container section-header">
            <p class="eyebrow">Leaderboard</p>
            <h2>Top predictors</h2>
          </div>
          <div id="leaderboard-list" class="cards-grid"></div>
        </section>

        <section id="faq" class="section-block fade-up">
          <div class="container section-header">
            <p class="eyebrow">FAQ</p>
            <h2>Quick answers</h2>
          </div>
          <div id="faq-list" class="cards-grid"></div>
        </section>
      </main>

      <footer class="site-footer fade-up">
        <div class="container footer-inner">
          <div>
            <p class="footer-brand">StellarPulse</p>
            <p>Onchain prediction markets with a sharp black and green interface.</p>
          </div>
          <small>© 2026 StellarPulse</small>
        </div>
      </footer>
    </div>
    <script src="script.js"></script>
  </body>
</html>
'''

styles_css = '''
:root {
  color-scheme: dark;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #020903;
  color: #d8ffe7;
  --panel: #05110a;
  --border: #12422b;
  --accent: #22ff92;
  --muted: #8aa18d;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
}

body {
  background: #020903;
  color: #d8ffe7;
}

a {
  color: inherit;
  text-decoration: none;
}

.page-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.container {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #020903;
  border-bottom: 1px solid var(--border);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 0;
}

.brand {
  font-weight: 800;
  letter-spacing: 0.18em;
  font-size: 1rem;
}

.site-nav {
  display: flex;
  gap: 16px;
}

.site-nav a {
  color: var(--muted);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.site-nav a:hover,
.site-nav a:focus-visible {
  color: #ffffff;
}

.hero-section {
  padding: 84px 0 40px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr;
  gap: 32px;
  align-items: start;
}

.hero-copy {
  display: grid;
  gap: 20px;
}

.hero-tag {
  display: inline-flex;
  padding: 12px 16px;
  background: #04120d;
  color: var(--accent);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(2.6rem, 4vw, 3.6rem);
  line-height: 1.05;
}

.hero-copy p {
  margin: 0;
  max-width: 560px;
  font-size: 1rem;
  line-height: 1.8;
  color: var(--muted);
}

.hero-actions {
  display: flex;
  gap: 14px;
}

.button {
  padding: 14px 24px;
  border: 1px solid transparent;
  background: #02110b;
  color: var(--accent);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  transition: transform 0.18s ease, background 0.18s ease;
}

.button:hover {
  transform: translateY(-2px);
  background: #03170f;
}

.button-primary {
  border-color: var(--accent);
  color: #ffffff;
  background: #113d28;
}

.hero-panel {
  background: #030f09;
  border: 1px solid var(--border);
  padding: 24px;
}

.panel-heading {
  color: var(--accent);
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  margin-bottom: 18px;
}

.panel-row {
  display: grid;
  gap: 14px;
}

.panel-value {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  background: #04120c;
  border: 1px solid var(--border);
}

.panel-value span {
  color: var(--muted);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.panel-value strong {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 800;
}

.section-block {
  padding: 56px 0;
}

.section-alt {
  background: #020903;
}

.section-header {
  text-align: center;
  margin-bottom: 32px;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  color: var(--accent);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.section-header h2 {
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
}

.cards-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.feature-card,
.leaderboard-card,
.faq-card {
  background: #030f09;
  border: 1px solid var(--border);
  padding: 24px;
}

.feature-card h3,
.leaderboard-card strong,
.faq-card strong {
  margin: 0 0 10px;
  color: #ffffff;
  font-size: 1.05rem;
}

.feature-card p,
.leaderboard-card p,
.faq-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
  font-size: 0.95rem;
}

.site-footer {
  padding: 36px 0;
  border-top: 1px solid var(--border);
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.footer-brand {
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.footer-inner p,
.footer-inner small {
  margin: 0;
  color: var(--muted);
}

.fade-up,
.fade-left {
  opacity: 0;
  animation: enter 0.75s ease forwards;
}

.fade-left {
  animation-name: enter-left;
}

.fade-up {
  animation-name: enter-up;
}

@keyframes enter-up {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes enter-left {
  from {
    opacity: 0;
    transform: translateX(-18px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 900px) {
  .hero-grid,
  .cards-grid,
  .panel-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .header-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
  }

  .footer-inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
'''

root = Path(__file__).parent
(root / 'index.html').write_text(index_html, encoding='utf-8')
(root / 'styles.css').write_text(styles_css, encoding='utf-8')
print('wrote index.html and styles.css')
