# Google Search Console indexation execution

Date: 2026-09-08

## Baseline and rollback

- Baseline tag: `pre-gsc-indexation-execution-20260908` at `8edc91d4e5037acbcaab5f36b51241b8da547fa9`.
- No product, News, Blog, or database record is deleted by this change.
- Rollback: `git revert <execution-commit>` and redeploy, or redeploy the baseline tag.

## Confirmed production baseline

- Search Console page report, last updated 2026-09-04: 1.45k indexed and 1.14k not indexed URLs.
- Live sitemap index returned HTTP 200 with 907 URLs: 19 pages, 5 categories, 876 products, and 7 posts.
- Live `robots.txt` allows public crawling and only disallows `/admin/` and `/api/`.
- Sampled sitemap pages and product details returned HTTP 200 with self-referencing canonical URLs.
- The Search Console report's 834 duplicate URLs contains historic filter and quote parameters. Current filter page-one URLs redirect to their clean equivalents; filtered pages and quote parameters use `noindex,follow` with a clean canonical.
- The eight robots-blocked examples are historic quote URLs. They are no longer blocked by the current `robots.txt`; Google should be asked to validate that repair after deployment.

## Changes

1. Product indexability now requires a genuine non-generic reference or a four-digit year range in addition to existing image, vehicle, and product-specific data requirements. This removes 21 weakly identified pages from the sitemap while preserving their public inquiry pages as `noindex,follow`.
2. Legacy `/collections`, `/search`, and order-tracking paths normalize to their canonical public destinations with HTTP 308. Vercel applies the non-www host redirect before application middleware, so a non-www legacy URL can retain a second canonical-host 308; this is intentional and avoids weakening the canonical-host policy.
3. Three known legacy wheel/accessory URLs with no current compatible product are explicitly returned as HTTP 410. No unrelated URL is redirected to the homepage.

## Google submission status

- Production has `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, and `GOOGLE_SEARCH_CONSOLE_SITE_URL` configured as protected environment variables.
- Sitemap maintenance uses the official Search Console Sitemap API and stores execution records in the production database.
- The latest recorded successful canonical sitemap submission was 2026-09-07T06:08:42.747Z. The application enforces a minimum three-day external submission interval, so this deployment must not bypass that throttle with a duplicate request.
- On 2026-09-08, Search Console's `Blocked by robots.txt` remediation was submitted through the property UI. The console showed `Validation started`; this covers the eight historical quote URLs that are no longer disallowed by the live robots policy.

## Production verification after deployment

- Deployment `dpl_CWezcE1Y4T1p5s5QzriLUbwAGXUp` is ready and aliased to `https://www.cowinmotors.com`.
- The live sitemap contains 886 URLs: 19 pages, 5 categories, 855 products, and 7 posts.
- Sampled retired product URLs return 410. The quote page and quote parameters return HTTP 200 with `noindex,follow` and canonical `https://www.cowinmotors.com/quote`.
- A redundant filtered category page-one URL returns 308 to its clean filtered equivalent.
