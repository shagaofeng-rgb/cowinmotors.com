# Cowinmotors full-site audit - 2026-10-25

Scope: public frontend, mobile layout, navigation, SEO metadata, content-to-database checks, inquiry delivery, analytics attribution, and deployment readiness. Rollback tag before edits: `backup/pre-fullsite-audit-20261024` (`d69917e`). No production data or schema was changed during this audit.

## Verified

- Production smoke: `node scripts/final-audit-smoke.mjs` returned HTTP 200 for 22 public routes, including category pages, News, Blog, sitemap, robots, and admin login. An unauthenticated request to `/api/admin/analytics/overview` returned 401.
- Browser audit: Chromium at 1440px and 390px returned HTTP 200 on 12 primary routes per viewport. No horizontal overflow, broken loaded images, missing image alt attributes, or page JavaScript exceptions were found in these samples. Canonical URLs were present; `/quote` returned `noindex, follow`.
- Production database: three published Blog records and three published News records were compared with their public detail URLs. All six returned HTTP 200 and contained the matching database title. Product catalog remains sourced from `public/data/site-data.json`; it is not a live editable product table.
- Inquiry records: four existed at inspection, three marked test and one real. The 2026-10-01 monthly test had `delivery_status=failed` with an SMTP 501 error: the envelope sender did not match the authenticated mailbox. The older real inquiry had `delivery_status=pending`; historical delivery cannot be inferred from that status.
- Build and tests: Next.js production build succeeded, TypeScript check passed, 23 Node tests passed, catalog self-check passed. Local rebuilt site passed browser checks on six representative routes at both widths.
- Navigation interaction on the rebuilt site: category drawer opens by click, remains open while its panel is hovered, closes after the pointer leaves, and category selection navigates to `/headlights` at both 1440px and 390px.
- Production deployment `dpl_CerZ8rA4GUaXMSbS5bvEyyFEuSEr` reached `READY` and was aliased to `https://www.cowinmotors.com`. Post-deployment smoke again passed all 22 routes. Production Chromium interaction also passed the category drawer test at 1440px and 390px.
- Vercel CLI reported the two active schedules exactly as listed below. A manual run of the existing inquiry email cron at `2026-10-25T06:47:39Z` created test inquiry `95f9ab3a-8c67-4dfb-9396-afb063af028a`; its database status changed from `pending` to `sent`, provider `smtp`, without a delivery error. This proves SMTP server acceptance, not inbox placement.
- A public `/api/inquiry` POST created marked test inquiry `d5e02893-5e80-4000-b469-c44639a9141b`. API returned `ok=true`, `analyticsStored=true`, `testExcluded=true`, and `deliveryStatus=skipped`. Database readback matched its visitor/session/landing/referrer fields; its `form_submit` analytics event was classified `excluded` and attributed to Google. No customer notification was sent for this test.

## Fixed in code

- SMTP now uses the authenticated mailbox as its envelope sender, sends notifications to `info@cowinmotors.com`, applies a connection timeout, destroys sockets after use, and prevents credentials or message bodies appearing in SMTP error logs. A mock SMTP server test enforces the provider's sender rule, and the production SMTP server accepted the post-deployment cron message. Inbox placement is not independently verified.
- Visitor campaign and referrer attribution persists within a session across internal navigation and is shared with both inquiry forms. Tests cover persistence and a fresh session.
- SPA route changes now emit a one-time engagement event for the previous page. Average visit duration uses engagement data rather than the zero-duration page-view records.
- Inquiry and visitor detail reads filter analytics in SQL by visitor and time range. Analytics reads use larger batches to reduce round trips. No database migration was needed; the existing visitor/timestamp index supports the filtered query.
- Category drawer click no longer closes a panel already opened by hover. Generic lighting records no longer default to the Headlights category when the product type is not a headlight; existing products remain in the catalog.

## Running tasks and data paths

| Item | Trigger | Output | Audit result |
| --- | --- | --- | --- |
| Public Next.js app | HTTP | Pages and APIs | Sampled routes and production build passed. |
| Analytics collection | Browser event to API | `cowin_analytics_events` | Real/test classification exists; campaign persistence corrected. Production admin private views not directly inspected. |
| Inquiry submission | User form to API | `cowin_inquiries` and email | Validation checked, SMTP root cause fixed in code; post-deploy external delivery unverified. |
| Blog signed webhook | Third-party POST | `blog_articles` | Existing published records match frontend; external plugin account/credentials not available for a new end-to-end publish test. |
| Monthly inquiry mail check | Vercel Cron `0 1 1 * *` UTC | Test inquiry and delivery status | Last recorded run failed due SMTP 501; code fix needs a real production run. |
| Sitemap maintenance / Google submission | Vercel Cron `10 2 * * 1` UTC | Sitemap audit and conditional submission | Schedule exists; authenticated production invocation and Google receipt were not available in this audit. |
| News automation | No scheduled caller found in `vercel.json` or GitHub workflows | None | Dormant implementation remains in `lib/news-automation.ts`; no active route/script references to its run functions were found. |

## SEO and content risks

- Public `robots.txt`, sitemap index, and canonical pages were accessible. The News-specific sitemap was empty at inspection; this can be expected if it only covers recently published News, but its generation rule needs confirmation in Search Console before treating it as an indexing defect.
- The forged-wheel catalog self-check reported 417 public forged-wheel records but zero sitemap-eligible wheel records. This is a content/indexability policy issue, not a failed route. Product specifications and index eligibility should be reviewed before expanding the sitemap.
- At least one existing News title concerns a personnel appointment rather than a direct buyer decision. Editorial quality and indexability of historical News need human review; no content was deleted in this task.
- Browser checks covered Chromium at two widths, not every browser/device. LCP, INP, CLS field data and Google indexation decisions cannot be inferred from local navigation tests.

## Access limits and rollback

- Production admin credentials and Secret-class environment values were not available to this terminal. The private admin UI, Google OAuth data, and receiving mailbox placement were not marked verified. Production database was otherwise queried read-only; the two explicitly marked test inquiries above are the only data created by this audit, remain excluded from business metrics, and were not deleted.
- Rollback code to `backup/pre-fullsite-audit-20261024` and redeploy that revision if a regression is found. No schema rollback is required. Preserve the existing inquiry/analytics rows when rolling back.
- With an authorized admin session, inspect the test inquiry detail and visitor journey, confirm that the cron message appeared in `info@cowinmotors.com`, and compare Search Console figures with the site's sitemap eligibility policy. A real customer submission was not generated for this audit.
