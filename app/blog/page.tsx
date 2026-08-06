import type { Metadata } from "next";
import Link from "next/link";
import { BlogCard } from "@/components/BlogCard";
import { Header } from "@/components/Header";
import { getPublishedBlogPosts } from "@/lib/blog";
import { UI_ASSETS } from "@/lib/ui-assets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Automotive Parts Blog and Buyer Guides",
  description: "Cowinmotors buyer guides for automotive parts sourcing, fitment preparation, global shipping, and aftermarket purchasing decisions.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "Automotive Parts Blog and Buyer Guides | Cowinmotors", description: "Practical automotive parts sourcing and fitment guidance for global B2B buyers.", url: "https://www.cowinmotors.com/blog", images: [UI_ASSETS.newsLighting] },
};

export default async function BlogPage() {
  const articles = await getPublishedBlogPosts({ limit: 24 });
  const featured = articles[0];
  const latest = articles.slice(1);
  return (
    <>
      <Header cta="Request Quote" />
      <main className="category-design news-design">
        <section className="news-visual-hero">
          <div>
            <p className="category-kicker">Buyer Guides</p>
            <h1>Automotive parts sourcing insight <span>for global buyers.</span></h1>
            <p>Read practical guides on fitment details, parts selection, export preparation, and communicating requirements clearly before ordering.</p>
            <div className="category-quick-stats"><span>Fitment Guidance</span><span>Buyer-Focused</span><span>Global Sourcing</span></div>
          </div>
          {featured ? (
            <article className="news-featured-card">
              <img src={featured.coverImageUrl} alt={featured.coverImageAlt || featured.title} />
              <div><span>Latest Guide</span><h2>{featured.title}</h2><p>{featured.excerpt}</p><Link href={`/blog/${featured.slug}`}>Read guide</Link></div>
            </article>
          ) : (
            <article className="news-featured-card empty">
              <img src={UI_ASSETS.newsLighting} alt="Cowinmotors automotive parts sourcing guide" />
              <div><span>Buyer Guidance</span><h2>Automotive sourcing guides are being prepared.</h2><p>For immediate support, send your vehicle details and part requirements to our sourcing team.</p><Link href="/quote">Request a quote</Link></div>
            </article>
          )}
        </section>
        <section className="news-layout">
          <div>
            <div className="category-section-head"><div><p className="category-kicker">Latest Guides</p><h2>Clearer decisions before you order.</h2></div></div>
            {latest.length ? <div className="news-grid">{latest.map((article) => <BlogCard article={article} key={article.id} />)}</div> : featured ? null : (
              <div className="news-empty dark"><h2>No published guides yet.</h2><p>Use our product catalog or request a sourcing recommendation for your exact vehicle and part requirements.</p><Link href="/products">Explore products</Link></div>
            )}
          </div>
          <aside className="news-sidebar">
            <section><h3>Explore Products</h3><Link href="/headlights">Headlights</Link><Link href="/tail-lights">Tail Lights</Link><Link href="/exhaust">Exhaust Systems</Link><Link href="/wheels">Forged Wheels</Link></section>
            <section className="news-cta-box"><h3>Need help sourcing the right parts?</h3><p>Share your part number, vehicle fitment, quantity, and destination for a direct quotation.</p><Link href="/quote">Request sourcing support</Link></section>
          </aside>
        </section>
      </main>
    </>
  );
}
