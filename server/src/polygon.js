const POLYGON_API_KEY = process.env.POLYGON_API_KEY || "";
const BASE = "https://api.polygon.io";
const POLL_MS = 5000;

/**
 * Fetch snapshot (day OHLC + last trade) for a symbol from Polygon.io
 * Uses /v2/snapshot and falls back to /v2/aggs/ticker/prev when needed
 */
async function fetchQuote(symbol) {
  if (!POLYGON_API_KEY) {
    return mockQuote(symbol);
  }
  try {
    const snapRes = await fetch(
      `${BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`
    ).then((r) => r.json());

    const ticker = snapRes?.ticker;
    const day = ticker?.day ?? {};
    const lastTrade = ticker?.lastTrade ?? {};
    const prev = ticker?.prevDay ?? {};

    const open = day?.o ?? prev?.c ?? prev?.o ?? 0;
    const high = day?.h ?? open;
    const low = day?.l ?? open;
    const price = lastTrade?.p ?? day?.c ?? prev?.c ?? open;
    const volume = day?.v ?? prev?.v ?? 0;

    return {
      symbol,
      price,
      open,
      high,
      low,
      close: price,
      volume,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn(`Polygon fetch failed for ${symbol}:`, err.message);
    return mockQuote(symbol);
  }
}

function mockQuote(symbol) {
  const base = { AAPL: 225, SPY: 580, TSLA: 385 }[symbol] ?? 100;
  const noise = (Math.random() - 0.5) * 2;
  const price = base + noise;
  const open = base;
  return {
    symbol,
    price,
    open,
    high: Math.max(open, price) + Math.random(),
    low: Math.min(open, price) - Math.random(),
    close: price,
    volume: Math.floor(Math.random() * 1e6) + 5e5,
    timestamp: Date.now(),
  };
}

export function startPolygonFeed(symbols, onQuotes) {
  async function poll() {
    const results = await Promise.all(symbols.map((s) => fetchQuote(s)));
    onQuotes(results);
  }

  poll();
  setInterval(poll, POLL_MS);
}
