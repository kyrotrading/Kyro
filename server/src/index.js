import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { startPolygonFeed, startPolygonIndexFeed } from "./polygon.js";
import { buildHeatmapPayload } from "./sectorHeatmap.js";

const PORT = process.env.PORT || 4000;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY || "";
const POLYGON_BASE = "https://api.polygon.io";
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/api/bars", async (req, res) => {
  try {
    if (!POLYGON_API_KEY) {
      return res.status(500).json({ error: "POLYGON_API_KEY is not set" });
    }

    const symbol = String(req.query.symbol || "SPY").toUpperCase();
    const multiplier = Number(req.query.multiplier || 5);
    const timespan = String(req.query.timespan || "minute");
    const from = String(req.query.from || "");
    const to = String(req.query.to || "");
    const limit = Number(req.query.limit || 1000);

    if (!/^[A-Z:.]{1,15}$/.test(symbol)) {
      return res.status(400).json({ error: "Invalid symbol" });
    }
    if (!["minute", "hour", "day", "week", "month"].includes(timespan)) {
      return res.status(400).json({ error: "Invalid timespan" });
    }
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      return res.status(400).json({ error: "Invalid multiplier" });
    }
    if (!from || !to) {
      return res.status(400).json({ error: "from and to are required (YYYY-MM-DD)" });
    }

    const url =
      `${POLYGON_BASE}/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}` +
      `?adjusted=true&sort=asc&limit=${Math.min(limit, 50000)}&apiKey=${POLYGON_API_KEY}`;

    const polygonRes = await fetch(url).then((r) => r.json());
    const bars = Array.isArray(polygonRes?.results) ? polygonRes.results : [];

    const mapped = bars.map((b) => ({
      time: Math.floor(b.t / 1000),
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
      volume: b.v ?? 0,
    }));

    return res.json({
      symbol,
      bars: mapped,
      count: mapped.length,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch bars", message: err.message });
  }
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: true },
  transports: ["websocket", "polling"],
});

const DEFAULT_SYMBOLS = ["SPY", "QQQ", "DIA", "IWM"];
const INDEX_SYMBOLS = ["I:SPX", "I:NDX", "I:DJI", "I:RUT"];

io.on("connection", (socket) => {
  socket.on("subscribe", (symbols) => {
    const list = Array.isArray(symbols) ? symbols : [symbols];
    const valid = list.filter(
      (s) => typeof s === "string" && DEFAULT_SYMBOLS.includes(s)
    );
    if (valid.length) {
      socket.join("quotes");
      socket.data.symbols = valid;
    }
  });

  socket.on("subscribeIndices", () => {
    socket.join("indexQuotes");
  });

  socket.on("subscribeSectorHeatmap", () => {
    socket.join("sectorHeatmap");
  });
});

function broadcastQuotes(quotes) {
  io.to("quotes").emit("quotes", quotes);
}

function broadcastIndexQuotes(indices) {
  io.to("indexQuotes").emit("indexQuotes", indices);
}

function broadcastSectorHeatmap(payload) {
  io.to("sectorHeatmap").emit("sectorHeatmap", payload);
}

startPolygonFeed(DEFAULT_SYMBOLS, broadcastQuotes, (allQuotes) => {
  const payload = buildHeatmapPayload(allQuotes);
  broadcastSectorHeatmap(payload);
});
startPolygonIndexFeed(broadcastIndexQuotes);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
