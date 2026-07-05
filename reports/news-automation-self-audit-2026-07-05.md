# Cowinmotors News Automation And Site Self-Audit

Date: 2026-07-05
Site: https://www.cowinmotors.com

## Executed Scope

- Read and implemented the News Automation System requirements.
- Read and executed the Website Self-Check requirements for the current public site.
- Added automated News pages, News detail pages, RSS, News sitemap, admin News view, cron endpoint, database tables, publication audit records, and product-related News links.
- Kept the website English-facing and avoided internal instructions in public copy.

## News Automation Result

- Production database was initialized with News tables, source records, job records, article records, product relation records, and daily publication audit records.
- The first broad-source run produced 4 general automotive stories that were not suitable for an export auto-parts website.
- Those 4 stories were removed from `news_articles`.
- The source list was tightened to aftermarket and parts-industry sources:
  - https://www.aftermarketnews.com/feed/
  - https://www.aftermarketmatters.com/feed/
- Automatic publication now blocks broad entertainment or culture topics and requires aftermarket, parts, repair, lighting, exhaust, body-kit, fitment, inventory, supplier, or wholesale intent.
- Final execution published 1 qualified article:
  - I-CAR publishes Industry Best Practice for Equipment Readiness - aftermarket parts sourcing note
- Daily target: 4
- Published on 2026-07-05: 1
- Missing: 3
- Audit status: incomplete, because only 1 article met the freshness and relevance rules. The system did not publish weak filler content.

## Public News Outputs

- `/news` added.
- `/news/[slug]` added.
- `/news/rss.xml` added.
- `/news-sitemap.xml` added.
- `/sitemap.xml` includes News URLs.
- `/robots.txt` references both standard and News sitemaps.
- Product detail pages can show related News when available.

## Admin Outputs

- `/admin/news` added under the protected admin area.
- Admin News dashboard shows article status, source freshness, jobs, and daily publication audit data.

## Security And Operations

- `/api/cron/news-automation` is protected by `CRON_SECRET`.
- Unauthorized public requests return 401.
- Vercel cron schedule is configured to run every 6 hours.
- News generation avoids copying full source articles and links back to the original source.
- External cover image rules are enforced; local product images are not used as fake News covers.

## Site Smoke Audit

Production smoke test passed for:

- `/`
- `/products`
- `/headlights`
- `/tail-lights`
- `/exhaust`
- `/body-kits`
- `/quote`
- `/support`
- `/news`
- `/sitemap.xml`
- `/news-sitemap.xml`
- `/news/rss.xml`
- `/robots.txt`
- `/admin/login`

Additional checks passed:

- Quote and missing-model forms require a phone number.
- Inquiry API rejects missing phone number.
- Admin API remains protected.
- Robots includes the News sitemap.

## Known Follow-Up

- The Blog module is not currently implemented on this site, so the Blog automation checks from the self-audit document are recorded as not applicable instead of being fabricated.
- More trusted aftermarket RSS sources can be added later if the site needs to consistently reach 4 qualified News posts per day while keeping the 72-hour freshness rule.
