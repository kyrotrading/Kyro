"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export type IndexQuote = {
  symbol: string;
  name: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  timestamp: number;
};

export type IndexQuotesMap = Partial<Record<string, IndexQuote>>;

const SOCKET_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000")
    : "";

const INDEX_TICKERS = ["I:SPX", "I:NDX", "I:DJI", "I:RUT"] as const;

export function useSocketIndexQuotes() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [quotes, setQuotes] = useState<IndexQuotesMap>({});

  useEffect(() => {
    if (!SOCKET_URL) return;

    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    s.on("connect", () => {
      setConnected(true);
      s.emit("subscribeIndices");
    });

    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", () => setConnected(false));

    s.on("indexQuotes", (data: IndexQuote[]) => {
      setQuotes((prev) => {
        const next = { ...prev };
        (data || []).forEach((q) => {
          next[q.symbol] = q;
        });
        return next;
      });
    });

    setSocket(s);
    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, []);

  return {
    quotes,
    connected,
    socket,
    tickers: INDEX_TICKERS,
  };
}
