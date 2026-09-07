# Google Search Console indexation remediation

Date: 2026-09-07

## Baseline and rollback

- Git baseline: `pre-gsc-remediation-20260907` at `10ba3ab93c1767185d250dcdc21c4710fe6413b6`.
- Production configuration inventory was recorded before the change. Secrets are intentionally excluded from this document.
- Roll back application code with `git revert <remediation-commit>` or redeploy the baseline tag. The database migration only adds a nullable sitemap submission timestamp and is backward compatible.

## Confirmed Search Console baseline

- Search Console reported 1.11k indexed and 211 not indexed URLs in the submitted sitemap view on 2026-09-04.
- 210 submitted URLs were `Discovered - currently not indexed`; one was `Crawled - currently not indexed`.
- The submitted sitemap was successful, last read on 2026-09-06, and reported 1,318 discovered URLs.
- The broader `All known pages` view included 834 duplicate URLs, 48 noindex URLs, 11 historical 404 URLs, 10 alternate canonical URLs, 6 redirects, and 8 intentionally blocked URLs. Those are not the current sitemap denominator.

## Changes

1. Category pages no longer emit redundant `category=<same-category>` parameters, and `page=1` redirects to the clean URL.
2. Category filter results use `noindex,follow`; unfiltered pagination uses a self-referencing canonical and numeric pagination links.
3. The quote page remains `noindex,follow`, but is no longer disallowed in robots.txt so search engines can process that directive.
4. A wheel product is eligible for the sitemap only when it has first-party media and real size, material, finish, and reference data. Existing wheel pages remain accessible for inquiry.
5. The sitemap splits product entries into 300-URL files for clearer Search Console monitoring.
6. The sitemap maintenance task now uses the official Search Console Sitemap API after sitemap content changes, with a three-day external-submission limit, database audit log, and a daily Vercel trigger.

## Validation performed before deployment

- TypeScript type check passed.
- Sitemap unit tests passed.
- Catalog, News, and Blog checks passed.
- Production build passed.
- Local HTTP verification confirmed:
  - redundant category URL: HTTP 308 to its clean equivalent;
  - filtered category URL: `noindex,follow`;
  - page two: HTTP 200 and self canonical;
  - quote URL: `noindex,follow` and not blocked in robots;
  - sitemap: six valid child sitemaps and 907 total URLs, including 876 product URLs and no wheel URLs.

## Post-deployment acceptance checks

1. Call the protected sitemap maintenance endpoint once and verify a Search Console API success response is logged.
2. Confirm Search Console accepts the updated sitemap index and reads its product chunks.
3. Recheck the 210 discovered product URLs after 7, 14, and 28 days; only request validation for repaired duplicate and legacy-URL issues.
4. Do not request validation for intentionally noindexed or redirected pages.
