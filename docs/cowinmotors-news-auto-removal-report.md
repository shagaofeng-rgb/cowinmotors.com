# News and Blog Automation Removal Report

Date: 2026-08-08

## Backup and rollback point

- Git tag: `pre-news-automation-removal-20260808`
- Git bundle: `/Users/apple/Documents/cowinmotors.com-backups/news-automation-removal-20260808/cowinmotors-pre-news-automation.bundle`
- Database export: `/Users/apple/Documents/cowinmotors.com-backups/news-automation-removal-20260808/news-and-sitemap-database.json`
- Restore code with `git checkout pre-news-automation-removal-20260808`; restore database only from the protected JSON export after reviewing the target environment.

## Removed from the running application

- Vercel daily News cron and `/api/cron/news-automation`.
- News collection, publish, retry, jobs, and audit API routes.
- Blog article webhook route `/api/webhook/send_article` and the root POST forwarding middleware.
- News crawler/generator/publisher reports, the old News self-check script, and Google external sitemap/index submission code.
- `WEBHOOK_ARTICLE_SIGN` from local and example environment configuration.
- Blog Webhook parsing and database-writing functions.

The only configured Vercel cron is the existing monthly inquiry-email delivery test at `0 1 1 * *`. It does not create or publish editorial content.

## Database migration completed

- Backed-up News tables contained 132 News articles, 41 jobs, 40 publication audits, 8 external sources, and 377 automatically created product relations.
- Added `news_articles.indexable` and `news_articles.editorial_note`.
- Retained all 132 legacy News URLs, set them to `indexable = false`, and added an editorial-review note.
- Deleted 377 automatic News-to-product relations.
- Dropped automation-only tables: `news_jobs`, `news_publication_audits`, and `news_sources`.
- Checked Blog migration: 0 historical Webhook-originated Blog articles required relabelling; no Blog content was deleted.

## New permitted workflow

News is now database-backed and manual only: authenticated administrators can create, save as draft, request review, publish, revise, delete, add source information, choose an original cover, set SEO fields, and manually choose related products. Publishing is not exposed through public webhooks, RSS imports, AI generation, queues, or scheduled tasks.

Legacy News stays reachable for URL continuity with `noindex,follow` and is excluded from the sitemap until an editor verifies and rewrites it. At audit time: 132 legacy News records, 0 indexable News records, 0 Blog records.

## Verification evidence

Local production-build checks on 2026-08-08:

- `POST /` -> `405` (no root Webhook forwarding)
- `POST /api/webhook/send_article` -> `404`
- `GET /api/cron/news-automation` -> `404`
- `GET /news` -> `200`
- `GET /api/news` -> `200`
- `GET /news-sitemap.xml` -> `200`, containing only indexable manual News when any exists

Production verification completed after deployment `dpl_CrcVYBmYoHpxzDDDnppsFk61me34`: root POST returned `405`; the removed Blog Webhook and News Cron returned `404`. Obsolete production variables `WEBHOOK_ARTICLE_SIGN`, `GOOGLE_SEARCH_CONSOLE_SITEMAP_URL`, and `GOOGLE_SEARCH_CONSOLE_ENABLED` were removed before deployment.
