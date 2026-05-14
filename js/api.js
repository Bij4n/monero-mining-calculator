const _cache = {};

async function _get(key, url, ttlMs) {
  const now = Date.now();
  if (_cache[key] && now - _cache[key].ts < ttlMs) return _cache[key].data;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  _cache[key] = { data, ts: now };
  return data;
}

async function fetchXmrPrice() {
  const data = await _get(
    'price',
    `${CONFIG.API.COINGECKO}/simple/price?ids=monero&vs_currencies=usd&include_24hr_change=true`,
    CONFIG.API.PRICE_CACHE_MS,
  );
  return {
    priceUsd:  data.monero.usd,
    change24h: data.monero.usd_24h_change ?? null,
  };
}

async function fetchNetworkInfo() {
  // xmrchain.net is CORS-enabled (* origin) and requires no API key.
  // Returns difficulty as a string and hash_rate as a number.
  // Block reward has no CORS-friendly live source; caller uses CONFIG.DEFAULTS.BLOCK_REWARD_XMR.
  const data = await _get(
    'network',
    `${CONFIG.API.XMRCHAIN}/networkinfo`,
    CONFIG.API.NETWORK_CACHE_MS,
  );
  const d = data?.data;
  if (!d?.difficulty) throw new Error('Unexpected xmrchain response shape');
  return {
    difficulty:  parseInt(d.difficulty, 10),
    networkHps:  d.hash_rate,          // already a number
    blockRewardXmr: null,              // not available from this endpoint
  };
}
