import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { NewsCard } from "@/components/NewsCard";
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
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getNewsArticle(slug);
  if (!article) notFound();
  const related = (await getPublishedNews({ limit: 4 })).filter((item) => item.slug !== article.slug).slice(0, 3);

  return (
    <>
      <Header cta="Request quote" />
      <main className="section news-detail">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span><Link href="/news">News</Link><span>/</span><span>{article.category}</span>
        </nav>

        <article className="news-article">
          <header className="news-article-head">
            <p className="eyebrow">{article.category}</p>
            <h1>{article.title}</h1>
            <p className="news-lede">{article.excerpt}</p>
            <div className="news-meta">
              <span>By {article.authorName}</span>
              <time dateTime={article.publishedAt}>Published {new Date(article.publishedAt).toLocaleString("en-US")}</time>
              <time dateTime={article.updatedAt}>Updated {new Date(article.updatedAt).toLocaleString("en-US")}</time>
            </div>
          </header>

          <figure className="news-cover">
            <img src={article.coverImageUrl} alt={article.coverImageAlt} />
            <figcaption>Image source: <a href={article.coverImagePageUrl || article.coverImageSourceUrl} target="_blank" rel="noreferrer">external source</a></figcaption>
          </figure>

          <aside className="news-takeaways">
            <h2>Key Takeaways</h2>
            <ul>
              {article.keyTakeaways.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </aside>

          <section className="news-body" dangerouslySetInnerHTML={{ __html: article.content }} />

          <section className="news-source-box">
            <h2>Information Source</h2>
            <dl>
              <div><dt>Original title</dt><dd>{article.sourceTitle}</dd></div>
              <div><dt>Publisher</dt><dd>{article.sourcePublisher}</dd></div>
              <div><dt>Author</dt><dd>{article.sourceAuthor || "Not listed by source"}</dd></div>
              <div><dt>Original published time</dt><dd>{new Date(article.sourcePublishedAt).toLocaleString("en-US")}</dd></div>
              <div><dt>Fetched by Cowinmotors</dt><dd>{new Date(article.sourceFetchedAt).toLocaleString("en-US")}</dd></div>
              <div><dt>Source URL</dt><dd><a href={article.canonicalSourceUrl} target="_blank" rel="noreferrer">Read original source</a></dd></div>
            </dl>
            <p>This article is based on public source information and Cowinmotors independent analysis. Original reporting remains the property of the original publisher.</p>
          </section>

          {article.products.length ? (
            <section className="related-products">
              <div className="section-title-row compact">
                <div>
                  <p className="eyebrow">Related Products</p>
                  <h2>Product links for sourcing checks.</h2>
                </div>
              </div>
              <div className="related-product-grid">
                {article.products.map((product) => (
                  <Link className="related-product-card" href={product.url} key={product.productId}>
                    <img src={product.image} alt={product.title} />
                    <span>{product.category}</span>
                    <strong>{product.title}</strong>
                    <small>{product.relationshipReason}</small>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        {related.length ? (
          <section className="section related-news-section">
            <div className="section-title-row compact">
              <div>
                <p className="eyebrow">Related News</p>
                <h2>More sourcing signals.</h2>
              </div>
            </div>
            <div className="news-grid">
              {related.map((item) => <NewsCard article={item} key={item.id} />)}
            </div>
          </section>
        ) : null}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsJsonLd(article)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(article)) }} />
      </main>
    </>
  );
}
