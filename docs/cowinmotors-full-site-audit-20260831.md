# Cowinmotors Full-Site Audit and Repair Report

Audit window: 2026-08-30 to 2026-08-31 (Asia/Shanghai)

Production site: https://www.cowinmotors.com

## Backup and rollback

- Baseline commit: `dba333e`
- Baseline tag: `pre-full-audit-20260830-202436-dba333e` (pushed to origin)
- Backup directory: `/Users/apple/Documents/cowinmotors.com-backups/full-audit-20260830-202436`
- Backup contents: Git bundle, compressed public-database export, local environment snapshot, Vercel production environment-name snapshot, and manifest.
- Restore code with the baseline tag or `repository.bundle`. Restore database records from `database-public.json.gz` only after reviewing the affected tables and taking a new current backup.

No secret values are included in this report.

## Confirmed normal

- Production home, product lists, category pages, product details, News, Blog, Support, About, Contact, Quote, admin login, robots, sitemaps, and RSS returned the expected status.
- Unknown routes return 404; protected admin and Cron APIs reject unauthenticated requests.
- Sitemap audit checked 1,323 submitted URLs: all returned HTTP 200; no duplicate URLs, non-www URLs, query-string URLs, noindex pages, missing or mismatched canonicals, missing titles, or missing descriptions were found.
- Canonical host redirects from non-www to `https://www.cowinmotors.com` are active.
- Product catalog self-check passed: 667 source wheel records, 417 public forged-wheel records, and 250 excluded non-compliant records.
- The production database has no invalid indexes. Product, Blog, News, inquiry, analytics, synchronization, and delivery-check records are readable.
- Blog contains 10 published and 2 draft articles with no duplicate fingerprints at the audit baseline.
- News contains 133 published articles with no duplicate source URLs at the audit baseline.
- Latest verified News publication run was `published_success`, with a corresponding frontend delivery check.
- Production runtime logs checked during the audit contained no application warnings or errors in the sampled period.

## Fixed

### Inquiry data quality

- Added `cowin_inquiries.is_test` and `cowin_inquiries.test_reason` with an indexed query path.
- Public and admin inquiry summaries now exclude marked test records by default; direct detail lookup can still retrieve a marked record for controlled QA.
- The public inquiry API marks automated/example-domain test submissions, records the reason, excludes their analytics conversion, and skips customer notification email.
- The dedicated monthly email-delivery Cron remains explicitly marked as a test but still exercises the email-delivery path.
- Removed a duplicate client-side `form_submit` call from the missing-model form. The server remains the single conversion-recording authority.
- Restored the complete five-category product selector: Headlights, Tail Lights, Exhaust Systems, Forged Wheels, and Body Kits.

### Real analytics

- Historical automatic-browser, preview, crawler, HTTP-client, Collect/collection, Codex, and internal traffic was reclassified as excluded rather than deleted.
- After the classification pass, the database contained 1,309 real events and 1,773 excluded events. Admin KPIs read only qualified traffic.
- Five clearly identified historical QA inquiries were marked and removed after the backup. One genuine inquiry remains unchanged.
- A real end-to-end QA submission proved that a marked test inquiry is hidden from the customer list while its first-party visit journey remains available in the detail view. The marked inquiry and all three related QA events were then deleted.

### Background-task reporting

- The admin synchronization page now reads real records from Sitemap maintenance, News ingest, News publish, and Blog webhook tables.
- It evaluates the latest run per task type instead of treating old dry-runs as permanent service failures.
- Rejected Blog webhook requests are displayed separately from accepted Blog publication runs. A bad-signature request remains visible as a security event but no longer masks a later valid publication success.
- Added 10/25/50/100-row pagination to the synchronization log.

### Blog content governance

- Production verification found seven third-party Blog posts about electric bicycles, motorcycles, dirt bikes, or wheelchairs. These subjects are outside the Cowinmotors automotive-parts scope.
- Preserved those records but changed them to `withdrawn`, removing them from the public Blog and sitemap without deleting audit history.
- Added server-side webhook industry validation. Signed requests must now demonstrate a clear automotive-parts and vehicle-fitment focus; adjacent industries and generic supplier content are rejected and logged.
- Added automated tests for an accepted automotive fitment guide and rejected out-of-scope content.

### Responsive behavior

- Added safe wrapping for long mobile navigation company text.
- Set mobile form controls to 16px across RFQ, search, fitment, homepage fitment, and homepage quick-inquiry forms to prevent iOS input zoom.
- Raised compact product/form action text to a readable minimum.
- Mobile DOM checks at 390 x 844 found no document-level horizontal overflow or completed broken images on Home, Products, product detail, News, Blog, Quote, admin overview, or admin inquiries.

## Data consistency evidence

- Inquiry database, server API, admin list, and detail page were checked using a marked QA record. The API returned `testExcluded: true`; the default admin list excluded it; the detail route showed the associated page view, click, and form submission; cleanup then removed all QA records.
- The sole historic genuine inquiry is visible through the 90-day admin filter and opens in a dedicated detail view. It predates journey tracking, so the UI correctly reports that no journey identity exists rather than inventing one.
- Admin overview reads live qualified analytics and showed real PV, UV, channel, country, device, landing-page, and exclusion counts during local production-mode verification.
- News ingest and publication records, Blog webhook records, and Sitemap runs are read directly from their production database tables.

## Schedules and active programs

| Task | Production schedule | Purpose | Verified state |
| --- | --- | --- | --- |
| Inquiry email test | `0 1 1 * *` UTC | Monthly delivery health check | Configured; test records isolated |
| News ingest | `0 */12 * * *` UTC | Source collection, validation, scoring, and candidate storage | Latest sampled run completed |
| News publish dispatcher | `5 */12 * * *` UTC | Dispatcher with internal 48-hour publication guard and frontend verification | Latest sampled run published_success |
| Blog webhook | External signed POST | Third-party Blog publication | Valid successes present; rejected attempts separated |
| Sitemap maintenance | Application/SEO maintenance path | Build and validate sitemap set and Search Console submission state | Historical normal runs present |

No duplicate Vercel Cron entry for these jobs was found in `vercel.json`.

## Automated verification

- TypeScript type check: passed.
- Catalog self-check: passed.
- Sitemap and News tests: 11 passed, 0 failed.
- Blog webhook scope tests: 3 passed, 0 failed.
- Next.js production build: passed; 1,461 static pages generated.
- Production-route crawl: 1,323 sitemap URLs returned 200 at baseline.
- Mobile responsive checks: passed on eight representative public/admin routes.
- Inquiry E2E: passed and test data cleaned.

## Files changed

- `app/admin/(protected)/sync/page.tsx`
- `app/api/cron/inquiry-email-test/route.ts`
- `app/api/inquiry/route.ts`
- `app/globals.css`
- `components/MissingModelForm.tsx`
- `lib/adminData.ts`
- `lib/database.ts`
- `lib/blog.ts`
- `lib/blog-industry-scope.ts`
- `scripts/blog-webhook-validation.test.mjs`
- `package.json`
- `docs/cowinmotors-full-site-audit-20260831.md`

Database migration:

```sql
ALTER TABLE cowin_inquiries ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE cowin_inquiries ADD COLUMN IF NOT EXISTS test_reason TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS cowin_inquiries_test_created_at_idx
  ON cowin_inquiries (is_test, created_at DESC);
```

## Residual facts and risks

- The one genuine historical inquiry has no phone or visitor/session identifiers because it was created before those fields became mandatory. It is intentionally preserved and not backfilled with guessed data.
- Rejected Blog webhook attempts remain in the audit table. They are useful security evidence and are not publication failures when a valid signed publication subsequently succeeds.
- Google controls crawl and indexing timing. Sitemap correctness and Search Console submission can be verified, but indexing cannot be guaranteed or forced by the application.
- The repository has unrelated untracked Facebook-ad generation scripts and a Python cache directory. They were not modified or included in this work.
