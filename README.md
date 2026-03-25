# Store Analytics Dashboard

A multi-tenant analytics dashboard for Amboras store owners. The system stores raw events as the source of truth, pre-aggregates analytics for fast reads, and serves a responsive dashboard for revenue, conversion, top products, and recent activity.

## Setup Instructions

### 1. Start infrastructure

From the project root:

```bash
docker compose up -d
```

This starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 2. Configure environment variables

Create:

- `backend/.env`
- `frontend/.env.local`

Use the values from `.env.example`.

Recommended values:

`backend/.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/amboras_analytics?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=4000
FRONTEND_URL="http://localhost:3000"
JWT_SECRET="amboras-dev-jwt-secret-2026-local-only"
INGESTION_API_KEY="amboras-ingest-key"
BACKEND_URL="http://localhost:4000"
```

`frontend/.env.local`

```env
BACKEND_URL="http://localhost:4000"
```

### 3. Install and set up the backend

```bash
cd backend
npm install
npm run prisma:generate
npm run db:push
npm run db:seed
```

### 4. Install the frontend

```bash
cd frontend
npm install
```

### 5. Run both apps

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

### 6. Open the app

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000/api/v1`

### 7. Demo flow

1. Open the login page.
2. Select a seeded demo store.
3. Open the dashboard.
4. Verify:
   - revenue today / week / month
   - conversion rate
   - top products
   - recent activity
   - `7d / 14d / 30d` trend toggle

## Architecture Decisions

### Data Aggregation Strategy

- Decision: I used a hybrid write-time aggregation strategy with raw events plus aggregate tables.
- Why: Querying millions of raw events on every dashboard request would get slower as data grows. Instead, raw events are stored in `events`, while dashboard reads come from pre-aggregated `store_daily_stats` and `product_daily_stats`.
- Trade-offs: This makes the write path a little more complex because ingestion updates multiple tables, but it keeps analytics reads fast and predictable.

### Real-time vs. Batch Processing

- Decision: I used a hybrid near real-time approach.
- Why: Events are stored immediately, aggregate rows are updated during ingestion, and the frontend refreshes analytics periodically with polling. This gives a near real-time feel without adding the complexity of sockets or a streaming platform.
- Trade-offs: Polling is simpler and reliable for a take-home, but it is not true push-based real-time. There can be a small delay before new events appear on the dashboard.

### Frontend Data Fetching

- Decision: I used Next.js route handlers to proxy requests to the NestJS backend, and SWR for frontend data fetching.
- Why: This keeps backend tokens off the client fetch layer, makes auth handling cleaner, and gives loading, retry, and background refresh behavior with minimal code.

### Performance Optimizations

- Pre-aggregated `store_daily_stats` for overview metrics.
- Pre-aggregated `product_daily_stats` for top products.
- Raw `events` table kept as the source of truth for recent activity and replay potential.
- Indexed reads on store-scoped analytics tables and recent event lookups.
- Short-lived caching for overview and top-products.
- Recent activity limited to 20 items.
- Dashboard summary cards are fixed business KPIs, while the `7d / 14d / 30d` toggle only affects trend-based sections. This keeps the UI clear and avoids recomputing unnecessary summary views on every toggle.

## Known Limitations

- Aggregation is coupled to the ingestion path. At much larger scale, I would likely move this into a queue or stream-based processing layer.
- Revenue windows are calculated in UTC because store-specific time zone rules were not part of the prompt.
- Real-time behavior is implemented with polling, not WebSockets or SSE.
- The demo auth flow is intentionally lightweight and not a full production authentication system.
- The seeded data is enough for demonstration, but not a true multi-million-row benchmark.

## What I'd Improve With More Time

- Add hourly aggregation for richer intraday trends.
- Add a replay/rebuild job for aggregate tables from raw events.
- Add real-time push updates with WebSockets or Server-Sent Events.
- Add a custom date range picker.
- Add automated API and integration tests.
- Add store-level time zone support so “today” and “this week” reflect merchant locale.
- Add larger-scale seed or benchmark tooling to show measured performance under heavier load.

## Time Spent

- Approximately `ADD_YOUR_TIME_HERE`
