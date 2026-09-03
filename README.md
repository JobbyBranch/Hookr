[README (1).md](https://github.com/user-attachments/files/31812190/README.1.md)
# Hookr.fun analytics dashboard (unofficial)

A single-file, static analytics dashboard for [hookr.fun](https://hookr.fun) — the Uniswap v4 hook launchpad on Robinhood Chain (chain id 4663). No backend, no build step, no API keys. Everything is fetched client-side from public APIs, so it deploys straight to GitHub Pages.

## What it shows

| Metric | Source |
|---|---|
| Total $HOOKR burned (+ % of 1B supply) | Blockscout: `HOOKR.balanceOf(0xdEaD) + balanceOf(0x0)` |
| Price, market cap, 24h volume, 24h change | CoinGecko public API (`hookr-fun`) |
| 30-day price chart | CoinGecko `market_chart` |
| HOOKR holders | Blockscout token endpoint |
| Lifetime launchpad transactions & token transfers | Blockscout address counters |
| Active wallets (unique senders, recent window) | Blockscout tx pages, deduped `from` |
| Daily launchpad transactions chart | Same tx pages, bucketed per day |
| New contracts deployed by the launchpad (≈ new launches) | Blockscout internal transactions, `create` type |
| Launchpad ETH balance | Blockscout address endpoint |
| Recent tx + recent launch tables | Blockscout, linked to the explorer |

Key addresses (editable in the `CONFIG` block at the top of the script in `index.html`):

- Launchpad: `0xa043caBE645636899dDe91Cce4693C00a015e660`
- $HOOKR token: `0x18E674231A58c239Dc7DaeDcffE15Ec3A24cff5c`
- Explorer: `https://robinhoodchain.blockscout.com`

## Deploy on GitHub Pages

1. Create a new repo on GitHub (e.g. `hookr-dashboard`).
2. Add `index.html` and this `README.md` to the repo root and push:
   ```bash
   git init
   git add index.html README.md
   git commit -m "Hookr analytics dashboard"
   git branch -M main
   git remote add origin https://github.com/<you>/hookr-dashboard.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / root → Save**.
4. Your dashboard goes live at `https://<you>.github.io/hookr-dashboard/` within a minute or two.

To test locally, just open `index.html` in a browser, or run `python3 -m http.server` in the folder.

## Tuning

In the `CONFIG` object in `index.html`:

- `TX_PAGES` — how many pages of launchpad transactions to index (≈50 txs/page). More pages = longer daily-activity chart and better "active wallets" count, but more requests.
- `INTERNAL_PAGES` — how far back to scan for contract creations (new launches).
- All addresses and API bases are swappable if contracts migrate.

## Honest-data notes

- When a source doesn't answer, values render as a dash — **unknown is not zero** (mirroring hookr.fun's own methodology).
- "Active wallets" and "new contracts deployed" cover only the fetched window, not lifetime; the labels say so.
- CoinGecko's free API rate-limits aggressively; if the price cards show a dash, hit Refresh after ~60s.
- Protocol fees accrue to a burner contract whose address isn't published on the site; the launchpad ETH balance card is the closest on-chain proxy. If you find the burner address on-chain, you can add a card for it easily.

Unofficial project. Not affiliated with hookr.fun. Not financial advice.
