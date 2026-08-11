# Current Architecture: cowinmotors

- **Repository/runtime:** Next.js 15 application, pnpm, Vercel configuration, Neon Postgres via `DATABASE_URL`.
- **Public routes:** `/news`, `/news/[slug]`, `/news/rss.xml`, `/news-sitemap.xml`; Blog uses `/blog` and `/blog/[slug]` with separate `blog_articles` storage.
- **News storage:** existing `news_articles`, `news_products`, `news_sources`, `news_jobs`, and `news_publication_audits`. The unification change adds site-isolated candidate, run, delivery-check, audit-event, theme-window and lock tables through `lib/news-automation.ts`.
- **Existing history:** 132 published external News records, all currently `noindex`. No historical Blog rows are changed by this work.
- **Existing News editor:** authenticated `/api/admin/news` supports manual create, update and deletion. It is retained.
- **Existing scheduler before this change:** only the monthly inquiry-email check is configured in `vercel.json`; no live News ingestion or publishing task exists.
- **New configuration source:** `lib/news-site-config.ts`. All automation code loads a stable `site_id`; no worker reads a domain, source, product plan or brand name from inline task code.

## Boundary finding

News and Blog were already separate at the database and route level. The prior News UI still displayed noindex legacy articles, which conflicts with the new governance requirement. Public News queries now require `indexable = TRUE`; historical records remain in the database/admin for review.
