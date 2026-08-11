# Rollback Plan: cowinmotors

## Baseline

- Git tag: `pre-news-automation-unification-20260811`.
- Local configuration/code backup: `/Users/apple/Documents/cowinmotors.com-backups/news-automation-unification-20260811/`.
- Existing content is not deleted by the new migration; the migration only adds fields/tables/indexes.

## Application rollback

1. Revert the deployment commit or redeploy the baseline tag.
2. Remove the two proposed News cron entries from `vercel.json` before any subsequent production deployment.
3. Set `NEWS_AUTOMATION_PRODUCTION_ENABLED=false` to stop publication while retaining candidates and logs.

## Data rollback

1. Automated articles are identifiable by `site_id`, `source_fingerprint`, `event_fingerprint`, and a matching `news_publication_runs` record.
2. Mark a problematic automated article `archived` and `indexable=false`; do not delete it until a reviewed URL disposition exists.
3. Retain `news_delivery_checks` and `news_audit_events` as evidence. New auxiliary tables can remain harmlessly unused after code rollback.
