"use client";

import { useSocketQuotes } from "@/lib/useSocketQuotes";
import { useSocketIndexQuotes } from "@/lib/useSocketIndexQuotes";
import { StockCard } from "@/components/StockCard";
import { IndexCard } from "@/components/IndexCard";

const SYMBOLS = ["AAPL", "SPY", "TSLA"] as const;

const INDEX_NAMES: Record<string, string> = {
  "I:SPX": "S&P 500",
  "I:NDX": "NASDAQ",
  "I:DJI": "Dow Jones",
  "I:RUT": "Russell 2000",
};

export default function Home() {
  const { quotes, connected } = useSocketQuotes(SYMBOLS);
  const { quotes: indexQuotes, tickers } = useSocketIndexQuotes();

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Trading Platform
        </h1>
        <p className="mt-1 text-muted">
          Real-time quotes · Indices & stocks via Polygon.io
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-accent animate-pulse" : "bg-danger"
            }`}
          />
          <span className="text-sm text-muted">
            {connected ? "Live" : "Connecting…"}
          </span>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
          Major indices (updates every 10s)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tickers.map((ticker) => (
            <IndexCard
              key={ticker}
              name={INDEX_NAMES[ticker] ?? ticker}
              quote={indexQuotes[ticker] ?? null}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
          Stocks
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SYMBOLS.map((symbol) => (
            <StockCard
              key={symbol}
              symbol={symbol}
              quote={quotes[symbol] ?? null}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
