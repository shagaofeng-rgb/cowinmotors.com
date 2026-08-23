# Cowinmotors Admin Analytics Upgrade - 2026-08-23

## Purpose

This change upgrades the Chinese-language administration area so operating reports use first-party traffic events that have passed a data-quality filter. It adds date filtering, pagination, visitor paths, masked IP grouping, customer labels, country/channel views, and a traffic-quality audit view.

## Backup and rollback

- Baseline Git tag before the change: `backup/admin-analytics-20260823`.
- Database change: additive columns and indexes only. No existing product, inquiry, visitor, or content record is deleted or rewritten.
- Rollback code: deploy the baseline tag or the prior commit. New analytics columns are backward-compatible and can remain in place; do not drop columns without a separately approved database migration.

## Data behavior

- Production analytics writes now fail closed: a production database write failure returns an error instead of silently falling back to a local file.
- A stable event identifier prevents duplicated page or form events when the browser retries a request.
- Form submission is recorded once by the server after a real inquiry is accepted. The browser no longer records a second form event.
- Default reports include only `real` traffic. Test, internal, preview, crawler, headless-browser, command-line client, and `collect`, `collects`, or `collection` source traffic is retained for audit but excluded from operating totals.
- A masked IP and a salted one-way IP hash are used for grouping. The default admin interface does not show a full visitor IP address.
- Legacy events are re-evaluated by the same quality rules at read time so historic preview and bot traffic is also excluded without deleting source records.

## Added admin surfaces

- `/admin/visitors`: searchable, paginated real-visitor directory with country, source, channel, device, customer labels, and session/page-view counts.
- `/admin/visitors/[visitorId]`: per-visitor path history within the selected reporting window.
- `/admin/data-quality`: exclusion counts, reasons, sources, and an audit table for excluded/reviewed events.
- `/admin/analytics`, `/admin/pages`, `/admin/inquiries`, and journeys: shared preset/custom date filter and 30-second live refresh where operationally useful.

## Data quality rules

The rules exclude explicitly marked test inquiries, local development traffic, `test`, `collect`, `collects`, `collection`, `codex`, and `internal` source patterns, social preview crawlers, headless test clients, command-line clients, and bot/crawler user agents. Rules are intentionally visible in the data-quality section so ambiguous traffic can be reviewed rather than silently deleted.

## Validation to run after production deployment

1. Load `/admin/settings` and confirm the business database reports as connected.
2. Load `/admin/data-quality` and confirm excluded events are not included in default analytics totals.
3. Load `/admin/visitors`, apply a custom date range and a country/source filter, then open one visitor path.
4. Submit one real controlled inquiry only when operationally required; verify there is a single server-side form event and a linked visitor journey.
5. Confirm `/admin/inquiries` and its CSV export return the same date-bounded result set.

## Privacy note

Visitor IP data should be handled as personal data. The admin interface exposes only a masked representation and uses a salted hash for grouping. Access remains behind the existing admin authentication.
