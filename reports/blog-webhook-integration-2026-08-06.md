# Blog Webhook Integration Record

Date: 2026-08-06 (Asia/Shanghai)

## Scope

- Replaced the previous `/blog` redirect with database-backed Blog list and article pages.
- Added a signed, on-demand external publishing endpoint: `POST /api/webhook/send_article`.
- Kept Blog automatic publishing disabled. `vercel.json` contains no Blog cron; the existing News automation cron remains unchanged.
- Added canonical metadata, `BlogPosting` JSON-LD, navigation links, and sitemap entries for Blog content.
- Added `blog_categories` with the real `blog` category, a protected `/admin/blog` list, and a protected `/api/admin/blog` read endpoint.
- Added `/es/blog` and `/es/blog/[slug]` canonical redirects for locale-compatible integrations.
- Added a root `POST /` compatibility forward for custom-framework Webhook verification while preserving the existing home-page `GET /` behavior.

## Security and Data Handling

- A 48-byte random `WEBHOOK_ARTICLE_SIGN` was generated and stored only in ignored local configuration and the Vercel sensitive environment-variable store. It is not committed to Git.
- The endpoint uses timing-safe key comparison, accepts `application/x-www-form-urlencoded`, validates payload size and required fields, and normalizes externally supplied content to plain text before rendering.
- Public cover images require HTTPS. A first-party high-resolution image is used only when `image_url` is omitted or invalid.
- Every publish is idempotent by class, title, and author fingerprint. A repeated external request updates the same article rather than inserting a duplicate row.
- An authenticated request that does not contain a complete title and body returns `{ "code": 1, "msg": "验证成功" }` and never writes to `blog_articles`.

## Backup and Rollback

- Pre-change backup: `/Users/apple/Documents/cowinmotors.com-backups/blog-webhook-20260806-110125`
- Compatibility-change backup: `/Users/apple/Documents/cowinmotors.com-backups/webhook-framework-compat-20260806-112437`
- Backup contains a Git bundle, deployment configuration snapshot, local configuration snapshot with restricted permissions, and the relevant pre-change source files.
- Rollback: restore the Git bundle to the prior commit, redeploy it, and delete the `WEBHOOK_ARTICLE_SIGN` environment variable only after the old deployment is active. The `blog_articles` and `blog_categories` tables are additive and do not modify existing News, inquiry, product, or analytics data.

## Local Verification

- Type check: passed.
- Production build: passed.
- Signed webhook with an invalid key: rejected with HTTP 401 and `{ "code": 0 }`.
- Signed webhook with the valid key: returned HTTP 200 and `{ "code": 1, "msg": "发布成功" }`.
- Repeated identical signed publish: returned success and the database retained exactly one matching `blog_articles` record.
- Published article: `How to Prepare Vehicle Fitment Details for an Accurate Auto Parts Quote`.
- `/blog`, its article URL, and `/sitemaps/posts-1.xml`: all returned HTTP 200 and contained the published article/structured data/sitemap URL as applicable.
- `scripts/final-audit-smoke.mjs`, `scripts/news-and-site-selfcheck.mjs`, `scripts/sitemap.test.mjs`, and `scripts/catalog-selfcheck.mjs`: passed.

## Plugin Contract

- Method: `POST`
- Content type: `application/x-www-form-urlencoded`
- Parameters: `sign`, `class_id` (`blog`), `title`, `content`, `author_id`, `image_url`
- Success response: `{ "code": 1, "msg": "发布成功" }`
- Failure response: `{ "code": 0, "msg": "..." }`
- Custom-framework verification: `POST /` forwards internally to the same signed endpoint. Sign-and-class-only or short placeholder payloads return `{ "code": 1, "msg": "验证成功" }` without creating a record.

## Production Verification

- Initial Blog deployment: `dpl_3LaaukvbrWmqDUWVGaB3b5BbPcYK`.
- Custom-framework compatibility deployment: `dpl_5STiTNH4sJoLQq96zvR7WTyq3RFR`.
- Production `GET /api/webhook/send_article`: HTTP 405 with the expected form-post instruction, confirming the route is deployed.
- Production signed request with an invalid key: HTTP 401 and `{ "code": 0, "msg": "Invalid API key." }`.
- Production signed request with the configured key: HTTP 200 and `{ "code": 1, "msg": "发布成功" }`.
- Production root verification with only `sign` and `class_id`: HTTP 200 and `{ "code": 1, "msg": "验证成功" }`.
- Production root request with a short title/body placeholder: HTTP 200 and `{ "code": 1, "msg": "验证成功" }`; the database count remained `1 -> 1`.
- Production root request with the complete article: HTTP 200 and `{ "code": 1, "msg": "发布成功" }`; the database retained one `published` Blog record with class `blog`, its HTTPS cover URL, and its canonical slug.
- Production `/es/blog`: HTTP 307 to the canonical `/blog`; home-page `GET /` remained HTTP 200.
- Production `/api/admin/blog`: HTTP 401 without an admin session, confirming the real database-backed management endpoint is protected.
- Production `/blog`, published Blog detail URL, and `/sitemaps/posts-1.xml`: all returned HTTP 200. The Blog index included the published title; the detail page contained JSON-LD; the post sitemap included the canonical Blog URL.
- Production `scripts/final-audit-smoke.mjs` and `scripts/news-and-site-selfcheck.mjs`: passed across the public pages, News APIs, sitemap endpoints, robots, and admin authentication checks.
