# Local Verification and Production Readiness: cowinmotors

## Completed locally

- `pnpm typecheck` passed.
- `pnpm build` passed and includes the new `/api/cron/news-ingest` and `/api/cron/news-publish` routes.
- `pnpm sitemap:test` passed (9/9).
- `pnpm catalog:test` passed.
- The News ingest and publish endpoints reject anonymous requests with HTTP `401`.
- With a local test `CRON_SECRET`, both authenticated endpoints returned `{ "ok": true, "skipped": true, "reason": "Production News automation is disabled by configuration." }`.
- `NEWS_AUTOMATION_PRODUCTION_ENABLED` defaults to `false`; both ingest and publish exit without reading or writing News data while the flag is disabled.
- No production deployment, production cron registration, production source fetch, candidate insertion, automated composition, publication, redirect, deletion or index-status mutation was performed during this task.

## Required before production enablement

1. Add `CRON_SECRET`, `NEWS_AUTOMATION_PRODUCTION_ENABLED=true`, `NEWS_COMPOSER_URL`, and `NEWS_COMPOSER_TOKEN` to the target Vercel Production environment.
2. Confirm that the external composer is contractually authorized, returns source-grounded original analysis, and never exposes credentials or source content beyond permitted excerpts.
3. Deploy only after an explicit production approval.
4. Run four authenticated ingest cycles, inspect candidate/audit tables, then run one controlled publish cycle.
5. Capture HTTP and browser evidence for the News list, detail page, sitemap and RSS, and verify the same article is absent from Blog storage and pages.

The missing production composer credentials are a deliberate safe stop: the system refuses to manufacture a 700-1,000 word News article from a short feed summary or publish unverified content.
