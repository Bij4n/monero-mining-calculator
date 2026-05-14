function calculateProfitability({
  hashRate, unitMultiplier, powerW, electricityUsdKwh,
  poolFeePct, hardwareCostUsd, xmrPriceUsd, difficulty, blockRewardXmr,
}) {
  const hashRateHps = hashRate * unitMultiplier;
  if (hashRateHps <= 0 || difficulty <= 0 || xmrPriceUsd <= 0) return null;

  // Your share of network hashrate; Monero difficulty = avg hashes to find a block
  const networkHps = difficulty / CONFIG.BLOCK_TIME_SEC;
  const yourSharePct = (hashRateHps / networkHps) * 100;

  // Daily XMR: (your_hashes_per_day × block_reward) / difficulty
  const dailyXmrGross = (hashRateHps * 86400 * blockRewardXmr) / difficulty;
  const dailyXmr = dailyXmrGross * (1 - poolFeePct / 100);

  const dailyRevenue = dailyXmr * xmrPriceUsd;
  const dailyElec = (powerW / 1000) * electricityUsdKwh * 24;
  const dailyProfit = dailyRevenue - dailyElec;

  const period = (mult) => ({
    xmr: dailyXmr * mult,
    revenue: dailyRevenue * mult,
    electricity: dailyElec * mult,
    profit: dailyProfit * mult,
  });

  const yearly = period(365);

  return {
    hashRateHps,
    networkHps,
    yourSharePct,
    periods: {
      daily:   period(1),
      weekly:  period(7),
      monthly: period(30),
      yearly,
    },
    breakEvenDays: (hardwareCostUsd > 0 && dailyProfit > 0)
      ? Math.ceil(hardwareCostUsd / dailyProfit)
      : null,
    roiPct: hardwareCostUsd > 0
      ? (yearly.profit / hardwareCostUsd) * 100
      : null,
    elecCostPerXmr: dailyXmr > 0
      ? dailyElec / dailyXmr
      : null,
  };
}

// ── Formatting helpers ──────────────────────────────────────────────────────

function fmtHashRate(hps) {
  if (hps >= 1e9) return `${(hps / 1e9).toFixed(2)} GH/s`;
  if (hps >= 1e6) return `${(hps / 1e6).toFixed(2)} MH/s`;
  if (hps >= 1e3) return `${(hps / 1e3).toFixed(2)} KH/s`;
  return `${hps.toFixed(0)} H/s`;
}

function fmtXmr(xmr) {
  if (xmr >= 1)      return `${xmr.toFixed(4)} XMR`;
  if (xmr >= 0.001)  return `${xmr.toFixed(6)} XMR`;
  return `${(xmr * 1e6).toFixed(4)} μXMR`;
}

function fmtUsd(usd) {
  const abs = Math.abs(usd);
  const sign = usd < 0 ? '-' : '';
  if (abs >= 10000) return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (abs >= 100)   return `${sign}$${abs.toFixed(2)}`;
  return `${sign}$${abs.toFixed(4)}`;
}

function fmtDays(days) {
  if (days === null) return '—';
  if (days > 3650) return '> 10 yr';
  if (days >= 365) return `${(days / 365).toFixed(1)} yr`;
  return `${days.toLocaleString()} days`;
}
