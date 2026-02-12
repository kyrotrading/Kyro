"use client";

import type { Quote } from "@/lib/useSocketQuotes";

type Props = {
  symbol: string;
  quote: Quote | null;
};

export function StockCard({ symbol, quote }: Props) {
  const LABELS: Record<string, string> = {
    SPY: "S&P 500",
    QQQ: "Nasdaq",
    DIA: "Dow Jones",
    IWM: "Russell 2000",
  };

  const name = LABELS[symbol] ?? symbol;

  const absChange =
    quote && quote.open ? quote.price - quote.open : null;
  const pctChange =
    quote && quote.open
      ? ((quote.price - quote.open) / quote.open) * 100
      : null;
  const isPositive =
    absChange !== null && absChange >= 0;

  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-surface to-card p-5 shadow-lg transition hover:border-white/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">{name}</p>
          <p className="mt-1 font-mono text-sm font-semibold text-white">
            {symbol}
          </p>
        </div>

        {pctChange !== null && (
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full ${
              isPositive ? "bg-accent/15" : "bg-danger/15"
            }`}
          >
            <span
              className={`text-xs ${
                isPositive ? "text-accent" : "text-danger"
              }`}
            >
              {isPositive ? "↑" : "↓"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 font-mono text-2xl font-bold text-white">
        {quote ? `$${quote.price.toFixed(2)}` : "—"}
      </div>

      {quote && (
        <div className="mt-3 flex items-baseline gap-3 text-sm">
          {absChange !== null && (
            <span
              className={`font-mono ${
                isPositive ? "text-accent" : "text-danger"
              }`}
            >
              {isPositive ? "+" : ""}
              {absChange.toFixed(2)}
            </span>
          )}
          {pctChange !== null && (
            <span
              className={`font-mono text-xs ${
                isPositive ? "text-accent" : "text-danger"
              }`}
            >
              {isPositive ? "+" : ""}
              {pctChange.toFixed(2)}%
            </span>
          )}
        </div>
      )}

      {!quote && (
        <div className="mt-3 flex items-center">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
        </div>
      )}
    </div>
  );
}
