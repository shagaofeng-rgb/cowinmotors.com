import Link from "next/link";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { notFound, permanentRedirect } from "next/navigation";
import { InnerBreadcrumb, InnerPage } from "@/components/InnerPage";
import { PartIcon } from "@/components/PartIcon";
import { ProductBrowser } from "@/components/ProductBrowser";
import { catalogCategories, type CatalogCategory } from "@/lib/catalog-categories";
import { categorySearchPath, normalizedPage, shouldNormalizeCategorySearch, type CategorySearchParams } from "@/lib/category-url";
import { filterProducts, paginateProducts } from "@/lib/products";
import "@/app/catalog.css";

export function CatalogCategoryNav({ current }: { current?: CatalogCategory }) {
  const links = Object.entries(catalogCategories).map(([category, { label }]) => (
    <Link href={`/${category}`} aria-current={category === current ? "page" : undefined} key={category}><PartIcon category={category} size={21} /> {label}</Link>
  ));
  return (
    <nav className="cm-category-nav" aria-label="Product categories">
      <div className="cm-wrap cm-category-links">{links}</div>
      <details className="cm-wrap cm-category-picker" key={current || "catalog"}>
        <summary><PartIcon category={current || "products"} size={21} /> <span>{current ? catalogCategories[current].label : "Browse categories"}</span><ChevronDown size={19} aria-hidden="true" /></summary>
        <div>{links}</div>
      </details>
    </nav>
  );
}

export function CategoryBanner({ category }: { category: CatalogCategory }) {
  const { label, title, summary } = catalogCategories[category];
  const asset = `/assets/ui/interior/${category}`;
  return (
    <section className={`cm-category-banner cm-banner-${category}`}>
      <picture>
        <source media="(max-width: 680px)" srcSet={`${asset}-compact.webp`} />
        <img src={`${asset}.webp`} alt="" fetchPriority="high" decoding="async" />
      </picture>
      <div className="cm-wrap cm-banner-content">
        <InnerBreadcrumb items={[{ label: "Catalog", href: "/products" }, { label }]} />
        <h1>{title}</h1>
        <p>{summary}</p>
        {category === "body-kits" && <a className="cm-btn cm-btn-primary" href="#body-kit-inquiry">Request body kit sourcing <ArrowRight size={18} aria-hidden="true" /></a>}
      </div>
      <span className="cm-banner-caption">Generated category illustration</span>
    </section>
  );
}

export function CategoryChecklist({ category }: { category: CatalogCategory }) {
  return (
    <section className="cm-category-checks">
      <div className="cm-wrap">
        <h2>Before you order</h2>
        <dl>{catalogCategories[category].checklist.map(([label, body]) => <div key={label}><dt><Check size={19} aria-hidden="true" /> {label}</dt><dd>{body}</dd></div>)}</dl>
        <Link className="cm-text-link" href="/fitment-check">See the fitment checklist <ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

export function CategoryShowcase({ category, params }: { category: Exclude<CatalogCategory, "body-kits">; params: CategorySearchParams }) {
  const basePath = `/${category}`;
  if (shouldNormalizeCategorySearch(params)) permanentRedirect(categorySearchPath(basePath, params));
  const page = normalizedPage(params.page);
  const paged = paginateProducts(filterProducts({ category, brand: params.make, query: params.q, year: params.year }), page, 25);
  if (page > paged.totalPages) notFound();

  return (
    <InnerPage className="cm-catalog-page">
      <CategoryBanner category={category} />
      <CatalogCategoryNav current={category} />
      <div className="cm-wrap"><ProductBrowser paged={paged} params={params} category={category} basePath={basePath} /></div>
      <CategoryChecklist category={category} />
      <section className="cm-wrap cm-catalog-close">
        <div><h2>Need a part that isn't listed?</h2><p>Send a product reference or photo, the vehicle details, quantity and destination.</p></div>
        <Link className="cm-btn cm-btn-primary" href={`/quote?category=${category}`}>Request sourcing <ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
    </InnerPage>
  );
}
