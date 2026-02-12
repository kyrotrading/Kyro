# Trading Platform

Real-time stock quotes for **AAPL**, **SPY**, and **TSLA** using Next.js 14, Express, Socket.IO, and Polygon.io.

## Setup

1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Environment**
   - Copy `.env.example` to `.env` in the project root and set `POLYGON_API_KEY` ([get one at polygon.io](https://polygon.io)).
   - Optional: copy `frontend/.env.local.example` to `frontend/.env.local` and set `NEXT_PUBLIC_WS_URL` if the backend runs on a different host/port.

3. **Run locally**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:3001  
   - WebSocket server: http://localhost:4000  

Without a Polygon API key, the server uses mock data so you can still run the app.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Run frontend and server in development |
| `npm run dev:frontend` | Run only Next.js (port 3000) |
| `npm run dev:server` | Run only Express + Socket.IO (port 4000) |
| `npm run build` | Build frontend and server |
| `npm run start` | Run production build (both apps) |
| `npm run install:all` | Install root + frontend + server deps |

## Deploy (Railway)

- `railway.json` and `nixpacks.toml` are set for Nixpacks.
- Set `POLYGON_API_KEY` in Railway variables.
- Set `NEXT_PUBLIC_WS_URL` to your deployed server URL (e.g. `https://your-app.railway.app`) if frontend is served from a different domain.

## Stack

- **Frontend:** Next.js 14, Tailwind CSS, Socket.IO client
- **Server:** Express, Socket.IO
- **Data:** Polygon.io (REST snapshot); mock data when no API key
