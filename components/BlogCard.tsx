import Link from "next/link";
import type { BlogArticle } from "@/lib/blog";
import { ResilientImage } from "@/components/ResilientImage";
import { UI_ASSETS } from "@/lib/ui-assets";

export function BlogCard({ article }: { article: BlogArticle }) {
  return (
    <article className="news-card">
      <Link className="news-card-media" href={`/blog/${article.slug}`}>
        <ResilientImage src={article.coverImageUrl} alt={article.coverImageAlt || article.title} fallback={UI_ASSETS.newsLighting} />
      </Link>
      <div className="news-card-copy">
        <div className="news-meta"><span>Blog</span><time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString("en-US")}</time></div>
        <h3><Link href={`/blog/${article.slug}`}>{article.title}</Link></h3>
        <p>{article.excerpt}</p>
        <div className="news-source-line"><span>By {article.authorName}</span></div>
      </div>
    </article>
  );
}
