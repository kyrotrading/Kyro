const POLYGON_API_KEY = process.env.POLYGON_API_KEY || "";
const BASE = "https://api.polygon.io";
const HEATMAP_POLL_MS = 10000;

const TOP_SECTORS = [
  { id: "energy", name: "Energy", symbols: ["XOM", "CVX", "COP", "SLB", "EOG", "HAL"] },
  { id: "semis", name: "Semiconductors", symbols: ["NVDA", "AMD", "AVGO", "MU", "LRCX", "KLAC"] },
  { id: "technology", name: "Technology", symbols: ["MSFT", "AAPL", "CSCO", "CRM", "ADBE", "ORCL"] },
  { id: "consumer-defensive", name: "Consumer Defensive", symbols: ["PG", "COST", "WMT", "KO", "PEP", "MO"] },
  { id: "financial", name: "Financial", symbols: ["JPM", "BAC", "WFC", "MS", "GS", "SCHW"] },
  { id: "utilities-re", name: "Utilities & RE", symbols: ["NEE", "DUK", "SO", "PLD", "AMT", "SPG"] },
  { id: "industrials", name: "Industrials", symbols: ["CAT", "DE", "BA", "HON", "UPS", "GE"] },
  { id: "communication", name: "Communication", symbols: ["META", "GOOGL", "NFLX", "TMUS", "T", "VZ"] },
  { id: "consumer-cyclical", name: "Consumer Cyclical", symbols: ["AMZN", "TSLA", "HD", "MCD", "SBUX", "TJX"] },
  { id: "healthcare", name: "Healthcare", symbols: ["LLY", "JNJ", "UNH", "MRK", "TMO", "PFE"] },
];

function asQuote(snapshot) {
  const prevClose = snapshot?.prevDay?.c ?? 0;
  const price = snapshot?.day?.c ?? snapshot?.lastTrade?.p ?? prevClose;
  if (!price || !prevClose) return null;
  const change = snapshot?.todaysChange ?? price - prevClose;
  const changePercent =
    snapshot?.todaysChangePerc ??
    (prevClose ? ((price - prevClose) / prevClose) * 100 : 0);
  return {
    symbol: snapshot.ticker,
    price,
    change,
    changePercent,
  };
}

async function fetchAllSectorQuotes() {
  if (!POLYGON_API_KEY) return null;
  try {
    const allSymbols = [...new Set(TOP_SECTORS.flatMap((s) => s.symbols))];
    const list = allSymbols.join(",");
    const res = await fetch(
      `${BASE}/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${encodeURIComponent(
        list
      )}&apiKey=${POLYGON_API_KEY}`
    ).then((r) => r.json());

    const tickers = Array.isArray(res?.tickers) ? res.tickers : [];
    const bySymbol = {};

    for (const snapshot of tickers) {
      const parsed = asQuote(snapshot);
      if (parsed) bySymbol[parsed.symbol] = parsed;
    }
    return bySymbol;
  } catch (err) {
    console.warn("Sector heatmap fetch failed:", err.message);
    return null;
  }
}

function buildHeatmapPayload(bySymbol) {
  if (!bySymbol) return { sectors: [], breadth: null };

  let totalAdvancing = 0;
  let totalDeclining = 0;
  let totalCount = 0;
  let perfSum = 0;
  let perfCount = 0;

  const sectors = TOP_SECTORS.map((sector) => {
    const members = sector.symbols
      .map((symbol) => bySymbol[symbol])
      .filter(Boolean);

    const advancing = members.filter((m) => m.changePercent > 0).length;
    const declining = members.filter((m) => m.changePercent < 0).length;
    const unchanged = Math.max(0, members.length - advancing - declining);
    const avgPerf =
      members.length > 0
        ? members.reduce((sum, m) => sum + m.changePercent, 0) / members.length
        : 0;

    totalAdvancing += advancing;
    totalDeclining += declining;
    totalCount += members.length;
    if (members.length > 0) {
      perfSum += avgPerf;
      perfCount += 1;
    }

    return {
      id: sector.id,
      name: sector.name,
      performance: avgPerf,
      advancing,
      declining,
      unchanged,
      total: members.length,
      members: members.slice(0, 3),
    };
  });

  const breadth = {
    advancing: totalAdvancing,
    declining: totalDeclining,
    total: totalCount,
    averagePerformance: perfCount > 0 ? perfSum / perfCount : 0,
  };

  return { sectors, breadth };
}

export function startSectorHeatmapFeed(onHeatmap) {
  async function poll() {
    const quotes = await fetchAllSectorQuotes();
    const payload = buildHeatmapPayload(quotes);
    onHeatmap(payload);
  }

  poll();
  setInterval(poll, HEATMAP_POLL_MS);
}

