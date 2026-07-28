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

The public wheel catalog uses a conservative forged-wheel allowlist. Motorcycle wheels, tires, accessories, trailer/RV items, Vossen HF/hybrid lines, and unverified non-forged wheel series remain in the source archive but are excluded from public pages, search, admin catalog counts, recommendations, and Sitemap generation.

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
- `/sitemap.xml` Sitemap Index
- `/sitemaps/pages-1.xml`, `/sitemaps/categories-1.xml`, `/sitemaps/products-1.xml`, `/sitemaps/posts-1.xml`
- `/news-sitemap.xml` Google News Sitemap for articles published in the last two days
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
- `GET /api/admin/sitemap`
- `POST /api/admin/sitemap`

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

## Sitemap Automation

The production Sitemap is generated dynamically from the public route model, the real product catalog, and published News records. `/sitemap.xml` is a Sitemap Index; child Sitemaps are split by content type and automatically chunk before 50,000 URLs or 50 MB. URL parameters, external canonicals, drafts, private/deleted/offline records, and noindex records are excluded. Product and fixed-page `lastmod` values are stable configuration dates; News uses its stored `updatedAt` or `publishedAt` value.

The existing daily News Vercel Cron also runs Sitemap consistency maintenance. This avoids a third Vercel Cron and preserves the monthly inquiry test. News publication marks the Sitemap dirty and the same workflow records URL additions, modifications, removals, generated files, counts, duration, errors, and Search Console submission status in Postgres. Public XML generation does not write partial files; the reusable export helper validates a temporary UTF-8 file before atomic replacement and preserves the previous file on failure.

Manual execution uses the protected cron endpoint and supports all requested flags:

```bash
npm run sitemap:generate -- --force --dry-run --submit --verbose
```

`CRON_SECRET` and `SITE_URL` must be present in the shell or `.env.local`. The public cannot trigger rebuilding without the secret. The admin session-protected status API is available at `/api/admin/sitemap`.

Production configuration:

```env
SITE_URL=https://www.cowinmotors.com
PRODUCT_CATALOG_UPDATED_AT=2026-07-06T15:54:15+08:00
PUBLIC_PAGES_UPDATED_AT=2026-07-08T21:17:48+08:00
GOOGLE_SEARCH_CONSOLE_ENABLED=false
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://www.cowinmotors.com/
GOOGLE_SEARCH_CONSOLE_SITEMAP_URL=https://www.cowinmotors.com/sitemap.xml
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

On Vercel, use `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY`; a local credentials path is supported for non-serverless deployments. Keep submission disabled until the service account email has Owner or Full permission on the exact Search Console property. To create it: enable the Google Search Console API in Google Cloud, create a Service Account, create a JSON key, then add its `client_email` to the Search Console property under Settings > Users and permissions. Never commit the JSON or private key. OAuth connections must grant the `webmasters` scope; reconnect once if an older connection only granted read-only access.

Run tests and inspect logs:

```bash
npm run sitemap:test
npm run sitemap:generate -- --dry-run --verbose
```

The Chinese admin page `/admin/sync` lists persisted `sitemap-maintenance` jobs, and `/api/admin/sitemap` returns the latest state and 30 recent runs. A Sitemap 404 usually means the deployed build predates the routes; invalid XML should be checked with `npm run sitemap:test`; a missing robots declaration should be verified at `/robots.txt`; API 403 means the service account lacks access to the exact Search Console property or the OAuth connection needs the full scope. A submitted Sitemap with unindexed URLs is not itself an error: submission does not guarantee crawling, crawling does not guarantee indexing, and final status must be confirmed in Google Search Console.

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
