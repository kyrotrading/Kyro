"use client";

import { useSocketQuotes } from "@/lib/useSocketQuotes";
import { StockCard } from "@/components/StockCard";

const SYMBOLS = ["AAPL", "SPY", "TSLA"] as const;

export default function Home() {
  const { quotes, connected } = useSocketQuotes(SYMBOLS);

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Trading Platform
        </h1>
        <p className="mt-1 text-muted">
          Real-time quotes · AAPL, SPY, TSLA via Polygon.io
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SYMBOLS.map((symbol) => (
          <StockCard
            key={symbol}
            symbol={symbol}
            quote={quotes[symbol] ?? null}
          />
        ))}
      </div>
    </main>
  );
}
