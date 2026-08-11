import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { NewsCard } from "@/components/NewsCard";
import { ResilientImage } from "@/components/ResilientImage";
import { getNewsCategories, getPublishedNews } from "@/lib/news";
import { UI_ASSETS } from "@/lib/ui-assets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Automotive Parts News and Buyer Insights",
  description:
    "Editorially reviewed automotive parts news, sourcing analysis, and fitment notes for global buyers.",
  alternates: { canonical: "/news" },
  openGraph: {
    title: "Automotive Parts News and Buyer Insights | Cowinmotors",
    description:
      "Read editorially reviewed automotive industry updates and sourcing analysis from Cowinmotors.",
    url: "https://www.cowinmotors.com/news",
    images: [UI_ASSETS.newsLighting],
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
  const categories = await getNewsCategories();
  const featured = articles[0];
  const latest = articles.slice(1);
  const filterItems = categories.length ? categories.map((item) => item.category) : ["Automotive Lighting", "Tail Lights", "Exhaust Systems", "Wheels", "Body Kits"];

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
              Read editorially reviewed updates, fitment guidance, and sourcing analysis prepared for international automotive parts buyers.
            </p>
            <div className="category-quick-stats">
              <span>Global Perspective</span>
              <span>Editorially Reviewed</span>
              <span>Buyer-Focused</span>
            </div>
          </div>
          {featured ? (
            <article className="news-featured-card">
              <ResilientImage
                src={featured.coverImageUrl}
                alt={featured.coverImageAlt || featured.title}
                fallback={UI_ASSETS.newsLighting}
                loading="eager"
              />
              <div>
                <span>Editorial Feature</span>
                <h2>{featured.title}</h2>
                <p>{featured.excerpt}</p>
                <Link href={`/news/${featured.slug}`}>Read full article</Link>
              </div>
            </article>
          ) : (
            <article className="news-featured-card empty">
              <ResilientImage
                src={UI_ASSETS.newsLighting}
                alt="Automotive lighting sourcing insight"
                fallback={UI_ASSETS.newsLighting}
                loading="eager"
              />
              <div>
                <span>Sourcing Insight</span>
                <h2>Automotive parts buying guidance for global buyers.</h2>
                <p>Verified industry updates will appear here after source, relevance, and editorial checks are complete.</p>
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
                <h2>News and insights for fitment-led buying.</h2>
              </div>
            </div>
            {latest.length ? (
              <div className="news-grid">
                {latest.map((article) => <NewsCard article={article} key={article.id} />)}
              </div>
            ) : (
              <div className="news-empty dark">
                <h2>Choose another topic or request sourcing support.</h2>
                <p>Use the category filters above, browse our product catalog, or send your vehicle and part requirements for a direct recommendation.</p>
                <Link href="/quote">Request sourcing support</Link>
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
          </aside>
        </section>
      </main>
    </>
  );
}
