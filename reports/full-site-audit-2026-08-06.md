# Cowinmotors Full-Site Audit - 2026-08-06

## Scope And Evidence

- Audit window: 2026-08-06 09:37-09:50 Asia/Shanghai.
- Production domain: `https://www.cowinmotors.com`.
- Backup created before any change: `/Users/apple/Documents/cowinmotors.com-backups/audit-20260806-093754`.
- Backup contents: Git bundle, pre-change Git status and HEAD, data files, `.env.local`, `.env.example`, deployment configuration, scripts, SHA-256 manifest, and a restricted Postgres logical export.
- Secrets are intentionally omitted from this report and are stored only in the permission-restricted backup.

## Overall Status

The application builds successfully and the tested public, News, Sitemap, admin-login, authorization, and validation paths are operational. A real database and News publication pipeline are in use. The daily Google Sitemap submission issue was found and fixed: submissions are now persisted and throttled to one attempt every three days.

## Runtime Inventory

| Item | Trigger | Frequency | Real input/output | Status |
| --- | --- | --- | --- | --- |
| News automation | Vercel Cron `/api/cron/news-automation` | Daily, 01:00 UTC | RSS sources -> relevance/deduplication -> Postgres News -> public News/RSS/Sitemaps | Verified |
| Sitemap maintenance | Called by News automation and protected admin/cron route | After News or manual authorized request | Postgres News + product catalog -> Sitemap XML + `cowin_sitemap_runs` | Verified |
| Google Sitemap notification | Sitemap maintenance only | At most once per 3 days | Sitemap URL -> Google Search Console Sitemaps API -> persisted status/message | Fixed and verified |
| Inquiry email health test | Vercel Cron `/api/cron/inquiry-email-test` | Monthly, day 1 at 01:00 UTC | Test inquiry -> Postgres + SMTP delivery | Existing schedule confirmed; latest database record is 2026-08-01 |
| Public inquiry | POST `/api/inquiry` | Visitor initiated | Validated RFQ -> Postgres -> SMTP | Validation verified without creating a new inquiry |
| Analytics | Browser tracker -> POST `/api/analytics/track` | Visitor initiated | Event -> Postgres | Storage verified; input validation tightened |
| Blog | `/blog` and `/blog/[slug]` redirects only | Request initiated | Redirects to News | No automatic publishing path exists |

There is no message-queue dependency in `package.json`, no Blog Cron entry in `vercel.json`, and no Blog publisher, queue consumer, webhook, or scheduled API route in the code search.

## Data And Database Verification

- Database: Neon Postgres, successfully queried on 2026-08-06T01:38:53Z.
- Logical backup exported before changes: `postgres-logical-backup.json` in the backup directory above.
- Tables discovered: 17. Key live counts: `news_articles=124`, `news_products=359`, `news_jobs=39`, `news_publication_audits=38`, `cowin_sitemap_runs=11` before the audit verification run, `cowin_analytics_events=2391`, `cowin_inquiries=6`.
- Primary keys, News foreign key, and catalog/analytics/Sitemap indexes are present. Added index: `cowin_sitemap_runs_google_status_completed_at_idx`.
- News integrity query found: zero duplicate slugs, zero duplicate source fingerprints, zero published articles without a product relation, zero published articles with incomplete content/SEO fields, zero missing cover URLs, and zero future publish times.
- Cover status terminology was checked: 111 rows are `source-image-verified`; 13 legacy rows are `verified`. These are valid historical statuses, not missing images.
- Latest ten published News records match the public `/api/news?limit=10` response exactly for slug, title, category, publication time, and canonical URL.
- Product catalog is real imported supplier catalog data (`1683` records), not placeholder records. The current authoritative catalog implementation is the versioned product catalog JSON used by both public pages and the admin catalog view. It has `1016` local product-image paths and `667` original supplier-image URLs; no product record has an empty or missing image path. A production sample of 50 local product assets returned 50/50 successful responses.

## News And Blog Verification

- Current News jobs: 39/39 `completed`; the latest completed at 2026-08-06T01:00:30Z with zero retries and no error.
- Latest publication audit: 2026-08-06, Asia/Shanghai, target 4, published 4, missing 0, status `complete`.
- A protected, non-writing dry-run returned `200` and confirmed the normal daily target was already met (`existingToday=4`).
- A separate non-writing dry-run with target 5 exercised real RSS collection, relevance scoring, product association, image validation, deduplication, and article construction: 55 candidates, 1 publishable candidate, 6 rejections, and a complete dry-run audit. It did not write an article, job, or publication audit.
- Historical News audits include six old `incomplete` entries. They are retained as truthful history. Recent daily runs (2026-08-04 through 2026-08-06) are complete.
- Blog automatic publishing is not present. `/blog` and `/blog/[slug]` are redirect-only compatibility routes; they have no database writes and are excluded from Sitemap generation.

## Google SEO Frequency Fix

### Root Cause

The daily News Cron called `runSitemapMaintenance({ submit: true })`. Every content change therefore submitted the Sitemap to Google daily. Database records show nine consecutive successful daily submissions through 2026-08-06.

### Fix

- Added a persisted, database-backed three-day global throttle in `lib/sitemap.ts`.
- The throttle reads the most recent real Google attempt (`success` or `failed`) from `cowin_sitemap_runs`, so deployments, admin requests, and repeated Cron calls cannot bypass it.
- Added the query index above and documented `GOOGLE_SEARCH_CONSOLE_SUBMIT_INTERVAL_DAYS=3`.
- Sitemap generation itself remains daily after News updates; only the external Google notification is throttled. `robots.txt`, canonical URLs, JSON-LD, Sitemap XML, and News Sitemap behavior are unchanged.

### Verification

An authorized production-style local request returned `200`, generated 1,567 URLs with zero errors, and stored:

- `googleStatus=throttled`
- Last attempt: `2026-08-06T01:00:31.604Z`
- Next eligible attempt: `2026-08-09T01:00:31.604Z`

The previous successful Google response remains preserved in the run log: `Search Console accepted the Sitemap submission.`

## Application, API, Security, And SEO Regression

### Confirmed Normal

- `next build`: passed; 263 static pages generated plus all listed dynamic routes.
- Type check: passed.
- Sitemap unit suite: 12/12 passed.
- Local production smoke: all 18 public/admin-login/API/SEO endpoints passed.
- News-specific self-check: passed, including real source link, cover image, related product, RSS, JSON-LD, child Sitemaps, and protected admin APIs.
- Tested valid routes returned 200: home, catalog, five category areas, quote, support, News, RSS, robots, Sitemap index, News Sitemap, and admin login.
- Tested invalid routes returned 404: unknown path, unknown product, unknown News slug.
- `robots.txt` disallows `/admin/` and `/api/`; Sitemap index is valid XML with four child Sitemaps.
- Latest News page has title, canonical, JSON-LD, and source attribution.
- Unauthenticated admin, Cron, and analytics-health calls return 401.
- Invalid analytics event and incomplete inquiry payload both return 400 without database writes.

### Fixed

| Issue | Root cause | Fix |
| --- | --- | --- |
| Daily Google Sitemap submissions | Daily News job always requested external submission | Persisted 3-day throttle with explicit audit record and index |
| Public analytics health disclosure | `/api/analytics/health` returned storage mode and database state to anyone | Restricted the endpoint to an authenticated admin session |
| Analytics event type acceptance | Tracking endpoint accepted arbitrary event type values | Limited accepted types to page view, engagement, click, and form submit |

### Not Automatically Changed

| Item | Reason / impact | Recommendation |
| --- | --- | --- |
| 667 supplier-hosted wheel images | They are original supplier URLs, not missing placeholders. Removing or copying them would alter existing catalog content and may have licensing implications. | Migrate approved supplier images to company-controlled object storage before using them as long-term primary assets. |
| Product CRUD database workflow | The current catalog is a real, shared versioned catalog file. The admin supports search/export/status, but not product create/edit/delete persistence. | Build a separately approved catalog migration and editorial workflow after defining ownership, media storage, approvals, and rollback policy. |
| Vercel CPU/memory/process/log dashboards | Not exposed to this local workspace or the repository. | Review Vercel Observability/Function Logs and Neon dashboard after deployment; enable alerts for failed Cron execution. |
| Direct Search Console performance query | Local service-account private key is not present, so a second read-only metrics query could not be performed locally. | The successful Sitemap API records prove write access; use the authenticated admin Search Console page or add a valid read credential for metrics verification. |
| Browser-console and physical device testing | This audit environment has no attached browser automation session. | Run the existing production smoke suite plus a Chrome/Android/iOS visual pass after deployment. |

## Performance Measurements

Measurements use `curl` on 2026-08-06 and are server-response measurements, not Core Web Vitals.

| Environment | Page | HTTP | TTFB / total |
| --- | --- | --- | --- |
| Production before this deployment | `/` | 200 | 0.922s / 1.212s |
| Production before this deployment | `/products` | 200 | 0.968s / 1.329s |
| Production before this deployment | `/news` | 200 | 1.104s / 1.410s |
| Production before this deployment | `/sitemap.xml` | 200 | 1.132s / 1.132s |
| Local production build, warm median | `/` | 200 | 0.013s / 0.014s |
| Local production build, warm median | `/products` | 200 | 0.015s / 0.020s |
| Local production build, warm median | `/news` | 200 | 1.682s / 1.691s |
| Local production build, warm median | `/sitemap.xml` | 200 | 1.177s / 1.178s |

Post-deployment production measurements must be appended after the Vercel release is live. The News and Sitemap paths are database-backed dynamic routes; their response time is expected to be higher than static catalog pages.

## Changed Files

- `lib/sitemap.ts`: persisted three-day Google submission throttle and index.
- `app/api/analytics/health/route.ts`: admin-only health response.
- `app/api/analytics/track/route.ts`: event-type validation.
- `lib/adminData.ts`: admin schedule metadata updated to the real three-day behavior.
- `.env.example`, `README.md`: documented operational configuration.
- This report.

## Rollback

1. Roll back the deployment to the prior Vercel Git deployment, or reset to the commit recorded in `git-head-before.txt` from the backup directory.
2. Restore tracked code with `git clone` from `repository.bundle` or `git reset` to the backup commit in an isolated worktree.
3. Restore the database from `postgres-logical-backup.json` only through a reviewed migration script; do not run an unreviewed bulk restore against production.
4. Restore `.env.local`, data files, and deployment configuration from the restricted backup directory if configuration rollback is required.
