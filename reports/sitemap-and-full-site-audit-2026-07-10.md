# Cowinmotors Sitemap And Full-Site Audit

## Scope

- Production domain: `https://www.cowinmotors.com`
- Sitemap generation, chunking, robots declaration, scheduling, logs, locking, manual execution, and Search Console submission readiness.
- Public desktop/mobile pages, navigation, forms, products, News/Blog compatibility, admin APIs, SEO/GEO, and production deployment checks.

## Sitemap Architecture

- `/sitemap.xml` is the public Sitemap Index.
- `/sitemaps/pages-1.xml`, `/sitemaps/categories-1.xml`, `/sitemaps/products-1.xml`, and `/sitemaps/posts-1.xml` are generated from canonical public data.
- Automatic chunking uses conservative 45,000 URL and 45 MB thresholds.
- `/news-sitemap.xml` contains only News published during the Google News two-day window.
- Daily maintenance is attached to the existing News Cron to stay within the two-job Vercel limit.
- Postgres stores the last successful manifest, dirty state, task lock, URL diffs, file metrics, errors, and Google submission status.
- Search Console submission remains disabled unless `GOOGLE_SEARCH_CONSOLE_ENABLED=true` and valid credentials are configured.

## Rollback

- Git tag before implementation: `backup-sitemap-20260710-f8e5399`.
- Restore by redeploying commit `f8e5399` or re-aliasing the previous READY Vercel deployment.
- Database additions are isolated `cowin_sitemap_*` tables and do not modify product, inquiry, analytics, or News records.

## Acceptance Evidence

- TypeScript validation passed with `tsc --noEmit`.
- Production build passed with `next build`.
- Sitemap unit suite passed: 12 of 12 tests, including XML escaping, public-URL filtering, splitting, locking, atomic replacement behavior, and Search Console failure handling.
- Catalog self-check passed: 417 public forged automotive wheels retained and 250 unsupported wheel, tire, motorcycle, and accessory records excluded.
- Local smoke checks passed for all core public pages, News/Blog compatibility routes, feeds, Sitemaps, robots, and the admin login page.
- Local Sitemap maintenance dry run passed: 1,532 canonical URLs across pages, category, product, and post Sitemap files.
- Browser checks passed at 1440px and 390px. The latest brand mark appears in the public header, footer, admin login, browser icon metadata, Apple touch icon, and site manifest. Mobile category navigation opens on click, stays visible while interacting with it, closes outside the panel, and stays within the viewport.

## Operational Note

- Google Search Console submission is enabled in the production environment. It will submit the Sitemap after scheduled News publishing and during manually authorized Sitemap maintenance. A successful API submission confirms receipt, not immediate indexing.
