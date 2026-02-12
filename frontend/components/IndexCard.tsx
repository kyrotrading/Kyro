"use client";

import type { IndexQuote } from "@/lib/useSocketIndexQuotes";

type Props = {
  name: string;
  quote: IndexQuote | null;
};

export function IndexCard({ name, quote }: Props) {
  if (!quote) {
    return (
      <div className="rounded-xl border border-white/10 bg-card p-4 shadow transition hover:border-white/20">
        <div className="font-mono text-sm text-muted">{name}</div>
        <div className="mt-1 font-mono text-xl font-bold text-white">—</div>
        <p className="mt-2 text-sm text-danger">Failed to display data</p>
      </div>
    );
  }

  const isPositive = quote.changePercent >= 0;

  return (
    <div className="rounded-xl border border-white/10 bg-card p-4 shadow transition hover:border-white/20">
      <div className="font-mono text-sm text-muted">{quote.name}</div>
      <div className="mt-1 font-mono text-xl font-bold text-white">
        {quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
      <div
        className={`mt-1 font-mono text-sm font-medium ${
          isPositive ? "text-accent" : "text-danger"
        }`}
      >
        {isPositive ? "+" : ""}
        {quote.changePercent.toFixed(2)}%
      </div>
    </div>
  );
}
