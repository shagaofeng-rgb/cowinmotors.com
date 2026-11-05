import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { EditorialArticle, EditorialDate } from "@/components/Editorial";
import { ProductCard } from "@/components/ProductCard";
import { findProduct } from "@/lib/products";
import { notFound } from "next/navigation";
import { breadcrumbJsonLd, getNewsArticle, getPublishedNews, newsJsonLd } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsArticle(slug);
  if (!article) return {};
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      url: article.canonicalUrl,
      images: [{ url: article.coverImageUrl, width: article.coverImageWidth || 1400, height: article.coverImageHeight || 900, alt: article.coverImageAlt }],
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.coverImageUrl],
    },
    robots: article.indexable ? undefined : { index: false, follow: true },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getNewsArticle(slug);
  if (!article) notFound();
  const related = (await getPublishedNews({ limit: 4 })).filter((item) => item.slug !== article.slug).slice(0, 3);
  const paragraphs = article.content.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const relation = article.products[0];
  const relatedPart = relation && findProduct(relation.productId);

  return (
    <EditorialArticle section="news" article={article} related={related} creditUrl={article.coverImagePageUrl}>
      {article.keyTakeaways.length > 0 && <aside className="cm-takeaways"><h2>Key takeaways</h2><ul>{article.keyTakeaways.map((item, index) => <li key={index}>{item}</li>)}</ul></aside>}
      {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      <section className="cm-article-source">
        <h2>Sources &amp; editorial notes</h2>
        {article.canonicalSourceUrl ? (
          <>
            <dl>
              <div><dt>Original title</dt><dd>{article.sourceTitle}</dd></div>
              <div><dt>Publisher</dt><dd>{article.sourcePublisher}</dd></div>
              {article.sourceAuthor && <div><dt>Author</dt><dd>{article.sourceAuthor}</dd></div>}
              {article.sourcePublishedAt && <div><dt>Published</dt><dd><EditorialDate value={article.sourcePublishedAt} /></dd></div>}
            </dl>
            <a className="cm-text-link" href={article.canonicalSourceUrl} target="_blank" rel="noreferrer">Read original source <ArrowUpRight size={17} aria-hidden="true" /></a>
            <p>This page is an independent editorial summary and analysis. Original reporting remains the property of the original publisher.</p>
          </>
        ) : <p>This is Cowinmotors original editorial content. It was manually reviewed before publication.</p>}
        {article.editorialNote && <p>{article.editorialNote}</p>}
      </section>
      {relatedPart && <section className="cm-article-product"><h2>Related catalog part</h2>{relation.relationshipReason && <p>{relation.relationshipReason}</p>}<ProductCard product={relatedPart} /></section>}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsJsonLd(article)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(article)) }} />
    </EditorialArticle>
  );
}
