import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import type { Product } from "@/lib/products";
import { productCardData } from "@/lib/products";

type CategoryShowcaseProps = {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  heroImage: string;
  heroAlt: string;
  basePath: string;
  products: Product[];
  pageType: "headlights" | "tail-lights" | "exhaust" | "wheels";
  initialBrand: string;
  initialSearch: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  categorySlug: string;
  finderTitle: string;
  ctaLabel: string;
  ctaHref: string;
  quickStats: string[];
  benefits: [string, string][];
  checklistTitle: string;
  checklist: [string, string][];
  tabs: string[];
  supportTitle: string;
  supportText: string;
};

export function CategoryShowcase({
  eyebrow,
  title,
  highlight,
  description,
  heroImage,
  heroAlt,
  basePath,
  products,
  pageType,
  initialBrand,
  initialSearch,
  totalCount,
  currentPage,
  totalPages,
  categorySlug,
  finderTitle,
  ctaLabel,
  ctaHref,
  quickStats,
  benefits,
  checklistTitle,
  checklist,
  tabs,
  supportTitle,
  supportText,
}: CategoryShowcaseProps) {
  return (
    <>
      <Header cta="Request Quote" />
      <main className="category-design">
        <section className="category-visual-hero">
          <div className="category-copy">
            <div className="category-breadcrumb">Home / Categories / {eyebrow}</div>
            <p className="category-kicker">{eyebrow}</p>
            <h1>
              {title} <span>{highlight}</span>
            </h1>
            <p>{description}</p>
            <div className="category-quick-stats">
              {quickStats.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="category-source-box">
              <strong>Can&apos;t find what you need?</strong>
              <span>Send vehicle fitment, OE number, product photos or requirements. Our team will help source the right solution.</span>
              <Link href={ctaHref}>{ctaLabel}</Link>
            </div>
          </div>
          <div className="category-hero-media">
            <img src={heroImage} alt={heroAlt} />
          </div>
        </section>

        <section className="category-fitment-panel" id="fitment-search">
          <div>
            <p className="category-kicker">{finderTitle}</p>
            <strong>Start with vehicle details, then narrow by product type or brand.</strong>
          </div>
          <form action={basePath}>
            <label>
              Year
              <select name="year" defaultValue="">
                <option value="">Select Year</option>
                <option>2026</option>
                <option>2025</option>
                <option>2024</option>
                <option>2023</option>
                <option>2022</option>
                <option>2021</option>
                <option>2020</option>
                <option>2019</option>
                <option>2018</option>
              </select>
            </label>
            <label>
              Make
              <select name="make" defaultValue={initialBrand === "all" ? "" : initialBrand}>
                <option value="">Select Make</option>
                <option>Audi</option>
                <option>BMW</option>
                <option>Mercedes-Benz</option>
                <option>Porsche</option>
                <option>Volkswagen</option>
                <option>Tesla</option>
              </select>
            </label>
            <label>
              Model
              <input name="q" defaultValue={initialSearch} placeholder="Select Model" />
            </label>
            <label>
              Type
              <select name="category" defaultValue={categorySlug}>
                <option value={categorySlug}>{eyebrow}</option>
              </select>
            </label>
            <button type="submit">Search</button>
            <Link href={basePath}>Clear all filters</Link>
          </form>
        </section>

        <section className="category-benefit-row" aria-label={`${eyebrow} ordering support`}>
          {benefits.map(([label, text]) => (
            <article key={label}>
              <i aria-hidden="true" />
              <strong>{label}</strong>
              <span>{text}</span>
            </article>
          ))}
        </section>

        <section className="category-products-section" id="category-products">
          <div className="category-section-head">
            <div>
              <p className="category-kicker">Browse {eyebrow}</p>
              <h2>Real catalog products available for inquiry.</h2>
            </div>
            <div className="category-tabs">
              {tabs.map((tab) => (
                <span key={tab}>{tab}</span>
              ))}
            </div>
          </div>
          <ProductBrowser
            products={productCardData(products)}
            pageType={pageType}
            initialBrand={initialBrand}
            initialCategory={categorySlug}
            initialSearch={initialSearch}
            totalCount={totalCount}
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={basePath}
          />
        </section>

        <section className="category-checklist">
          <div>
            <p className="category-kicker">Before you order</p>
            <h2>{checklistTitle}</h2>
          </div>
          <div className="category-check-grid">
            {checklist.map(([label, text], index) => (
              <article key={label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{label}</strong>
                <small>{text}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="category-support-cta">
          <div>
            <p className="category-kicker">Need a custom solution?</p>
            <h2>{supportTitle}</h2>
            <p>{supportText}</p>
            <Link className="button primary" href={ctaHref}>{ctaLabel}</Link>
          </div>
          <img src={heroImage} alt={`${eyebrow} sourcing support`} loading="lazy" />
        </section>
      </main>
    </>
  );
}
