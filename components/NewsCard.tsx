import Link from "next/link";
import type { NewsArticle } from "@/lib/news";

export function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <article className="news-card">
      <Link className="news-card-media" href={`/news/${article.slug}`}>
        <img src={article.coverImageUrl} alt={article.coverImageAlt || article.title} loading="lazy" />
      </Link>
      <div className="news-card-copy">
        <div className="news-meta">
          <span>{article.category}</span>
          <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString("en-US")}</time>
        </div>
        <h3><Link href={`/news/${article.slug}`}>{article.title}</Link></h3>
        <p>{article.excerpt}</p>
        <div className="news-source-line">
          <span>Source: {article.sourcePublisher}</span>
          {article.products[0] ? <Link href={article.products[0].url}>{article.products[0].category}</Link> : null}
        </div>
      </div>
    </article>
  );
}
