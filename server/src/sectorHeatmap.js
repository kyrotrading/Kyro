const TOP_SECTORS = [
  { id: "energy", name: "Energy", symbols: ["XOM", "CVX", "COP", "SLB"] },
  { id: "semis", name: "Semiconductors", symbols: ["NVDA", "AMD", "AVGO", "MU"] },
  { id: "technology", name: "Technology", symbols: ["MSFT", "AAPL", "CSCO", "CRM"] },
  { id: "consumer-defensive", name: "Consumer Defensive", symbols: ["PG", "COST", "WMT", "KO"] },
  { id: "financial", name: "Financial", symbols: ["JPM", "BAC", "WFC", "MS"] },
  { id: "utilities-re", name: "Utilities & RE", symbols: ["NEE", "DUK", "SO", "PLD"] },
  { id: "industrials", name: "Industrials", symbols: ["CAT", "DE", "BA", "HON"] },
  { id: "communication", name: "Communication", symbols: ["META", "GOOGL", "NFLX", "TMUS"] },
  { id: "consumer-cyclical", name: "Consumer Cyclical", symbols: ["AMZN", "TSLA", "HD", "MCD"] },
  { id: "healthcare", name: "Healthcare", symbols: ["LLY", "JNJ", "UNH", "MRK"] },
];

export function getSectorSymbols() {
  return [...new Set(TOP_SECTORS.flatMap((s) => s.symbols))];
}

export function buildHeatmapPayload(bySymbol) {
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
