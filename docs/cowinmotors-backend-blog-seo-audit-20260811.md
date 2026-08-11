# Cowinmotors Backend, Blog, SEO and Site Audit

Audit date: 2026-08-11 UTC
Production site: `https://www.cowinmotors.com`
Scope: application code, live Neon database, public routes, authenticated admin APIs, Vercel cron configuration, Blog webhook publishing, sitemap/SEO behavior, and regression tests.

## Change safety and rollback

- Baseline Git tag: `pre-backend-blog-seo-audit-20260811`.
- Read-only production database snapshot: `/Users/apple/Documents/cowinmotors.com-backups/backend-blog-seo-audit-20260811/database-snapshot.json`.
- Configuration snapshots: `/Users/apple/Documents/cowinmotors.com-backups/backend-blog-seo-audit-20260811/` (permissions restricted to the local account).
- Roll back application code with `git revert <deployment-commit>` or by redeploying the baseline tag. The audit did not delete existing content or production records.
- One explicitly labelled Webhook test article was created to prove the write path, then changed to `draft`; it is not visible on the public Blog and is excluded from the sitemap.

## Confirmed normal

### Database and data integrity

Live read-only database checks completed on 2026-08-11:

| Check | Result |
| --- | --- |
| Public tables | 20 reachable tables |
| Blog records | 3 `published`, 1 internal audit `draft` |
| Duplicate Blog `external_fingerprint` values | 0 |
| Published News records | 132 |
| News queue records | 0 |
| Inquiry records | 6, all have a creation timestamp |
| Analytics events | 2,643 (`page_view`, `engagement`, `click`, `form_submit`) |
| Sitemap/sync records | 12 normal records and 2 dry-run records |

Relevant database indexes exist for Blog publication lookup, inquiry date/visitor lookup, and analytics date/type/visitor-session lookup. The Webhook implementation uses the unique `blog_articles.external_fingerprint` key, so a repeated push updates the same record instead of creating a duplicate.

### Public site and access controls

The pre-deployment production check returned HTTP `200` for `/blog`, `/news`, `/api/news`, `/sitemap.xml`, and `/robots.txt`. Unauthenticated calls to `/api/cron/buyer-guides`, `/api/cron/sitemap-maintenance`, `/api/admin/blog`, and `/api/admin/search-console/overview` returned `401`.

Local production-build regression testing passed for the home page, product catalog and five category pages, quote, support pages, News, Blog, sitemap, RSS, robots, the public News APIs, and `/admin/login`. The audit also confirmed that the inquiry API rejects a missing phone number and protected admin APIs reject anonymous requests.

## Fixed in this change

### Blog publishing plugin

The former signed Blog endpoint and its root-POST compatibility rewrite had been removed by the earlier content-automation cleanup. This was the concrete cause of third-party plugin publishing no longer reaching the Blog.

The following production-safe behavior is restored:

- `POST /api/webhook/send_article` accepts `application/x-www-form-urlencoded` fields: `sign`, `class_id`, `title`, `content`, `author_id`, and `image_url`.
- `POST /` internally rewrites to that endpoint for compatibility with the custom Webhook framework. `GET /` remains the normal home page.
- A valid validation-only request returns `{ "code": 1, "msg": "验证成功" }` and never writes an article.
- A complete valid payload publishes an article and returns `{ "code": 1, "msg": "发布成功" }`.
- The key is read only from `WEBHOOK_ARTICLE_SIGN`; it is not present in browser code, Git, documentation, or API responses.
- Article title/content are normalized to plain text before storage; only HTTPS cover-image URLs are retained; the content is rendered as text paragraphs rather than injected HTML.
- A `blog_publication_events` table records successful and failed delivery attempts without recording the key or request body.
- The Blog management view now shows the actual article state. A draft is no longer shown as published.
- The sitemap state is marked dirty after an article is published or the audit test is withdrawn.

### Real end-to-end Webhook evidence

Using a temporary local-only signing key against the live configured database:

1. Root-path verification request returned `{"code":1,"msg":"验证成功"}`.
2. A complete article request returned `{"code":1,"msg":"发布成功"}`.
3. Repeating the same article request again returned `{"code":1,"msg":"发布成功"}` and retained one record only.
4. Database result: article id `6668c87e-ab71-4768-9334-47f0f9f39da7`, source `plugin-webhook`, one unique fingerprint, and two successful publication-event records (create then idempotent update).
5. The public `/blog` route rendered the article while it was published.
6. The article was then changed to `draft`; `/blog` no longer contained its title (0 occurrences), and sitemap state was marked dirty.
7. An authenticated local request to `/api/admin/blog` returned HTTP `200` and includes the audit article with its stored state after rebuilding the updated source.

The test is intentionally retained as an internal draft rather than deleted so the audited write/read record remains traceable. It has no public URL while drafted.

### News automation and running tasks

- There is no News crawler, RSS importer, AI News generator, scheduled News publisher, News queue worker, or News Vercel cron in the deployed configuration.
- The former daily `/api/cron/buyer-guides` task has been removed in this change. Existing published Buyer Guides remain untouched.
- `vercel.json` now contains one production schedule only: `/api/cron/inquiry-email-test` at `0 1 1 * *` (monthly email delivery health check).
- The News module remains database-backed and manually managed; no existing News articles were removed or modified.

Repository search was run for crawler, RSS, AI generation, auto Blog, IndexNow, scheduled News, queue and previous Buyer Guide task terms. Remaining matches are only the intentional signed Webhook configuration and documentation statement that News is manual.

### Google SEO submission frequency

There is currently **no active Google proactive submission task** in the production configuration to reschedule. The current sitemap implementation explicitly records automatic external indexing submission as disabled and directs canonical sitemap submission through Search Console. `vercel.json` has no Google/Search Console/sitemap cron, and the local configuration contains no Search Console OAuth/service-account credentials.

Therefore no daily Google task was changed to "every three days": changing a non-existent task would be misleading and inventing a submission mechanism would not comply with Google rules. Sitemap generation, canonical URLs, robots directives, structured data, and public sitemap routes remain active. If a legitimate Google Search Console OAuth integration is later configured, its scheduler must be implemented as a stateful three-day cadence with a single task and audited execution log; it must not use an unsupported indexing endpoint.

## Existing limitations and required production configuration

### Blocker: Vercel signing secret

The production Vercel environment currently has no `WEBHOOK_ARTICLE_SIGN`. The restored endpoint correctly returned HTTP `503` with `{ "code": 0, "msg": "Blog publishing is not configured." }` in the production-build test and wrote the failure event `Webhook rejected because WEBHOOK_ARTICLE_SIGN is not configured.` This audit cannot set the production variable because the available Vercel CLI/OIDC identity is unauthorized and no authenticated Vercel dashboard session is available.

Required Vercel production configuration (do not commit the value):

```text
Name: WEBHOOK_ARTICLE_SIGN
Value: a new 48-byte-or-longer random secret
Environment: Production
```

After saving, redeploy the production deployment. The same exact secret is the plugin API key. The plugin should use:

```text
Framework: Custom development framework Webhook
Domain: https://www.cowinmotors.com
Validation category ID: blog
Endpoint behavior: POST / is forwarded internally to /api/webhook/send_article
Content type: application/x-www-form-urlencoded
```

No secret is included in this report. The local temporary key used during testing was destroyed after the test.

### Product data architecture

The public catalog is real local catalog data loaded from `public/data/site-data.json` (1,683 source records), filtered by `lib/products.ts`; it is not a simulated API response. However, product records are not yet a database-backed editable product table, and the current product admin API reads this same catalog source. This is a real architecture limitation for live product editing and full database-to-front-end product synchronization. It was not migrated during this audit because a production data-model migration across 1,683 records requires a dedicated, reviewed import/reconciliation plan rather than an unsafe in-place rewrite.

## Test record

| Test | Result |
| --- | --- |
| Type check | `pnpm typecheck` passed |
| Static check | `pnpm lint` passed (project maps it to TypeScript validation) |
| Production build | `pnpm build` passed; 1,461 static paths generated |
| Sitemap tests | 9/9 passed |
| Catalog self-check | passed; 667 source wheel records, 417 public forged-wheel records, 250 excluded |
| Local full-site smoke | passed; 22 main routes/endpoints returned valid non-empty responses |
| Signed validation Webhook | passed |
| Signed publish Webhook | passed |
| Duplicate delivery idempotency | passed; one article row retained |
| Draft exclusion from public Blog | passed |
| Anonymous admin API access | correctly blocked with `401` |

## Production deployment verification

Commit `6f03df9` was pushed to `main` and the existing Git-to-Vercel integration deployed it. The production verification completed after the new behavior appeared:

| Production check | Result |
| --- | --- |
| Full-site smoke test | 22/22 main routes and public endpoints returned HTTP `200` with non-empty responses |
| Root Webhook POST | HTTP `503` plus the expected JSON configuration response, proving the new rewrite and endpoint are live |
| Direct Webhook GET | HTTP `405`, as intended for a POST-only API |
| Removed Buyer Guides cron route | HTTP `404` |
| Remaining monthly inquiry cron | HTTP `401` without its bearer secret |
| Protected sitemap-maintenance route | HTTP `401` without its bearer secret |

Measured production response timings before/after this deployment were stable (single-request network samples):

| Route | Before: TTFB / total | After: TTFB / total |
| --- | --- | --- |
| `/` | 1.618s / 1.905s | 1.403s / 1.618s |
| `/products` | 1.092s / 1.411s | 1.100s / 1.484s |
| `/blog` | 1.249s / 1.351s | 1.103s / 1.271s |
| `/news` | 1.152s / 1.465s | 1.019s / 1.293s |
| `/sitemap.xml` | 1.068s / 1.068s | 0.915s / 0.915s |

## Changed files

- `.env.example`
- `README.md`
- `middleware.ts`
- `vercel.json`
- `lib/blog.ts`
- `app/api/webhook/send_article/route.ts`
- `app/api/cron/buyer-guides/route.ts` (removed)
- `app/admin/(protected)/blog/page.tsx`
- `app/admin/(protected)/sync/page.tsx`

## Next production verification after deployment

1. Push this change so Vercel builds the new endpoint.
2. Verify `POST https://www.cowinmotors.com/` without a key returns the expected non-success configuration response, not a redirect or `405`.
3. Configure `WEBHOOK_ARTICLE_SIGN` in Vercel Production and redeploy.
4. Submit the plugin validation request, then one clearly labelled test article; verify the response, database row, `/api/admin/blog`, `/blog`, article detail, and sitemap.
5. Change that test article to draft or remove it through the approved admin workflow after confirmation.
