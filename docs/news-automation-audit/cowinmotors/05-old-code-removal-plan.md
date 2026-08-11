# Old-Code Conflict and Removal Plan: cowinmotors

## Retained

- Manual News editor, history, source fields, public News routes, News RSS/sitemap and existing noindex flags.
- Separate Blog signed Webhook and all Blog records.
- Monthly inquiry-email health check and protected sitemap maintenance endpoint.

## Removed or superseded

- The former daily Buyer Guides publisher remains removed and is not reintroduced by this News automation.
- No former 6-hour News cron, scraper worker, queue consumer or draft-to-publish task is present in the current repository or Vercel configuration.
- Public News no longer lists historical `noindex` records.

## New replacement controls

- Twelve-hour ingest stores candidates only; no composer, CMS writer, sitemap refresh, RSS update or publish function is reachable from `runNewsIngest`.
- The 48-hour publisher uses a site-scoped lock, a candidate/source fingerprint, a publication-run state machine, a configured composition adapter, and HTTP verification of list/detail/sitemap/RSS before `published_success`.
- Failed work records `retry_pending` and audit events. It never falls back to Blog or another site.
