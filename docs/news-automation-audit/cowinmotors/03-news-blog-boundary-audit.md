# News / Blog Boundary Audit: cowinmotors

| Layer | News | Blog | Result |
| --- | --- | --- | --- |
| URL | `/news`, `/news/[slug]` | `/blog`, `/blog/[slug]` | Separate |
| Storage | `news_articles` plus isolated automation tables | `blog_articles` | Separate |
| Public query | `getPublishedNews`, site-filtered and indexable-only | `getPublishedBlogPosts` | Separate |
| APIs | `/api/news/*`, `/api/admin/news` | `/api/webhook/send_article`, `/api/admin/blog` | Separate |
| Sitemap/RSS | `/news-sitemap.xml`, `/news/rss.xml` | Blog entries in core sitemap | Separate |
| Automation | ingest/publish task tables and cron endpoints | signed third-party Blog webhook only | No candidate sharing |
| Media | owned neutral image for automated News unless rights are recorded | Blog cover media | Separate rules |

The automation module does not import `lib/blog.ts`, query `blog_articles`, publish to Blog routes, or include Blog links. The Blog Webhook does not import or query News candidates. Existing manual News editing is retained.
