# Automation settings, 2026-10-01

## Changes

- Removed News ingest and publish from Vercel cron configuration.
- Both retired News cron endpoints return HTTP 410 for GET and POST, without calling a worker.
- Site configuration disables News automation independently of environment values. Existing worker entry points enforce this switch before database writes, fetching or composition.
- Production NEWS_AUTOMATION_PRODUCTION_ENABLED was set to false through Vercel CLI.
- Existing News content and manual management remain available.
- Blog routes, webhook, credentials and publishing implementation are unchanged.
- Google sitemap maintenance changed from daily at 02:10 UTC to Monday at 02:10 UTC (10:10 Asia/Shanghai).
- Submission eligibility is checked for Shanghai Monday, with at most one attempt per Monday. The existing database task lock prevents concurrent submissions; force runs cannot bypass the weekday/deduplication rule.
- The existing submission-attempt timestamp is retained. A failed attempt is recorded and the next automatic attempt is the following Monday.
- Sitemap generation and Blog sitemap updates remain independent of the Google submission schedule.

## Checks

- Fourteen tests passed: Google weekday/timezone/deduplication tests, existing sitemap tests and existing Blog validation tests.
- No database migration or article modification is required.
- Next scheduled Google run: 2026-10-05 10:10 Asia/Shanghai. A future Google response cannot be verified before that execution.

## Rollback

Code baseline: git tag backup/pre-news-stop-weekly-google-20261001.
Restore the changed files from that tag in a new commit and redeploy if rollback is authorized. News also requires review of its production environment switch before re-enabling; do not restore it during routine deployment rollback without checking the requested operational state.
