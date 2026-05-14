# Monero Mining Calculator

A browser-based Monero (XMR) mining profitability calculator. No build step, no dependencies — just open the HTML file.

![dark theme screenshot placeholder](https://img.shields.io/badge/theme-dark%20%2F%20light-FF6600?style=flat)
![vanilla js](https://img.shields.io/badge/vanilla-JS-F7DF1E?style=flat)

## Features

- Live XMR price (CoinGecko) and network difficulty (xmrchain.net) fetched on load
- Profitability breakdown by day / week / month / year
- 10 CPU presets for RandomX (Ryzen, Threadripper, Intel)
- 5 mining pool presets with fee auto-fill
- ROI and break-even calculation based on hardware cost
- Dark / light theme, persisted across sessions

## Running locally

```bash
git clone https://github.com/Bij4n/monero-mining-calculator.git
cd monero-mining-calculator
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

Any static file server works — there is no build step and no npm.

## Deploying

### GitHub Pages

1. Go to **Settings → Pages** in the repo
2. Set source to **Deploy from a branch → main → / (root)**
3. Save — the site will be live at `https://<your-username>.github.io/monero-mining-calculator`

### Netlify

Drag and drop the project folder onto [app.netlify.com/drop](https://app.netlify.com/drop), or connect the GitHub repo and set:
- **Build command:** *(leave empty)*
- **Publish directory:** `.`

### Vercel

```bash
npm i -g vercel
vercel --yes
```

No framework preset needed. Vercel will serve the static files directly.

### Any static host

Upload the files as-is. The entire site is the root `index.html` plus the `css/` and `js/` folders.

## Data sources

| Data | Source | Refresh |
|------|--------|---------|
| XMR price + 24h change | [CoinGecko](https://www.coingecko.com) free API | Every 5 min |
| Network difficulty + hashrate | [xmrchain.net](https://xmrchain.net) | Every 10 min |
| Block reward | Hardcoded (~0.6261 XMR) | Edit `js/config.js` to update |

All values are editable in the form. If the APIs are unavailable the calculator falls back to the defaults in `js/config.js`.

> **Note:** CoinGecko's free tier allows ~10k requests/month per IP. For high-traffic deployments, proxy the price request through your own backend or use a paid CoinGecko API key set in `js/config.js`.

## Customising

**Hardware presets** — edit `js/hardware.js`. Each entry needs `name`, `hashRate` (H/s), `powerW`, and `price` (USD).

**Mining pools** — edit `js/pools.js`. Each entry needs `name`, `url`, `fee` (%), and `note`.

**Default values** (difficulty, block reward, electricity cost) — edit `js/config.js`.
