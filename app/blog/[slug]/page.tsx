import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { BlogCard } from "@/components/BlogCard";
import { blogArticleJsonLd, blogArticleParagraphs, getPublishedBlogArticle, getPublishedBlogPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedBlogArticle(slug);
  if (!article) return {};
  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: { title: article.seoTitle, description: article.seoDescription, type: "article", url: article.canonicalUrl, images: [{ url: article.coverImageUrl, alt: article.coverImageAlt }], publishedTime: article.publishedAt, modifiedTime: article.updatedAt },
    twitter: { card: "summary_large_image", title: article.seoTitle, description: article.seoDescription, images: [article.coverImageUrl] },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedBlogArticle(slug);
  if (!article) notFound();
  const related = (await getPublishedBlogPosts({ limit: 4 })).filter((item) => item.slug !== article.slug).slice(0, 3);
  const paragraphs = blogArticleParagraphs(article.content);
  return (
    <>
      <Header cta="Request Quote" />
      <main className="section news-detail">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/blog">Blog</Link><span>/</span><span>{article.title}</span></nav>
        <article className="news-article">
          <header className="news-article-head"><p className="eyebrow">Cowinmotors Buyer Guide</p><h1>{article.title}</h1><p className="news-lede">{article.excerpt}</p><div className="news-meta"><span>By {article.authorName}</span><time dateTime={article.publishedAt}>Published {new Date(article.publishedAt).toLocaleDateString("en-US")}</time><time dateTime={article.updatedAt}>Updated {new Date(article.updatedAt).toLocaleDateString("en-US")}</time></div></header>
          <figure className="news-cover"><img src={article.coverImageUrl} alt={article.coverImageAlt || article.title} /></figure>
          <section className="news-body">{paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 32)}`}>{paragraph}</p>)}</section>
        </article>
        {related.length ? <section className="section related-news-section"><div className="section-title-row compact"><div><p className="eyebrow">More Guides</p><h2>Keep planning with confidence.</h2></div></div><div className="news-grid">{related.map((item) => <BlogCard article={item} key={item.id} />)}</div></section> : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogArticleJsonLd(article)) }} />
      </main>
    </>
  );
}
