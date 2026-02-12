"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export type Quote = {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
};

export type QuotesMap = Partial<Record<string, Quote>>;

const SOCKET_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000")
    : "";

export function useSocketQuotes(symbols: readonly string[]) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [quotes, setQuotes] = useState<QuotesMap>({});

  useEffect(() => {
    if (!SOCKET_URL || symbols.length === 0) return;

    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    s.on("connect", () => {
      setConnected(true);
      s.emit("subscribe", symbols);
    });

    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", () => setConnected(false));

    s.on("quotes", (data: Quote | Quote[]) => {
      setQuotes((prev) => {
        const next = { ...prev };
        const list = Array.isArray(data) ? data : [data];
        list.forEach((q) => {
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
  }, [symbols.join(",")]);

  return { quotes, connected, socket };
}
