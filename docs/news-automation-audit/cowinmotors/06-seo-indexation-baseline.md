# SEO and Indexation Baseline: cowinmotors

- `/news-sitemap.xml` currently reads only published, indexable News and applies the Google News two-day window.
- `/news/rss.xml` exposes published News; after this change public News selection excludes historical `noindex` records.
- The core sitemap gathers News and Blog through separate getters. Blog records are not part of the News RSS/sitemap route.
- Current historical News inventory: 132 published records, all `noindex`; no historical content was deleted, redirected or re-dated.
- New automated News writes a self canonical URL, NewsArticle schema source fields, source date, source URL, owned neutral image metadata and editorial disclaimer. It is included in News sitemap/RSS only after frontend verification.

Before a production release, validate a new News detail page with an HTML parser/Rich Results test and confirm it appears in `/news`, `/news-sitemap.xml` and `/news/rss.xml`, while absent from `/blog` and Blog data/API results.
