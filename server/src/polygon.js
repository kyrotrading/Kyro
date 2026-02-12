const POLYGON_API_KEY = process.env.POLYGON_API_KEY || "";
const BASE = "https://api.polygon.io";
const POLL_MS = 10000;
const INDEX_POLL_MS = 10000; // 10 seconds for indices

/**
 * Fetch snapshot (day OHLC + last trade) for a symbol from Polygon.io
 * Uses /v2/snapshot and falls back to /v2/aggs/ticker/prev when needed
 */
async function fetchQuote(symbol) {
  if (!POLYGON_API_KEY) return null;
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
    return null;
  }
}

/**
 * Fetch snapshot for US indices (S&P 500, NASDAQ, Dow, Russell 2000)
 * Polygon: GET /v3/snapshot/indices?ticker.any_of=I:SPX,I:NDX,I:DJI,I:RUT
 */
async function fetchIndices(tickers) {
  if (!POLYGON_API_KEY) return [];
  try {
    const list = tickers.join(",");
    const res = await fetch(
      `${BASE}/v3/snapshot/indices?ticker.any_of=${encodeURIComponent(list)}&apiKey=${POLYGON_API_KEY}`
    ).then((r) => r.json());

    const results = (res?.results ?? []).filter((r) => !r.error);
    const byTicker = Object.fromEntries(results.map((r) => [r.ticker, r]));
    const out = [];

    for (const ticker of tickers) {
      const r = byTicker[ticker];
      if (!r) continue;
      const session = r.session ?? {};
      const value = r.value ?? session.close ?? session.previous_close ?? 0;
      const open = session.open ?? session.previous_close ?? value;
      out.push({
        symbol: ticker,
        name: indexDisplayName(ticker),
        price: value,
        open,
        high: session.high ?? value,
        low: session.low ?? value,
        close: value,
        change: session.change ?? value - open,
        changePercent: session.change_percent ?? (open ? ((value - open) / open) * 100 : 0),
        timestamp: Date.now(),
      });
    }
    return out;
  } catch (err) {
    console.warn("Polygon indices fetch failed:", err.message);
    return [];
  }
}

function indexDisplayName(ticker) {
  const names = {
    "I:SPX": "S&P 500",
    "I:NDX": "NASDAQ",
    "I:DJI": "Dow Jones",
    "I:RUT": "Russell 2000",
  };
  return names[ticker] ?? ticker;
}

export function startPolygonFeed(symbols, onQuotes) {
  async function poll() {
    const results = await Promise.all(symbols.map((s) => fetchQuote(s)));
    onQuotes(results.filter(Boolean));
  }

  poll();
  setInterval(poll, POLL_MS);
}

const DEFAULT_INDEX_TICKERS = ["I:SPX", "I:NDX", "I:DJI", "I:RUT"];

export function startPolygonIndexFeed(onIndices) {
  async function poll() {
    const results = await fetchIndices(DEFAULT_INDEX_TICKERS);
    onIndices(results);
  }

  poll();
  setInterval(poll, INDEX_POLL_MS);
}
