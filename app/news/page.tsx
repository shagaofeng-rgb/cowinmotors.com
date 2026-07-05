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

  return (
    <>
      <Header cta="Request quote" />
      <main>
        <section className="page-hero news-hero">
          <p className="eyebrow">Automotive News</p>
          <h1>Source-backed news for aftermarket parts buyers.</h1>
          <p>
            Follow global automotive updates with Cowinmotors analysis for headlights, tail lights, exhaust systems,
            exterior parts, fitment checks, and export sourcing decisions.
          </p>
        </section>

        <section className="section news-list-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Latest Updates</p>
              <h2>News linked to real products.</h2>
              <p>Every published article includes source attribution, buyer-oriented analysis, and related product links.</p>
            </div>
            <div className="news-filter-row">
              <Link className={!category ? "is-active" : ""} href="/news">All</Link>
              {categories.map((item) => (
                <Link className={category === item ? "is-active" : ""} href={`/news?category=${encodeURIComponent(item)}`} key={item}>
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {articles.length ? (
            <div className="news-grid">
              {articles.map((article) => <NewsCard article={article} key={article.id} />)}
            </div>
          ) : (
            <div className="news-empty">
              <h2>News automation is ready.</h2>
              <p>Published source-backed articles will appear here after the automated collection and publication job runs.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
