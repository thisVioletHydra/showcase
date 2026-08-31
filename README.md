# Showcase — digital goods store

Test assignment: Vite + React vitrina, Node + SQLite backend, idempotent payments, supplier recovery, promocodes.

## Quick start

```bash
pnpm install
pnpm back    # backend http://127.0.0.1:3000
pnpm front   # frontend http://127.0.0.1:5173 (proxies /api)
```

## Deploy

### Frontend → GitHub Pages (recommended for static)

```bash
pnpm --filter frontend build:pages
# dist/ → GitHub Pages (base path /showcase/)
```

Set repository variable `VITE_API_URL` in GitHub Actions to your backend URL (e.g. Railway or local tunnel for demo).

Workflow: `.github/workflows/pages.yml` — runs on push to `main` / `master`.

### Backend → Railway / Render / Fly (recommended with SQLite)

Current backend uses **SQLite on disk** (`DB_PATH`). Deploy as a Node process with a persistent volume:

```bash
pnpm --filter backend build
pnpm --filter backend start
```

Env: `PORT`, `DB_PATH`, `ADMIN_TOKEN`, `CORS_ORIGIN`.

### Backend on Vercel

Not supported as-is: plain `http.createServer` + local SQLite file does not persist on serverless. Would need serverless handlers + Turso/Postgres.

## Race scripts

With backend running:

```bash
pnpm race:webhook
pnpm race:promo
```

## Idempotency

One paid order → one fulfillment → one key: `event_id` dedup, conditional `created → paid`, `fulfillments.order_id` PK, atomic key grab under `BEGIN IMMEDIATE`.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Store vitrina |
| `/order?id=` | Order status, promocode, payment simulation |
| `/admin` | Admin panel (`Authorization: Bearer dev-admin-token`) |
