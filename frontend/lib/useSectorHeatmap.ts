"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export type SectorMember = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

export type SectorItem = {
  id: string;
  name: string;
  performance: number;
  advancing: number;
  declining: number;
  unchanged: number;
  total: number;
  members: SectorMember[];
};

export type SectorBreadth = {
  advancing: number;
  declining: number;
  total: number;
  averagePerformance: number;
};

type HeatmapPayload = {
  sectors: SectorItem[];
  breadth: SectorBreadth | null;
};

const SOCKET_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000"
    : "";

export function useSectorHeatmap() {
  const [data, setData] = useState<HeatmapPayload>({
    sectors: [],
    breadth: null,
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!SOCKET_URL) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("subscribeSectorHeatmap");
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("sectorHeatmap", (payload: HeatmapPayload) => {
      setData(payload);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setConnected(false);
    };
  }, []);

  return { data, connected };
}

