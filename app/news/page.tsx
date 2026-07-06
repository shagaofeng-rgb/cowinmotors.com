import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { NewsCard } from "@/components/NewsCard";
import { getPublishedNews } from "@/lib/news";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Automotive Parts News and Sourcing Insights",
  description:
    "Source-backed automotive news, aftermarket parts sourcing analysis, fitment notes, and related Cowinmotors product links for global buyers.",
  alternates: { canonical: "/news" },
  openGraph: {
    title: "Automotive Parts News and Sourcing Insights | Cowinmotors",
    description:
      "Read source-backed automotive industry updates with Cowinmotors sourcing analysis and related product links.",
    url: "https://www.cowinmotors.com/news",
    images: ["/assets/live/category-lighting.png"],
  },
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "";
  const page = Math.max(1, Number(params.page || 1) || 1);
  const articles = await getPublishedNews({ limit: 12, page, category });
  const categories = [...new Set(articles.map((article) => article.category).filter(Boolean))];
  const featured = articles[0];
  const latest = articles.slice(1);
  const filterItems = categories.length ? categories : ["Automotive Lighting", "Tail Lights", "Exhaust Systems", "Wheels", "Body Kits"];

  return (
    <>
      <Header cta="Request Quote" />
      <main className="category-design news-design">
        <section className="news-visual-hero">
          <div>
            <p className="category-kicker">News & Insights</p>
            <h1>
              Aftermarket parts news, sourcing insights, fitment tips, and market updates <span>for global buyers.</span>
            </h1>
            <p>
              Stay informed with trusted industry updates, data-backed insights, fitment guidance, and sourcing intelligence
              to buy with confidence and sell smarter.
            </p>
            <div className="category-quick-stats">
              <span>Global Perspective</span>
              <span>Source-Backed</span>
              <span>Buyer-Focused</span>
            </div>
          </div>
          {featured ? (
            <article className="news-featured-card">
              <img src={featured.coverImageUrl} alt={featured.coverImageAlt || featured.title} />
              <div>
                <span>Featured Story</span>
                <h2>{featured.title}</h2>
                <p>{featured.excerpt}</p>
                <Link href={`/news/${featured.slug}`}>Read full article</Link>
              </div>
            </article>
          ) : (
            <article className="news-featured-card empty">
              <img src="/assets/live/category-lighting.png" alt="Automotive lighting news placeholder" />
              <div>
                <span>News Automation Ready</span>
                <h2>Published source-backed articles will appear here.</h2>
                <p>The news system is prepared for product-linked updates once articles are published.</p>
                <Link href="/products">Explore products</Link>
              </div>
            </article>
          )}
        </section>

        <section className="news-filter-band">
          <Link className={!category ? "is-active" : ""} href="/news">All</Link>
          {filterItems.map((item) => (
            <Link className={category === item ? "is-active" : ""} href={`/news?category=${encodeURIComponent(item)}`} key={item}>
              {item}
            </Link>
          ))}
        </section>

        <section className="news-layout">
          <div>
            <div className="category-section-head">
              <div>
                <p className="category-kicker">Latest Articles</p>
                <h2>News linked to real products.</h2>
              </div>
            </div>
            {latest.length ? (
              <div className="news-grid">
                {latest.map((article) => <NewsCard article={article} key={article.id} />)}
              </div>
            ) : (
              <div className="news-empty dark">
                <h2>News automation is ready.</h2>
                <p>Published source-backed articles will appear here after the automated collection and publication job runs.</p>
              </div>
            )}
          </div>
          <aside className="news-sidebar">
            <section>
              <h3>Popular Topics</h3>
              {["LED Lighting Technology", "Global Shipping Updates", "Wheel Fitment Guides", "Exhaust Systems Insights", "Market Trends & Data"].map((item) => (
                <Link href={`/news?category=${encodeURIComponent(item)}`} key={item}>{item}</Link>
              ))}
            </section>
            <section className="news-cta-box">
              <h3>Need help sourcing the right parts?</h3>
              <p>Our team helps global buyers find quality parts, confirm fitment, and get the best shipping solutions.</p>
              <Link href="/quote">Request sourcing support</Link>
            </section>
          </aside>
        </section>

        <section className="news-bottom-cta">
          <Link href="/products">Explore our products</Link>
          <Link href="/support">Go to resource center</Link>
          <Link href="/quote">Talk to our experts</Link>
        </section>
      </main>
    </>
  );
}
