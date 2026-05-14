# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running locally

```bash
python3 -m http.server 8787
# open http://localhost:8787
```

No build step, no npm. Pure vanilla JS loaded via `<script src="...">` tags.

## Architecture

Single-page calculator. All globals — scripts load in this order and each builds on the previous:

| File | Responsibility |
|------|----------------|
| `js/config.js` | `CONFIG` object — API URLs, cache TTLs, defaults |
| `js/hardware.js` | `HARDWARE_PRESETS[]` — CPU hash rates / power / prices |
| `js/pools.js` | `MINING_POOLS[]` — fee percentages |
| `js/calculator.js` | `calculateProfitability(inputs)` + `fmtXmr/fmtUsd/fmtHashRate/fmtDays` |
| `js/api.js` | `fetchXmrPrice()`, `fetchNetworkInfo()` — CoinGecko + Minerstat, with daemon RPC fallback |
| `js/app.js` | DOM wiring, event listeners, `calculate()`, `renderResults()`, `refreshLiveData()` |

## Core formula

```
daily_xmr = (hashrate_hps × 86400 × block_reward_xmr) / difficulty
```

Monero difficulty equals the average number of hashes to find a block (no `× 2³²` like Bitcoin).
Network hashrate = `difficulty / 120` (2-minute block time).

## Key Monero constants

- Block time: **120 seconds** (720 blocks/day)
- Algorithm: **RandomX** — CPU-optimized, ASIC/GPU resistant
- Block reward: **~0.6 XMR** (tail emission, never drops to zero)
- Difficulty adjusts **every block**

## Live data sources

| Source | Data | Notes |
|--------|------|-------|
| CoinGecko `/simple/price?ids=monero` | XMR price, 24h change | CORS ✓, reliable |
| xmrchain.net `/api/networkinfo` | difficulty (string), hash_rate (number) | CORS `*`, no auth |
| hardcoded `0.6261 XMR` | block reward | No CORS-friendly live source exists; changes very slowly |

All values are pre-filled and user-overridable in the form.

**APIs that don't work from a browser (tested):**
- Minerstat v2 — requires API key (HTTP 401)
- Public Monero daemon RPC nodes — no CORS headers
