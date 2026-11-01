# cowinmotors.com P1 Indexation Remediation

Date: 2026-11-01 (Asia/Shanghai). Scope: this repository and its Vercel project only.

## Evidence and Limits

- Read the authenticated GSC domain-property report: 1.06k indexed / 1.63k excluded; data last updated 2026-10-23.
- The eight exclusion classes sum to 1,629 URLs. This is **not** the number of defects: intentional noindex, canonical alternatives, redirects, and genuinely removed pages can be correct.
- Duplicate detail: 838 affected; validation started 2026-08-13 and failed 2026-08-22. Captured the first 10 visible examples with their actual last-crawl dates in `gsc-observed-samples.csv`.
- CSV download and subsequent browser input repeatedly timed out. **Full 838 duplicate / 371 noindex / 353 crawled-not-indexed / 18 404 exports have not been obtained.** No synthetic URLs or inferred Google crawl dates are substituted.
- `gsc-category-status.csv` records baseline statuses and evidence gaps. Public audit CSVs are explicitly NOT GSC exports.
- Complete affected-URL grouping and Google-selected canonical/content inspection remain blocked on those exports. The user was asked to attach exports while implementation continued.

## Confirmed Template Defects and Changes

1. Production `/products?page=2` returned 200, `noindex, follow`, and canonical `/products`. Only meaningful filters now trigger noindex; real unfiltered pagination is self-canonical. Tracking-only parameters canonicalize without excluding the public landing page.
2. Product and category pages silently clamped overlarge page numbers to the last page. Five catalog routes now return real 404 for out-of-range pagination instead of serving duplicate last-page content.
3. Fractional/partial/invalid page strings could disagree between metadata and rendering (`parseInt` versus `Number`). Shared strict parsing and 308 normalization keep content and canonical consistent.
4. All-products pagination now preserves year separately from keyword, avoiding compounded year text in generated links. Category filters are retained on `/products`, but redundant category parameters are still removed on category routes.

No product noindex policy, admin noindex, robots blocking, host redirects, deleted legacy products, News/Blog content, or database data was altered. No unrelated 404 was redirected to the homepage. No speculative change was made to the 353 crawled-not-indexed pages.

Google recommends self-canonical pagination and excluding unwanted filter variations: https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading

## Tests and Release Gate

- 36 unit tests passed, including 13 new catalog URL tests.
- TypeScript typecheck passed.
- Production build, public full-sitemap audit, and deployment verification: see release results when completed.
- Regression includes canonical/indexability for normal pagination, intentional filter noindex, invalid-page redirects, and out-of-range 404 responses.

## GSC Validation

No category restart submitted. Without the full affected lists and complete class-specific checks, a restart would imply an unsupported class-wide fix. Existing robots/discovered validations remain unchanged; correct intentional exclusions are not treated as defects.

To finish: obtain the four exports (plus redirect/alternate examples), preserve last-crawl dates, group actual affected URLs by product/category/news/pagination/parameter/language, inspect representative product content/Google-selected canonicals and all 18 reported 404s, then restart only categories whose targeted fixes have passed regression.

## Rollback

Pre-change production deployment: `dpl_5kSoFgsn5dHkeSfHJyuvak6SnLEF`, commit `00b1ba12591c4e3476605a10af42c08dc6f5b426`. Revert the catalog-template repair commit and redeploy this project, or restore that known deployment. Do not touch other projects.
