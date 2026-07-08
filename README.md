# cowinmotors.com

Next.js website for Cowinmotors automotive headlights, tail lights, exhaust systems, forged wheels, body kits, product detail pages, RFQ flow, support pages, news automation, analytics, and a Chinese management backend.

## Stack

- Next.js App Router
- React
- TypeScript
- Static product data from `public/data/site-data.json`
- Local assets under `public/assets`
- Neon Postgres support through `DATABASE_URL`
- Vercel Cron for inquiry email tests and news automation

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Public Routes

- `/`
- `/products`
- `/headlights`
- `/tail-lights`
- `/exhaust`
- `/wheels`
- `/body-kits`
- `/product/[id]`
- `/quote`
- `/support`
- `/news`
- `/news/[slug]`
- `/blog` redirects to `/news`
- `/blog/[slug]` redirects to `/news/[slug]`

## Public APIs

- `GET /api/news` public News list with `page`, `limit`, `category`, and `tag` filters
- `GET /api/news/[slug]` public News detail payload
- `GET /api/news/categories` published News category counts
- `GET /api/products/[id]/news` product-related News

## Admin Routes

- `/admin` data overview
- `/admin/products` product management, search, pagination, export
- `/admin/categories` product categories
- `/admin/news` news automation status
- `/admin/news-categories` news categories
- `/admin/inquiries` customer form submissions, search, pagination, export
- `/admin/analytics`, `/admin/visitors`, `/admin/pages`, `/admin/journeys`
- `/admin/search-console` Google Search Console data
- `/admin/media` product and UI image library scan
- `/admin/users` account and role model
- `/admin/audit-logs` export and admin action audit trail
- `/admin/settings` environment/configuration checks
- `/admin/sync` cron and data sync status

## Admin APIs

All admin APIs require the admin session cookie.

- `GET /api/admin/overview`
- `GET /api/admin/products`
- `GET /api/admin/products/export`
- `GET /api/admin/categories`
- `GET /api/admin/inquiries`
- `GET /api/admin/inquiries/export`
- `GET /api/admin/news-categories`
- `GET /api/admin/media`
- `GET /api/admin/users`
- `GET /api/admin/audit-logs`
- `GET /api/admin/sync`
- `GET /api/admin/search-console/overview`
- `GET /api/admin/news/jobs`
- `GET /api/admin/news/audits`
- `POST /api/admin/news/collect`
- `POST /api/admin/news/publish`
- `POST /api/admin/news/retry`

## Environment

Copy `.env.example` and configure production values in Vercel. Required production values:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH` or `ADMIN_PASSWORD`
- `ADMIN_JWT_SECRET`
- `DATABASE_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- `INQUIRY_TO_EMAIL`, `INQUIRY_CC_EMAIL`
- `CRON_SECRET`
- `NEWS_DAILY_TARGET`, `NEWS_TIMEZONE`, `NEWS_LOOKBACK_HOURS`, `NEWS_DEDUP_DAYS`, and `NEWS_RELEVANCE_THRESHOLD`
- Google Search Console OAuth or service account variables when SEO data sync is required.

## Verification

Run the production-style checks before deploy:

```bash
pnpm exec tsc --noEmit
pnpm exec next build
SITE_URL=http://localhost:4300 node scripts/final-audit-smoke.mjs
SITE_URL=http://localhost:4300 node scripts/news-and-site-selfcheck.mjs
```

## Backup And Restore

- Database data is stored in the Postgres database configured by `DATABASE_URL`.
- Export products and inquiries from the admin pages before major catalog changes.
- For Neon, use the provider dashboard or CLI branch/backup features before bulk imports.
- Product images and UI assets currently live in the repository under `public/assets`; future upload management should use object storage.
- Static catalog recovery is possible from Git history for `public/data/site-data.json`.

## Security Notes

- Admin sessions use an HTTP-only cookie.
- Production should use `ADMIN_PASSWORD_HASH` plus a strong `ADMIN_JWT_SECRET`.
- Do not commit real SMTP, Google, database, or admin secrets.
- CSV exports are audit-logged when `DATABASE_URL` is configured.

## Deployment

The repository is ready for Vercel Git deployment.

Recommended Vercel settings:

- Project name: `cowinmotors.com`
- Framework preset: `Next.js`
- Build command: `npm run build`
- Install command: `npm install`
- Output directory: leave default
- Production branch: `main`

Domain file:

```text
CNAME -> cowinmotors.com
```
