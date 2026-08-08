# Cowinmotors Automotive Parts

Next.js website for **Cowinmotors Automotive Parts**, the public brand of Quzhou Qiying Import & Export Co., Ltd.

## Positioning

China-Based Automotive Parts Sourcing & Export Partner. The catalog supports fitment-led B2B and retail-friendly inquiries for automotive lighting, exhaust systems, forged wheels, and exterior parts. Product pages are inquiry-led and do not represent stock, authorization, certification, price, or delivery commitments unless separately verified in an order document.

## Operations

- News remains manual-only. Buyer Guides use a server-side, owner-authorized daily publishing schedule for a finite set of pre-reviewed evergreen sourcing guides; there is no external Blog webhook, crawler, RSS import, or AI news generator.
- The only Vercel Cron is the monthly inquiry-email delivery check.
- Sitemap generation is dynamic and manual maintenance is protected. The site does not programmatically submit sitemaps or indexing requests to Google.
- Product catalog source: `public/data/site-data.json`; product images: `public/assets`.
- Database-backed content and inquiries use `DATABASE_URL`.

## Verification

```bash
pnpm exec tsc --noEmit
pnpm exec next build
pnpm exec node --test scripts/sitemap.test.mjs
SITE_URL=http://localhost:3000 node scripts/final-audit-smoke.mjs
```

## Backups and Rollback

The pre-removal Git baseline is tagged `pre-news-automation-removal-20260808`. The matching code bundle and News/Sitemap database export are stored outside the repository under `/Users/apple/Documents/cowinmotors.com-backups/news-automation-removal-20260808`.
