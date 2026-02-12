import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { startPolygonFeed, startPolygonIndexFeed } from "./polygon.js";
import { startSectorHeatmapFeed } from "./sectorHeatmap.js";

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
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

startPolygonFeed(DEFAULT_SYMBOLS, broadcastQuotes);
startPolygonIndexFeed(broadcastIndexQuotes);
startSectorHeatmapFeed(broadcastSectorHeatmap);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
