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
2. Canonical-host redirects now combine the non-www redirect with legacy `/collections`, `/search`, and order-tracking normalization into one 308 hop.
3. Three known legacy wheel/accessory URLs with no current compatible product are explicitly returned as HTTP 410. No unrelated URL is redirected to the homepage.

## Google submission status

- Production has `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, and `GOOGLE_SEARCH_CONSOLE_SITE_URL` configured as protected environment variables.
- Sitemap maintenance uses the official Search Console Sitemap API and stores execution records in the production database.
- The latest recorded successful canonical sitemap submission was 2026-09-07T06:08:42.747Z. The application enforces a minimum three-day external submission interval, so this deployment must not bypass that throttle with a duplicate request.
