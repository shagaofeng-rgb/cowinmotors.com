# News Automation Unification: Local Implementation Summary

## Scope and safety boundary

This implementation covers the single configured site, `cowinmotors` (`https://www.cowinmotors.com`). It was prepared locally on 2026-08-11 and has **not** been deployed, pushed, or enabled in production. The rollback baseline is the Git tag `pre-news-automation-unification-20260811`; the configuration backup is stored outside the repository at `/Users/apple/Documents/cowinmotors.com-backups/news-automation-unification-20260811`.

## Implemented changes

- Added a central, typed site configuration in `lib/news-site-config.ts`. It holds the stable `site_id`, routes, language, timezone, industry scope, product-theme plan, source allowlists, and production gate. Workers and cron routes load this configuration instead of carrying brand or domain values.
- Added site-scoped News audit entities, candidate states, publication states, per-site locks, idempotency keys, retry records, and delivery-check records in `lib/news-automation.ts`. The schema migration is invoked only by an authenticated, enabled job.
- Added separate authenticated cron endpoints:
  - `GET /api/cron/news-ingest`: 12-hour candidate-only pipeline.
  - `GET /api/cron/news-publish`: 12-hour dispatcher that publishes only when the site-specific 48-hour window is due.
- Added non-active Vercel schedule declarations for the two endpoints. They become active only after an approved deployment and after `NEWS_AUTOMATION_PRODUCTION_ENABLED=true` is explicitly set in the Vercel Production environment.
- Enforced News/Blog separation in the publication path: automated News writes only to `news_articles`; it never reads or writes `blog_articles`, Blog routes, Blog sitemap, or Blog APIs.
- Changed public News queries to require `site_id`, `published`, and `indexable=true`. Existing legacy News remains preserved in storage and administration, but its 132 noindex rows are excluded from public lists, related content, RSS and sitemap until individually reviewed.
- Added source attribution and editorial-disclaimer panels to the News detail template. News cards no longer carry product sales links; detail pages are limited to one optional, natural product context link.
- Added the requested audit package in `docs/news-automation-audit/cowinmotors/` and the read-only script `scripts/generate-news-triage.mjs` for regenerating the historical News triage list.

## Runtime behavior

### 12-hour ingest

The ingest handler validates the site configuration, source allowlist, age limit, language, relevance, source quality, copyright status and duplicate fingerprints. It writes only candidate/audit records. It does not call the composing adapter, CMS publishing route, sitemap rebuild, RSS update, search index, or any Blog code.

### 48-hour publish

The publish handler uses a site-scoped 48-hour cycle and lock. It selects only that site's unused high-score candidates and current product-theme context. If required, it attempts an approved fallback allowlist. It requires a configured external composer adapter; the adapter must return source-grounded original analysis within the configured word range. Missing credentials, invalid output, failed CMS persistence, cache refresh failure, or a failed public-page check leaves the publication run in `retry_pending` or `failed` rather than falsely recording success.

`published_success` is written only after HTTP checks confirm the new article on the News list, its News detail route, the News sitemap, and RSS where enabled. The same article is also checked for absence from Blog paths. Browser evidence remains a required production acceptance step and has not been claimed from this local run.

## Local evidence

| Check | Result |
| --- | --- |
| Existing News rows inspected | 132, all preserved; all currently `indexable=false` |
| Historical triage export | Generated: `04-existing-content-triage.csv` (132 rows) |
| Type check | `pnpm typecheck` passed |
| Production build | `pnpm build` passed, including both new cron routes |
| Sitemap checks | `pnpm sitemap:test` passed, 9/9 |
| Catalog checks | `pnpm catalog:test` passed |
| Anonymous cron request | HTTP 401 |
| Authenticated local cron with production gate disabled | Both endpoints returned an explicit no-write skip |

## Required before any production release

1. Obtain explicit production deployment approval.
2. Add `CRON_SECRET`, `NEWS_AUTOMATION_PRODUCTION_ENABLED=true`, `NEWS_COMPOSER_URL`, and `NEWS_COMPOSER_TOKEN` to Vercel Production. The composer must be legally authorized and must provide source-backed, original editorial analysis; it must not copy feed articles or expose secrets.
3. Deploy the reviewed commit, then run four authenticated ingest windows and review source/candidate/audit records.
4. Run a controlled publication cycle and retain HTTP plus browser evidence for News list, News detail, News sitemap, RSS, mobile layout, JSON-LD, and Blog isolation.
5. Monitor the first 48-hour cycle and confirm exactly one publicly visible, attributable News article is recorded as `published_success`.

## Known limitations and unresolved items

- No production credentials for the composition adapter were provided in this task, so source fetch, candidate insertion, composition, CMS publication and public verification were intentionally not run against production.
- Because deployment is not authorized in this instruction, Vercel has not registered the new schedules and no production `news_*` schema migration has been applied.
- Historical News entries are preserved rather than automatically deleting, redirecting or reindexing them. Their row-by-row `keep`, `update`, `merge-301`, `noindex-follow`, or `remove` decision is captured in the triage CSV and requires editorial review before any destructive SEO action.
