# Schedules and Trigger Chain: cowinmotors

| Task | Entry | Schedule / timezone | Writes | Can publish | Current state | Treatment |
| --- | --- | --- | --- | --- | --- | --- |
| Inquiry email health check | `/api/cron/inquiry-email-test` | `0 1 1 * *`, Vercel UTC | inquiry audit/email records | No | Existing | Keep |
| Legacy Buyer Guides publisher | removed route | Former daily `0 2 * * *` | `blog_articles` | Yes | Removed before this audit | Keep removed; Blog is excluded from News automation |
| News ingest | `/api/cron/news-ingest` | proposed `0 */12 * * *`, Vercel UTC | `news_ingest_runs`, `news_candidates`, fingerprints, audit events | No | Code prepared, not deployed | Add only after production approval/configuration |
| News publish dispatcher | `/api/cron/news-publish` | proposed `5 */12 * * *`, Vercel UTC; stateful 48-hour due gate | publication run, one `news_articles` row, delivery check, audit events | Yes | Code prepared, not deployed | Add only after production approval/configuration |
| Sitemap maintenance | `/api/cron/sitemap-maintenance` | protected manual route; no Vercel schedule | sitemap state/run records | No | Existing | Keep |

The publish dispatcher can wake every 12 hours solely to evaluate the persisted 48-hour window. It does not compose or publish until a verified `published_success` is older than 48 hours. This avoids calendar-month drift while preserving exactly one result per due window.

Every automated route requires `Authorization: Bearer $CRON_SECRET`. Production publishing also requires `NEWS_AUTOMATION_PRODUCTION_ENABLED=true` and a configured composer adapter; otherwise it exits without creating content.
