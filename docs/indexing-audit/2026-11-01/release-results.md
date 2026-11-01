# Release Results

Date: 2026-11-01 (Asia/Shanghai)

## Published Repair

- Repository: `shagaofeng-rgb/cowinmotors.com` only.
- Production commit: `d1baee8ccaf9281740034afc5c742e8f605dbea8` (includes repair `be561f8824eda87934b092ac180e703ee9274799`).
- Vercel project: `prj_qRquN6wuZm7ExoRRTVuJsRTshBHB` / `cowinmotors-com`.
- Production deployment: `dpl_FbBW8eWy8KL7Pb74RztYe7bvoXEk`, READY.
- URL: https://www.cowinmotors.com
- Deployment hostname: https://cowinmotors-5jodol0o3-davidsha.vercel.app
- Verified production aliases include `www.cowinmotors.com` and `cowinmotors.com`.
- Non-www homepage still returns HTTP 308 to the www homepage.

## Verification

- 36 Node unit tests: passed.
- TypeScript typecheck: passed.
- Next.js production build: passed (1,461 generated static routes).
- 36 HTTP regression checks against the built local service: passed.
- Same 36 HTTP checks against the public production hostname: passed. See `production-regression.json`.
- Full pre-release sitemap crawl: 895 distinct public URLs, all passed status/indexability/canonical checks after one transient TLS failure was retried. Homepage root slash representations are treated as equivalent. See `before/summary.json` and `before/url-dispositions.csv`.
- Post-release sitemap membership: 895 URLs; no additions or removals. See `sitemap-post-deploy.json`. This is a membership comparison, not a second HTTP crawl of all 895 pages.
- Public post-release variant/sample crawl is recorded separately in `after/`. It is not an authenticated Google inspection result.
- Local test service was stopped after verification.

## Scope of Completion

**The P1 task is not fully complete.** The catalog-template defect is fixed and published, but full GSC exports and category-wide verification remain blocked by repeated browser-control/download timeouts. The user granted full authorization; this is a technical control failure, not a missing permission.

Only 10 actual duplicate examples and their last-crawl dates were captured. Neither the missing 828 duplicate examples nor any of the 371 noindex / 353 crawled-not-indexed / 18 historical 404 examples were fabricated from the sitemap. No category restart was submitted, because the full affected lists and class-specific repairs are not established.

Google baseline validation statuses remain those in `gsc-category-status.csv`; they are not newly verified outcomes. Robots/discovered categories were already Started. The other categories were Failed. A successful deployment or HTTP check does not mean GSC validation has passed or indexing has occurred.

## Files Changed

- `lib/category-url.ts`: consistent strict page normalization and filter-specific indexability.
- `app/products/page.tsx`: self-canonical unfiltered pagination, intentional filter noindex, year-preserving links, out-of-range 404.
- `app/headlights/page.tsx`, `app/tail-lights/page.tsx`, `app/exhaust/page.tsx`, `app/wheels/page.tsx`: strict shared page handling and out-of-range 404.
- `scripts/category-url.test.mjs`, `scripts/catalog-indexation-regression.mjs`: unit and HTTP regression coverage.
- `scripts/indexation-live-audit.py`: read-only sitemap/variant audit with Python 3.9 HTTP 308 support.
- This evidence directory: observed Google samples, template dispositions, public audit data, and release results.

Unrelated advertising scripts/output were left untouched. No other site's repository or deployment was modified. Product-quality noindex, admin noindex, canonical host redirects, retired-product behavior, and News/Blog content policies remain unchanged.

## Remaining Work

Restore a functional GSC browser export/control channel, export affected lists and validation detail, group the actual URLs, review distinct content/soft-404/internal linking for the 353 class and every reported 404, then restart only verified repaired categories. Do not attempt to make every historical excluded URL indexable.

## References

- Google pagination guidance: https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- Google export limits: https://support.google.com/webmasters/answer/12919797?hl=en
