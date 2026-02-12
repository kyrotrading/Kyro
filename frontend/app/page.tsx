"use client";

import { useSocketQuotes } from "@/lib/useSocketQuotes";
import { useSectorHeatmap } from "@/lib/useSectorHeatmap";
import { StockCard } from "@/components/StockCard";
import { SectorHeatmap } from "@/components/SectorHeatmap";

const SYMBOLS = ["SPY", "QQQ", "DIA", "IWM"] as const;

export default function Home() {
  const { quotes, connected } = useSocketQuotes(SYMBOLS);
  const { data } = useSectorHeatmap();

  return (
    <main className="min-h-screen space-y-10 p-6 md:p-10">
      {/* Top bar / status */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Market Overview
          </h1>
          <p className="mt-1 text-sm text-muted">
            Real-time data from Polygon.io. SPY · QQQ · DIA · IWM.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-accent animate-pulse" : "bg-danger"
            }`}
          />
          <span className="font-mono text-xs uppercase tracking-wide text-muted">
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </header>

      {/* Market overview row */}
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
          Market Overview
        </h2>
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SYMBOLS.map((symbol) => (
              <StockCard
                key={symbol}
                symbol={symbol}
                quote={quotes[symbol] ?? null}
              />
            ))}
          </div>
        </div>
      </section>

      <SectorHeatmap sectors={data.sectors} breadth={data.breadth} />
    </main>
  );
}
