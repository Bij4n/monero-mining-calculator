// ── DOM helpers ─────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);
const setVal = (id, v) => { const el = $(id); if (el && v !== '') el.value = v; };
const getNum = (id, fallback = 0) => {
  const v = parseFloat($(id)?.value);
  return isNaN(v) ? fallback : v;
};

// ── Populate selects ─────────────────────────────────────────────────────────

function populatePools() {
  const sel = $('pool-preset');
  MINING_POOLS.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${p.name}${p.fee > 0 ? ` (${p.fee}%)` : ' (0%)'}`;
    sel.appendChild(opt);
  });
}

function populateHardware() {
  const list = $('hardware-list');
  HARDWARE_PRESETS.forEach((hw, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hw-preset-btn';
    btn.dataset.index = i;
    btn.innerHTML = `
      <span class="hw-name">${hw.name}</span>
      <span class="hw-meta">${fmtHashRate(hw.hashRate)} · ${hw.powerW}W · $${hw.price}</span>
    `;
    list.appendChild(btn);
  });
}

// ── Live data fetch ──────────────────────────────────────────────────────────

let _fetching = false;

async function refreshLiveData(force = false) {
  if (_fetching) return;
  _fetching = true;
  setNetworkStatus('loading', 'Fetching…');

  const [priceResult, networkResult] = await Promise.allSettled([
    fetchXmrPrice(),
    fetchNetworkInfo(),
  ]);

  let ok = false;

  if (priceResult.status === 'fulfilled') {
    const { priceUsd, change24h } = priceResult.value;
    setVal('xmr-price', priceUsd.toFixed(2));

    const badge = $('price-change');
    if (change24h !== null) {
      const sign = change24h >= 0 ? '+' : '';
      badge.textContent = `${sign}${change24h.toFixed(2)}% 24h`;
      badge.className = `price-change ${change24h >= 0 ? 'up' : 'down'}`;
    }
    ok = true;
  }

  if (networkResult.status === 'fulfilled' && networkResult.value) {
    const nd = networkResult.value;
    if (nd.difficulty) {
      setVal('difficulty', Math.round(nd.difficulty));
    }
    // Block reward has no CORS-friendly live source; keep the pre-filled default.
    // nd.blockRewardXmr will always be null from xmrchain.net.
    const displayDiff = nd.difficulty ?? getNum('difficulty', CONFIG.DEFAULTS.DIFFICULTY);
    updateNetworkHashDisplay(nd.networkHps ?? displayDiff / CONFIG.BLOCK_TIME_SEC);
    ok = true;
  } else {
    updateNetworkHashDisplay(getNum('difficulty', CONFIG.DEFAULTS.DIFFICULTY) / CONFIG.BLOCK_TIME_SEC);
  }

  const ts = new Date().toLocaleTimeString();
  $('last-updated').textContent = ok
    ? `Updated ${ts}`
    : `API unavailable — using defaults (${ts})`;
  setNetworkStatus(ok ? 'live' : 'stale', ok ? 'Live' : 'Stale');

  _fetching = false;
  calculate();
}

function setNetworkStatus(status, text) {
  const el = $('network-status');
  el.dataset.status = status;
  el.textContent = text;
}

function updateNetworkHashDisplay(hps) {
  $('network-hashrate-display').textContent = `≈ ${fmtHashRate(hps)} network`;
}

// ── Calculation + render ─────────────────────────────────────────────────────

function readInputs() {
  return {
    hashRate:         getNum('hash-rate', 0),
    unitMultiplier:   parseInt($('hash-unit').value || '1'),
    powerW:           getNum('power', 0),
    electricityUsdKwh:getNum('electricity-cost', CONFIG.DEFAULTS.ELECTRICITY_USD_KWH),
    poolFeePct:       getNum('pool-fee', CONFIG.DEFAULTS.POOL_FEE_PCT),
    hardwareCostUsd:  getNum('hardware-cost', 0),
    xmrPriceUsd:      getNum('xmr-price', 0),
    difficulty:       getNum('difficulty', CONFIG.DEFAULTS.DIFFICULTY),
    blockRewardXmr:   getNum('block-reward', CONFIG.DEFAULTS.BLOCK_REWARD_XMR),
  };
}

function calculate() {
  const inputs = readInputs();
  updateNetworkHashDisplay(inputs.difficulty / CONFIG.BLOCK_TIME_SEC);
  const result = calculateProfitability(inputs);
  renderResults(result, inputs);
}

function renderResults(r, inputs) {
  if (!r) {
    clearResults();
    return;
  }

  // Summary cards
  renderSummaryCard('card-daily-profit',   r.periods.daily.profit,   r.periods.daily.xmr,   'val-daily-profit',   'val-daily-xmr');
  renderSummaryCard('card-monthly-profit', r.periods.monthly.profit, r.periods.monthly.xmr, 'val-monthly-profit', 'val-monthly-xmr');

  const breakEven = fmtDays(r.breakEvenDays);
  $('val-break-even').textContent = inputs.hardwareCostUsd > 0 ? breakEven : 'N/A';
  $('card-break-even').className = `summary-card ${
    r.breakEvenDays !== null && r.breakEvenDays < 730 ? 'positive' :
    r.breakEvenDays !== null ? 'neutral' : ''
  }`;

  if (r.roiPct !== null) {
    $('val-roi').textContent = inputs.hardwareCostUsd > 0
      ? `${r.roiPct.toFixed(1)}%`
      : 'N/A';
    $('card-roi').className = `summary-card ${r.roiPct > 0 ? 'positive' : r.roiPct < 0 ? 'negative' : ''}`;
  } else {
    $('val-roi').textContent = 'N/A';
    $('card-roi').className = 'summary-card';
  }

  // Results table
  const tbody = $('results-tbody');
  tbody.innerHTML = '';
  const rows = [
    ['Day',   r.periods.daily],
    ['Week',  r.periods.weekly],
    ['Month', r.periods.monthly],
    ['Year',  r.periods.yearly],
  ];
  for (const [label, p] of rows) {
    const tr = document.createElement('tr');
    const profitClass = p.profit >= 0 ? 'profit-pos' : 'profit-neg';
    tr.innerHTML = `
      <td>${label}</td>
      <td>${fmtXmr(p.xmr)}</td>
      <td>${fmtUsd(p.revenue)}</td>
      <td class="elec-cost">${fmtUsd(p.electricity)}</td>
      <td class="${profitClass}">${fmtUsd(p.profit)}</td>
    `;
    tbody.appendChild(tr);
  }

  // Stats
  // Format share as plain decimal — scientific notation confuses non-technical users
  const sharePct = r.yourSharePct;
  $('stat-share').textContent = sharePct >= 0.01
    ? `${sharePct.toFixed(4)}%`
    : `${sharePct.toFixed(8)}%`;
  $('stat-cost-per-xmr').textContent = r.elecCostPerXmr !== null ? fmtUsd(r.elecCostPerXmr) : '—';
  $('stat-efficiency').textContent = inputs.powerW > 0 && r.hashRateHps > 0
    ? `${(inputs.powerW / (r.hashRateHps / 1000)).toFixed(3)} W/KH`
    : '—';
  // Guard against 100% pool fee → division by zero
  const feeFactor = 1 - inputs.poolFeePct / 100;
  $('stat-daily-gross').textContent = feeFactor > 0
    ? fmtXmr(r.periods.daily.xmr / feeFactor)
    : '—';
}

function renderSummaryCard(cardId, profit, xmr, profitId, xmrId) {
  $(profitId).textContent = fmtUsd(profit);
  $(xmrId).textContent = fmtXmr(xmr);
  $(cardId).className = `summary-card ${profit >= 0 ? 'positive' : 'negative'}`;
}

function clearResults() {
  const tbody = $('results-tbody');
  tbody.innerHTML = '<tr class="placeholder-row"><td colspan="5">Enter your mining parameters above</td></tr>';
  for (const id of ['val-daily-profit','val-daily-xmr','val-monthly-profit','val-monthly-xmr',
                     'val-break-even','val-roi','stat-share','stat-cost-per-xmr','stat-efficiency','stat-daily-gross']) {
    $(id).textContent = '—';
  }
}

// ── Event listeners ──────────────────────────────────────────────────────────

function bindEvents() {
  document.getElementById('calc-form').addEventListener('input', calculate);

  $('pool-preset').addEventListener('change', (e) => {
    const pool = MINING_POOLS[parseInt(e.target.value)];
    if (pool) setVal('pool-fee', pool.fee);
    calculate();
  });

  $('hardware-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.hw-preset-btn');
    if (!btn) return;
    const hw = HARDWARE_PRESETS[parseInt(btn.dataset.index)];
    setVal('hash-rate', hw.hashRate);
    $('hash-unit').value = '1';   // presets are in H/s
    setVal('power', hw.powerW);
    if (!$('hardware-cost').value || $('hardware-cost').value === '0') {
      setVal('hardware-cost', hw.price);
    }
    // Highlight active preset
    document.querySelectorAll('.hw-preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    calculate();
  });

  $('btn-refresh').addEventListener('click', () => refreshLiveData(true));

  $('btn-reset').addEventListener('click', () => {
    document.getElementById('calc-form').reset();
    document.querySelectorAll('.hw-preset-btn').forEach(b => b.classList.remove('active'));
    $('price-change').textContent = '';
    // Re-sync pool fee to whichever pool the form reset landed on
    const pool = MINING_POOLS[parseInt($('pool-preset').value || '0')];
    if (pool) setVal('pool-fee', pool.fee);
    calculate();
  });

  $('btn-theme').addEventListener('click', () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', html.dataset.theme);
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────

function init() {
  // Restore theme
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.dataset.theme = saved;

  populatePools();
  populateHardware();
  bindEvents();

  // Set form defaults
  setVal('hash-rate', CONFIG.DEFAULTS.HASH_RATE);
  setVal('power', CONFIG.DEFAULTS.POWER_W);
  setVal('electricity-cost', CONFIG.DEFAULTS.ELECTRICITY_USD_KWH);
  setVal('block-reward', CONFIG.DEFAULTS.BLOCK_REWARD_XMR);
  setVal('difficulty', CONFIG.DEFAULTS.DIFFICULTY);

  // Sync pool fee to whichever pool is initially selected (avoids mismatch)
  const initPool = MINING_POOLS[parseInt($('pool-preset').value || '0')];
  if (initPool) setVal('pool-fee', initPool.fee);

  refreshLiveData();
}

document.addEventListener('DOMContentLoaded', init);
