# Cowinmotors News Automation And Site Self-Check

Date: 2026-07-08
Site: https://www.cowinmotors.com

## Source Documents

- `News Automation System Development(1).pdf`
- `网站自检指令(1).pdf`

## Completed Fixes

- Removed the internal Cowinmotors daily brief fallback from News automation. Auto-published News now depends on real external public sources instead of generated filler content.
- Expanded the trusted RSS source list with additional aftermarket, collision, repair, and parts-industry publishers.
- Added external News image validation. News covers must be reachable image URLs and must not use Cowinmotors site, product, or media-library images.
- Added News cover image provenance fields for fetch time, URL hash, and verification status.
- Added public News APIs for list, detail, categories, and product-related News.
- Added protected admin News task APIs for jobs, audits, collection preview, publish, and retry.
- Added `/blog` and `/blog/[slug]` redirects to the News system so legacy Blog URLs do not 404 or duplicate content.
- Fixed News category filters so they reflect all published articles, not only the current page slice.
- Fixed concurrent Postgres index creation races during builds and runtime schema initialization.
- Changed dry-run News automation so it does not persist job or audit rows.
- Added a dedicated `scripts/news-and-site-selfcheck.mjs` verification script for public pages, News APIs, image rules, source attribution, JSON-LD, RSS, sitemap, product relations, and admin API protection.

## Operational Notes

- Vercel Cron remains configured for `/api/cron/news-automation` daily execution.
- Cron remains protected by `CRON_SECRET`.
- The system will not publish weak or fake articles just to hit the daily target. If source availability is low inside the freshness window, the audit can be incomplete by design.
- The public Blog path is intentionally redirected to News because this site uses one source-backed content system.

## Local Verification Checklist

- TypeScript check passed with `pnpm exec tsc --noEmit`.
- Next.js production build passed with `pnpm exec next build`.
- Public smoke test passed against `http://localhost:4300` with `scripts/final-audit-smoke.mjs`.
- News and site self-check passed against `http://localhost:4300` with `scripts/news-and-site-selfcheck.mjs`.
- The checked News article used an external source image from `www.aftermarketmatters.com` and linked 3 related products.
- Cron dry-run returned success and did not change `news_jobs` or `news_publication_audits` counts.
- Production verification should be repeated after Vercel deployment with `SITE_URL=https://www.cowinmotors.com`.

## Rollback

- Revert the commit that changes `lib/news.ts`, `lib/database.ts`, `app/news/page.tsx`, `app/api/news`, `app/api/admin/news`, `app/api/products/[id]/news`, `app/blog`, `scripts/final-audit-smoke.mjs`, `scripts/news-and-site-selfcheck.mjs`, and this report.
