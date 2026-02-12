"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ColorType,
  createChart,
  type IChartApi,
  type CandlestickData,
  type HistogramData,
  type UTCTimestamp,
} from "lightweight-charts";
import { useSocketQuotes } from "@/lib/useSocketQuotes";

type RangeKey = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y";

type RangeConfig = {
  multiplier: number;
  timespan: "minute" | "hour" | "day";
  daysBack: number;
  bucketSeconds: number;
};

const RANGES: Record<RangeKey, RangeConfig> = {
  "1D": { multiplier: 5, timespan: "minute", daysBack: 1, bucketSeconds: 5 * 60 },
  "5D": { multiplier: 15, timespan: "minute", daysBack: 5, bucketSeconds: 15 * 60 },
  "1M": { multiplier: 1, timespan: "hour", daysBack: 30, bucketSeconds: 60 * 60 },
  "3M": { multiplier: 1, timespan: "day", daysBack: 90, bucketSeconds: 24 * 60 * 60 },
  "6M": { multiplier: 1, timespan: "day", daysBack: 180, bucketSeconds: 24 * 60 * 60 },
  "1Y": { multiplier: 1, timespan: "day", daysBack: 365, bucketSeconds: 24 * 60 * 60 },
};

const SYMBOLS = ["SPY", "QQQ", "DIA", "IWM", "AAPL", "TSLA"] as const;

function dateYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function bucketTime(nowSec: number, bucketSec: number): UTCTimestamp {
  return Math.floor(nowSec / bucketSec) * bucketSec as UTCTimestamp;
}

export default function ChartsPage() {
  const [symbol, setSymbol] = useState<(typeof SYMBOLS)[number]>("SPY");
  const [range, setRange] = useState<RangeKey>("1M");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bars, setBars] = useState<CandlestickData<UTCTimestamp>[]>([]);
  const [vol, setVol] = useState<HistogramData<UTCTimestamp>[]>([]);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<any>(null);
  const volRef = useRef<any>(null);
  const barsRef = useRef<CandlestickData<UTCTimestamp>[]>([]);
  const rangeRef = useRef<RangeKey>(range);

  const socketSymbols = useMemo(() => [symbol], [symbol]);
  const { quotes } = useSocketQuotes(socketSymbols);
  const liveQuote = quotes[symbol];

  // Keep refs in sync for websocket updates.
  useEffect(() => {
    barsRef.current = bars;
  }, [bars]);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  // Create chart once.
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 560,
      layout: {
        background: { type: ColorType.Solid, color: "#0b1220" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.08)" },
        horzLines: { color: "rgba(148,163,184,0.08)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148,163,184,0.2)",
      },
      timeScale: {
        borderColor: "rgba(148,163,184,0.2)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candles = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
      borderVisible: false,
      priceLineVisible: true,
    });

    const volume = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "rgba(56, 189, 248, 0.35)",
    });
    volume.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candles;
    volRef.current = volume;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      chart.applyOptions({ width: entry.contentRect.width });
    });
    ro.observe(chartContainerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
    };
  }, []);

  // Fetch historical bars whenever symbol/range changes.
  useEffect(() => {
    const cfg = RANGES[range];
    const toDate = new Date();
    const fromDate = new Date(Date.now() - cfg.daysBack * 24 * 60 * 60 * 1000);
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";

    setLoading(true);
    setError(null);

    fetch(
      `${baseUrl}/api/bars?symbol=${symbol}&multiplier=${cfg.multiplier}&timespan=${cfg.timespan}&from=${dateYmd(
        fromDate
      )}&to=${dateYmd(toDate)}&limit=5000`
    )
      .then(async (r) => {
        if (!r.ok) {
          const payload = await r.json().catch(() => ({}));
          throw new Error(payload?.error || "Failed to load chart bars");
        }
        return r.json();
      })
      .then((data) => {
        const nextBars: CandlestickData<UTCTimestamp>[] = (data?.bars || []).map((b: any) => ({
          time: b.time as UTCTimestamp,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        }));
        const nextVol: HistogramData<UTCTimestamp>[] = (data?.bars || []).map((b: any) => ({
          time: b.time as UTCTimestamp,
          value: b.volume ?? 0,
          color: b.close >= b.open ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)",
        }));

        setBars(nextBars);
        setVol(nextVol);
        candleRef.current?.setData(nextBars);
        volRef.current?.setData(nextVol);
        chartRef.current?.timeScale().fitContent();
      })
      .catch((e) => {
        setError(e.message || "Failed to load chart data");
        setBars([]);
        setVol([]);
        candleRef.current?.setData([]);
        volRef.current?.setData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [symbol, range]);

  // Live updates from websocket quote stream for continuous flow.
  useEffect(() => {
    if (!liveQuote || !candleRef.current) return;
    const cfg = RANGES[rangeRef.current];
    const nowSec = Math.floor(Date.now() / 1000);
    const t = bucketTime(nowSec, cfg.bucketSeconds);

    const series = barsRef.current.slice();
    if (series.length === 0) return;

    const last = series[series.length - 1];
    const next = {
      time: t,
      open: last.time === t ? last.open : last.close,
      high: Math.max(last.time === t ? last.high : last.close, liveQuote.price),
      low: Math.min(last.time === t ? last.low : last.close, liveQuote.price),
      close: liveQuote.price,
    } as CandlestickData<UTCTimestamp>;

    if (last.time === t) {
      series[series.length - 1] = next;
    } else {
      series.push(next);
    }

    barsRef.current = series;
    setBars(series);
    candleRef.current.update(next);
  }, [liveQuote]);

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Charts</h1>
          <p className="mt-1 text-sm text-muted">
            Interactive candlestick charts with live Polygon updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSymbol(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                s === symbol ? "bg-accent/20 text-accent" : "bg-card text-muted hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(Object.keys(RANGES) as RangeKey[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              r === range ? "bg-accent/20 text-accent" : "bg-card text-muted hover:text-white"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-white/10 bg-card/60 p-3">
        {loading && (
          <div className="flex h-[560px] items-center justify-center">
            <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
          </div>
        )}

        {!loading && error && (
          <div className="flex h-[560px] items-center justify-center text-danger">
            {error}
          </div>
        )}

        <div
          ref={chartContainerRef}
          className={`${loading || error ? "hidden" : "block"} h-[560px] w-full`}
        />
      </section>
    </main>
  );
}

