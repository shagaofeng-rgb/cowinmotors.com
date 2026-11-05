import type { Metadata } from "next";
import { EditorialArticle } from "@/components/Editorial";
import { notFound } from "next/navigation";
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
  return (
    <EditorialArticle section="blog" article={article} related={related}>
      {blogArticleParagraphs(article.content).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogArticleJsonLd(article)) }} />
    </EditorialArticle>
  );
}
