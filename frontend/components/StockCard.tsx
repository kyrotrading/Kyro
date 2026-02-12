"use client";

import type { Quote } from "@/lib/useSocketQuotes";

type Props = {
  symbol: string;
  quote: Quote | null;
};

export function StockCard({ symbol, quote }: Props) {
  const change =
    quote && quote.open
      ? ((quote.price - quote.open) / quote.open) * 100
      : null;
  const isPositive = change !== null && change >= 0;

  return (
    <div className="rounded-xl border border-white/10 bg-card p-5 shadow-lg transition hover:border-white/20">
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-semibold text-white">
          {symbol}
        </span>
        {change !== null && (
          <span
            className={`font-mono text-sm font-medium ${
              isPositive ? "text-accent" : "text-danger"
            }`}
          >
            {isPositive ? "+" : ""}
            {change.toFixed(2)}%
          </span>
        )}
      </div>

      <div className="mt-3 font-mono text-2xl font-bold text-white">
        {quote ? `$${quote.price.toFixed(2)}` : "—"}
      </div>

      {quote && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted">
          <dt>Open</dt>
          <dd className="font-mono text-right">${quote.open.toFixed(2)}</dd>
          <dt>High</dt>
          <dd className="font-mono text-right text-accent">
            ${quote.high.toFixed(2)}
          </dd>
          <dt>Low</dt>
          <dd className="font-mono text-right text-danger">
            ${quote.low.toFixed(2)}
          </dd>
          <dt>Volume</dt>
          <dd className="font-mono text-right">
            {quote.volume.toLocaleString()}
          </dd>
        </dl>
      )}

      {!quote && (
        <p className="mt-4 text-sm text-muted">Waiting for data…</p>
      )}
    </div>
  );
}
