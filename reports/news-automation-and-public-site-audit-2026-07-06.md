# Cowinmotors News Automation And Public Site Audit

Date: 2026-07-06
Site: https://www.cowinmotors.com

## News Automation

- Vercel Cron for `/api/cron/news-automation` is configured for daily production execution.
- The cron route remains protected by `CRON_SECRET`.
- Production environment variables include `CRON_SECRET` and `DATABASE_URL`.
- RSS-based source publishing remains enabled for aftermarket parts news.
- A Cowinmotors daily sourcing brief fallback was added so the job can still publish qualified, product-linked content when external RSS sources do not provide enough relevant items.
- Internal fallback topics cover Headlights, Tail Lights, Exhaust Systems, Wheels, and Body Kits.
- Article insertion now confirms that the article row was created before product relations are written, preventing failed relation writes on duplicate slugs.

## Execution Result

- Local production route test called `/api/cron/news-automation` with a temporary local authorization secret.
- Database-backed result for 2026-07-06:
  - Daily target: 4
  - Existing today before run: 0
  - Published by run: 4
  - Missing: 0
  - Audit status: complete
- `/news`, `/news/rss.xml`, and `/news-sitemap.xml` showed published News output after the run.

## Public Site Cleanup

- Removed public-facing News empty-state copy that mentioned automation readiness.
- Removed Body Kits copy that made the page look unfinished.
- Body Kits now presents the page as a quote-first sourcing category.

## Local Verification

- TypeScript check passed.
- `git diff --check` passed.
- Next.js production build passed.
- Local smoke test passed for:
  - `/`
  - `/products`
  - `/headlights`
  - `/tail-lights`
  - `/exhaust`
  - `/wheels`
  - `/body-kits`
  - `/quote`
  - `/support`
  - `/news`
  - `/sitemap.xml`
  - `/news-sitemap.xml`
  - `/news/rss.xml`
  - `/robots.txt`
  - `/admin/login`
- Public page scan found no unfinished launch copy on core public pages.

## Rollback

- Revert the deployment or revert the commit that changes `lib/news.ts`, `vercel.json`, `app/news/page.tsx`, and `app/body-kits/page.tsx`.
