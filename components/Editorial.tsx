import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Newspaper } from "lucide-react";
import type { ReactNode } from "react";
import { InnerBreadcrumb, InnerPage } from "@/components/InnerPage";
import { ResilientImage } from "@/components/ResilientImage";
import { UI_ASSETS } from "@/lib/ui-assets";
import "@/app/editorial.css";

type Section = "news" | "blog";
type Entry = {
  id: string; slug: string; title: string; excerpt: string; publishedAt: string; authorName: string;
  coverImageUrl: string; coverImageAlt: string; category?: string; updatedAt?: string;
};

const sections = {
  news: { title: "News & insights", description: "Automotive industry updates, sourcing analysis and fitment notes for parts buyers." },
  blog: { title: "Buyer guides", description: "Practical guides on selecting parts, checking fitment and preparing an export inquiry." },
};

export function EditorialDate({ value, prefix = "" }: { value?: string; prefix?: string }) {
  const date = new Date(value || "");
  if (!value || !Number.isFinite(date.getTime())) return null;
  return <time dateTime={value}>{prefix}{new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date)}</time>;
}

function EditorialCard({ article, section, featured = false }: { article: Entry; section: Section; featured?: boolean }) {
  const href = `/${section}/${article.slug}`;
  const Heading = featured ? "h2" : "h3";
  return (
    <article className={`cm-story${featured ? " cm-story-feature" : ""}`}>
      <Link className="cm-story-media" href={href} prefetch={false} aria-label={`Read ${article.title}`}>
        <ResilientImage key={article.coverImageUrl} src={article.coverImageUrl} alt={article.coverImageAlt || article.title} fallback={UI_ASSETS.newsLighting} loading={featured ? "eager" : "lazy"} />
      </Link>
      <div className="cm-story-copy">
        <div className="cm-story-meta">{article.category && <span>{article.category}</span>}<EditorialDate value={article.publishedAt} /></div>
        <Heading><Link href={href} prefetch={false}>{article.title}</Link></Heading>
        <p>{article.excerpt}</p>
        <Link className="cm-text-link" href={href} prefetch={false}>{section === "news" ? "Read article" : "Read guide"} <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
    </article>
  );
}

export function EditorialListing({ section, articles, topics = [], activeTopic = "", page = 1, hasNext }: {
  section: Section; articles: Entry[]; topics?: string[]; activeTopic?: string; page?: number; hasNext: boolean;
}) {
  const view = sections[section];
  const featured = page === 1 ? articles[0] : undefined;
  const latest = featured ? articles.slice(1) : articles;
  const basePath = `/${section}`;
  const pageHref = (value: number, topic = activeTopic) => {
    const params = new URLSearchParams();
    if (topic) params.set("category", topic);
    if (value > 1) params.set("page", String(value));
    return `${basePath}${params.size ? `?${params}` : ""}`;
  };

  return (
    <InnerPage className="cm-editorial">
      <div className="cm-editorial-intro">
        <div className="cm-wrap">
          <InnerBreadcrumb items={[{ label: view.title }]} />
          <div className="cm-section-head">
            <div><h1>{view.title}</h1><p>{view.description}</p></div>
            <Link className="cm-text-link" href={section === "news" ? "/blog" : "/news"}>{sections[section === "news" ? "blog" : "news"].title} <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
      <div className="cm-wrap cm-editorial-list">
        {(topics.length > 0 || activeTopic) && <nav className="cm-editorial-topics" aria-label="News topics">
          <Link href={basePath} aria-current={activeTopic ? undefined : "page"}>All topics</Link>
          {[...new Set([...topics, ...(activeTopic ? [activeTopic] : [])])].map((topic) => <Link key={topic} aria-current={activeTopic === topic ? "page" : undefined} href={pageHref(1, topic)} prefetch={false}>{topic}</Link>)}
        </nav>}
        {featured && <EditorialCard article={featured} section={section} featured />}
        {latest.length > 0 && <section className="cm-latest-stories"><h2>{page === 1 ? (section === "news" ? "Latest articles" : "More guides") : `${view.title}, page ${page}`}</h2><div className="cm-story-grid">{latest.map((article) => <EditorialCard key={article.id} article={article} section={section} />)}</div></section>}
        {!articles.length && (
          <div className="cm-editorial-empty">
            <Newspaper size={32} aria-hidden="true" />
            <h2>{activeTopic || page > 1 ? "No articles here" : section === "news" ? "No published news yet" : "No published guides yet"}</h2>
            <p>{activeTopic || page > 1 ? "Browse all topics or return to the first page." : "The fitment checklist and support guides are available while we prepare new articles."}</p>
            <Link className="cm-text-link" href={activeTopic || page > 1 ? basePath : "/support"}>{activeTopic || page > 1 ? "Browse all articles" : "Buyer support"} <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        )}
        {(page > 1 || hasNext) && <nav className="cm-editorial-paging" aria-label="Article pagination">
          {page > 1 && <Link className="cm-btn cm-btn-outline" href={pageHref(page - 1)} rel="prev"><ArrowLeft size={17} aria-hidden="true" /> Previous</Link>}
          {hasNext && <Link className="cm-btn cm-btn-outline" href={pageHref(page + 1)} rel="next">Next <ArrowRight size={17} aria-hidden="true" /></Link>}
        </nav>}
      </div>
    </InnerPage>
  );
}

export function EditorialArticle({ section, article, related, children, creditUrl }: { section: Section; article: Entry; related: Entry[]; children: ReactNode; creditUrl?: string }) {
  const view = sections[section];
  return (
    <InnerPage className="cm-editorial cm-editorial-article">
      <div className="cm-wrap">
        <InnerBreadcrumb items={[{ label: view.title, href: `/${section}` }, { label: article.category || "Article" }]} />
        <article>
          <header className="cm-article-header">
            <h1>{article.title}</h1>
            <p>{article.excerpt}</p>
            <div className="cm-story-meta"><span>By {article.authorName}</span><EditorialDate value={article.publishedAt} prefix="Published " />{article.updatedAt?.slice(0, 10) !== article.publishedAt.slice(0, 10) && <EditorialDate value={article.updatedAt} prefix="Updated " />}</div>
          </header>
          <figure className="cm-article-cover"><ResilientImage key={article.coverImageUrl} src={article.coverImageUrl} alt={article.coverImageAlt || article.title} fallback={UI_ASSETS.newsLighting} loading="eager" creditUrl={creditUrl} /></figure>
          <div className="cm-article-body">{children}</div>
        </article>
        {related.length > 0 && <section className="cm-more-stories"><div className="cm-section-head"><h2>{section === "news" ? "More news" : "More buyer guides"}</h2><Link className="cm-text-link" href={`/${section}`}>Browse all <ArrowRight size={17} aria-hidden="true" /></Link></div><div className="cm-story-grid">{related.map((item) => <EditorialCard section={section} article={item} key={item.id} />)}</div></section>}
      </div>
    </InnerPage>
  );
}
