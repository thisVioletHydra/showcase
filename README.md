# Showcase — digital goods store

Test assignment (GGSel-like): Vite + React vitrina, Node + SQLite backend.
Idempotent payments/webhooks, key pool under races, supplier recovery, promocodes.

## Quick start

```bash
pnpm install
pnpm back    # http://127.0.0.1:3000
pnpm front   # http://127.0.0.1:5173 (proxies /api and /webhook)
```

Buy flow: card **Купить** → `/order?id=` → simulate pay → key from pool.

Admin: `/admin` with `Authorization: Bearer dev-admin-token` (or `ADMIN_TOKEN`).

## Architecture (frontend, light FSD)

```
apps/frontend/src/
  app/         # App shell, global styles
  pages/       # home, order, admin
  widgets/     # Header, Hero, Services, Products, Reviews, Footer
  features/    # catalog / carousel / currency / order hooks
  shared/      # api, data, types, lib, ui icons
```

Backend stays classic `routes` + `services` (money path is where races matter).

## One-time fulfillment (how)

1. **Webhook `event_id`** — atomic `INSERT OR IGNORE` into `payment_events`; duplicates are no-ops.
2. **Early webhook** — if order is missing, event stays in `webhook_inbox` only; claim happens when the order exists (create + poll).
3. **Status** — conditional `created → paid` (and further); already-final orders ignore repeats.
4. **Key** — `BEGIN IMMEDIATE` + conditional `key_pool` update; `fulfillments.order_id` PK / `key_code` UNIQUE → one key per order.
5. **Suppliers** — same `request_id` returns the same code (timeout ≠ new issue); out_of_stock is recoverable after refill + admin retry.

## Reproduce races / acceptance

Backend must be running for race scripts (`pnpm back`).

```bash
pnpm test              # node:test — criteria 1–5 (+ amount mismatch, payment_failed)
pnpm race:webhook      # 50× duplicate event_id + 50× unique events → 1 key
pnpm race:early        # webhook for missing order + pay path + replay
pnpm race:promo        # LIMIT3 under parallel applies → exactly 3 uses
```

Optional env: `API_URL`, `PARALLEL`, `SKU=KEY-CS2-PRIME`.

## Deploy

### Frontend → GitHub Pages

```bash
pnpm --filter frontend build:pages
```

Set `VITE_API_URL` to your backend. Workflow: `.github/workflows/pages.yml`.

### Backend → Railway / Render / Fly

SQLite needs a persistent volume (`DB_PATH`).

```bash
pnpm --filter backend build
pnpm --filter backend start
```

Env: `PORT`, `DB_PATH`, `ADMIN_TOKEN`, `CORS_ORIGIN`.

## Submission checklist

1. Live front (Pages/Netlify/Vercel) or local README run
2. Repo / archive with this README
3. Race reproduction: `pnpm test` + `pnpm race:*`
4. One-time issue summary: section above
5. Time spent: _fill in_

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Vitrina |
| `/order?id=` | Status, promocode, payment simulate |
| `/admin` | Undelivered / unpaid filters, retry, key refill |
