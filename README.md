# Joyfit Tracker

Real-time occupancy tracker for JOYFIT24 gyms. Collects crowd data every minute, stores it in a cloud database, and visualizes trends through a web dashboard.

Built to answer one simple question: **"Is the gym crowded right now?"**

## How It Works

```
cron-job.org (every 1 min) → Vercel Serverless API → Turso (SQLite cloud)
                                      ↑
                              React Dashboard (Vercel static)
```

- **Data Collection**: An external cron service hits the `/api/collect` endpoint every minute
- **Storage**: Turso (libSQL) — a cloud-hosted SQLite-compatible database
- **API**: Hono running on Vercel Serverless Functions
- **Frontend**: React + Recharts, deployed as static files on Vercel

Everything runs on free tiers. No server, no local machine required.

## Dashboard

- Real-time occupancy count
- Time-series chart (today / week / month / all)
- Hourly average bar chart
- Day-of-week patterns
- Mobile-responsive

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun (local dev) / Node.js (Vercel) |
| API | Hono |
| Database | Turso (libSQL) |
| Frontend | React 19 + Recharts + Vite |
| Hosting | Vercel (free tier) |
| Cron | cron-job.org (free) |

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/andyyyy64/joyfit-tracker.git
cd joyfit-tracker
bun install
cd web && bun install && cd ..
```

### 2. Create Turso Database

```bash
turso db create joyfit-tracker
turso db show joyfit-tracker --url    # → libsql://...
turso db tokens create joyfit-tracker  # → auth token
```

### 3. Deploy to Vercel

```bash
vercel link
vercel env add TURSO_DATABASE_URL   # https://your-db.turso.io (use https://, not libsql://)
vercel env add TURSO_AUTH_TOKEN
vercel env add JWT_TOKEN            # Your JOYFIT app JWT
vercel env add STORE_ID             # e.g. 223
vercel env add CRON_SECRET          # Any random secret string
vercel --prod
```

### 4. Set Up Cron

Go to [cron-job.org](https://cron-job.org) and create a job:

| Field | Value |
|---|---|
| URL | `https://your-app.vercel.app/api/collect` |
| Schedule | Every 1 minute |
| Method | GET |
| Header | `Authorization: Bearer <your CRON_SECRET>` |

### 5. Local Development

```bash
cp .env.example .env
# Fill in JWT_TOKEN, STORE_ID, and optionally TURSO_* for remote DB

# Run collector locally (writes to local SQLite)
bun run collect

# Run API server (port 3456)
bun run server

# Run frontend dev server (port 5173, proxies API to 3456)
cd web && bun run dev
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/current` | Latest occupancy reading |
| `GET /api/occupancy?range=today\|week\|month\|all` | Time-series data |
| `GET /api/stats?range=today\|week\|month\|all` | Aggregated statistics |
| `GET /api/collect` | Trigger data collection (requires `Authorization` header) |

## Disclaimer

This project was built for **personal/educational use** to track gym occupancy at a single location.

The JOYFIT API used here was discovered through reverse engineering the official mobile app. This project is **not affiliated with, endorsed by, or connected to JOYFIT or Wellness Frontier Co., Ltd.** in any way.

**Important considerations:**

- This tool interacts with an undocumented, unofficial API that may change or break at any time
- Use this project at your own risk and responsibility
- Respect the service's terms of use and server resources (the 1-minute polling interval is intentionally conservative)
- Do not use this for commercial purposes or to overload the API
- If asked by the service provider to stop, please comply immediately

This repository is shared for educational purposes — to demonstrate how to build a full-stack data collection and visualization pipeline using free-tier cloud services.

## License

MIT
