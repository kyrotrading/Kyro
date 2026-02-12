"use client";

import type { SectorItem, SectorBreadth } from "@/lib/useSectorHeatmap";

type Props = {
  sectors: SectorItem[];
  breadth: SectorBreadth | null;
};

function pctClass(value: number) {
  return value >= 0 ? "text-accent" : "text-danger";
}

function cardStyle(perf: number) {
  const intensity = Math.min(Math.abs(perf), 3);
  if (perf >= 0) {
    return {
      backgroundColor: `rgba(16, 185, 129, ${0.08 + intensity * 0.06})`,
      borderColor: "rgba(16, 185, 129, 0.35)",
    };
  }
  return {
    backgroundColor: `rgba(239, 68, 68, ${0.08 + intensity * 0.06})`,
    borderColor: "rgba(239, 68, 68, 0.35)",
  };
}

export function SectorHeatmap({ sectors, breadth }: Props) {
  const advancing = breadth?.advancing ?? 0;
  const declining = breadth?.declining ?? 0;
  const total = breadth?.total ?? 0;
  const advPct = total > 0 ? (advancing / total) * 100 : 50;
  const decPct = Math.max(0, 100 - advPct);

  return (
    <section className="space-y-4">
      <h2 className="border-l-2 border-sky-400 pl-2 text-lg font-semibold text-white">
        Sector Heatmap
      </h2>

      <div className="rounded-2xl border border-white/10 bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Market Breadth</p>
            <p
              className={`font-mono text-lg font-semibold ${pctClass(
                breadth?.averagePerformance ?? 0
              )}`}
            >
              {(breadth?.averagePerformance ?? 0) >= 0 ? "+" : ""}
              {(breadth?.averagePerformance ?? 0).toFixed(2)}% avg
            </p>
          </div>
          <div className="flex items-end gap-6 text-right">
            <div>
              <p className="font-mono text-lg text-accent">{advancing}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted">
                Advancing
              </p>
            </div>
            <div>
              <p className="font-mono text-lg text-danger">{declining}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted">
                Declining
              </p>
            </div>
            <div>
              <p className="font-mono text-lg text-white">{total}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted">
                Total
              </p>
            </div>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div className="flex h-full w-full">
            <div className="bg-accent" style={{ width: `${advPct}%` }} />
            <div className="bg-danger" style={{ width: `${decPct}%` }} />
          </div>
        </div>
      </div>

      {sectors.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-card p-10">
          <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {sectors.map((sector) => {
            const upPct = sector.total > 0 ? (sector.advancing / sector.total) * 100 : 0;
            const downPct = sector.total > 0 ? (sector.declining / sector.total) * 100 : 0;
            return (
              <div
                key={sector.id}
                className="rounded-xl border p-4"
                style={cardStyle(sector.performance)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{sector.name}</p>
                    <p className={`mt-1 font-mono text-lg ${pctClass(sector.performance)}`}>
                      {sector.performance >= 0 ? "+" : ""}
                      {sector.performance.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/20">
                  <div className="flex h-full w-full">
                    <div className="bg-accent" style={{ width: `${upPct}%` }} />
                    <div className="bg-danger" style={{ width: `${downPct}%` }} />
                  </div>
                </div>

                <div className="mt-2 flex justify-between text-[10px] text-muted">
                  <span>{sector.advancing} up</span>
                  <span>{sector.declining} down</span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {sector.members.map((m) => (
                    <div key={m.symbol} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-white">{m.symbol}</span>
                      <span className={`font-mono ${pctClass(m.changePercent)}`}>
                        {m.changePercent >= 0 ? "+" : ""}
                        {m.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

