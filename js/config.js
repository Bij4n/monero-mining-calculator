const CONFIG = {
  API: {
    COINGECKO: 'https://api.coingecko.com/api/v3',
    // xmrchain.net has CORS * and no API key required
    XMRCHAIN: 'https://xmrchain.net/api',
    PRICE_CACHE_MS: 5 * 60 * 1000,
    NETWORK_CACHE_MS: 10 * 60 * 1000,
  },
  DEFAULTS: {
    HASH_RATE: 20000,
    UNIT_MULTIPLIER: 1,
    POWER_W: 145,
    ELECTRICITY_USD_KWH: 0.12,
    POOL_FEE_PCT: 1.0,
    HARDWARE_COST_USD: 0,
    XMR_PRICE_USD: '',
    // Block reward changes ~every block by a tiny fraction; ~0.6261 XMR as of mid-2025.
    // No CORS-friendly live source exists; user can override manually.
    BLOCK_REWARD_XMR: 0.6261,
    // ~710B as of mid-2025; fetched live from xmrchain.net on load
    DIFFICULTY: 710_000_000_000,
  },
  BLOCK_TIME_SEC: 120,
};
