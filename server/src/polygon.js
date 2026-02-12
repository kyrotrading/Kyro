import WebSocket from "ws";
import { getSectorSymbols } from "./sectorHeatmap.js";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY || "";
const BASE = "https://api.polygon.io";
const INDEX_POLL_MS = 10000; // 10 seconds for indices

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

export function startPolygonFeed(symbols, onQuotes, onAllQuotes) {
  if (!POLYGON_API_KEY) {
    console.warn("POLYGON_API_KEY missing. Stock websocket feed not started.");
    return;
  }

  const sectorSymbols = getSectorSymbols();
  const subscribedSymbols = [...new Set([...symbols, ...sectorSymbols])];

  const state = {};
  let dirty = false;
  let reconnectTimer = null;
  let flushTimer = null;
  let ws = null;

  const flush = () => {
    if (!dirty) return;
    dirty = false;
    const primary = symbols.map((s) => state[s]).filter(Boolean);
    onQuotes(primary);
    if (typeof onAllQuotes === "function") onAllQuotes({ ...state });
  };

  const connect = () => {
    ws = new WebSocket("wss://socket.polygon.io/stocks");

    ws.on("open", () => {
      ws.send(JSON.stringify({ action: "auth", params: POLYGON_API_KEY }));
      const params = subscribedSymbols
        .flatMap((s) => [`T.${s}`, `A.${s}`])
        .join(",");
      ws.send(JSON.stringify({ action: "subscribe", params }));
      console.log(
        `Connected Polygon websocket for ${subscribedSymbols.length} symbols`
      );
    });

    ws.on("message", (raw) => {
      let payload;
      try {
        payload = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!Array.isArray(payload)) return;

      for (const msg of payload) {
        const symbol = msg.sym;
        if (!symbol || !subscribedSymbols.includes(symbol)) continue;

        // T = trade, A = second aggregate
        if (msg.ev !== "T" && msg.ev !== "A") continue;

        const price = msg.ev === "A" ? msg.c : msg.p;
        if (typeof price !== "number") continue;

        const prev = state[symbol];
        const open = prev?.open ?? (msg.ev === "A" && typeof msg.o === "number" ? msg.o : price);
        const high = Math.max(prev?.high ?? price, msg.h ?? price, price);
        const low = Math.min(prev?.low ?? price, msg.l ?? price, price);
        const volume = (prev?.volume ?? 0) + (typeof msg.s === "number" ? msg.s : msg.v ?? 0);

        state[symbol] = {
          symbol,
          price,
          open,
          high,
          low,
          close: price,
          volume,
          change: price - open,
          changePercent: open ? ((price - open) / open) * 100 : 0,
          timestamp: Date.now(),
        };
        dirty = true;
      }
    });

    ws.on("error", (err) => {
      console.warn("Polygon websocket error:", err.message);
    });

    ws.on("close", () => {
      console.warn("Polygon websocket closed. Reconnecting in 3s...");
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 3000);
    });
  };

  connect();
  flushTimer = setInterval(flush, 1000);

  return () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (flushTimer) clearInterval(flushTimer);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };
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
