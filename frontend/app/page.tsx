"use client";

import { useSocketQuotes } from "@/lib/useSocketQuotes";
import { StockCard } from "@/components/StockCard";

const SYMBOLS = ["SPY", "QQQ", "DIA", "IWM"] as const;

export default function Home() {
  const { quotes, connected } = useSocketQuotes(SYMBOLS);

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

      {/* Market sentiment row */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
          Market Sentiment
        </h2>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Fear & Greed Index card (UI only for now) */}
          <div className="rounded-2xl border border-white/10 bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Fear &amp; Greed Index
                </p>
                <p className="mt-1 text-xs text-muted">
                  Overall market sentiment indicator
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface">
                <span className="text-3xl font-bold text-white">--</span>
              </div>
              <div className="space-y-2 text-sm text-muted">
                <p className="text-danger font-medium">
                  Failed to display data
                </p>
                <p className="text-xs">
                  This metric will appear once a live Fear &amp; Greed data
                  source is connected.
                </p>
              </div>
            </div>
          </div>

          {/* Put/Call Ratio card (UI only for now) */}
          <div className="rounded-2xl border border-white/10 bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Put/Call Ratio
                </p>
                <p className="mt-1 text-xs text-muted">
                  Options market positioning (puts vs calls)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">--</span>
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Neutral
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-surface">
                <div className="h-full w-1/3 rounded-full bg-accent/60" />
              </div>

              <p className="text-sm text-danger font-medium">
                Failed to display data
              </p>
              <p className="text-xs text-muted">
                This metric will appear once a live options/put-call data source
                is connected.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
