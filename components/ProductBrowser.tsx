import Link from "next/link";
import { ArrowLeft, ArrowRight, SearchX, X } from "lucide-react";
import { CatalogFilters } from "@/components/CatalogFilters";
import { ProductCard } from "@/components/ProductCard";
import { catalogCategories, type CatalogCategory } from "@/lib/catalog-categories";
import { categorySearchPath, type CategorySearchParams } from "@/lib/category-url";
import { byCategory, productBrands, type paginateProducts } from "@/lib/products";

export function ProductBrowser({ paged, params, basePath, category }: {
  paged: ReturnType<typeof paginateProducts>;
  params: CategorySearchParams;
  basePath: string;
  category?: CatalogCategory;
}) {
  const activeCategory = category || params.category || "";
  const brands = activeCategory ? [...new Set(byCategory(activeCategory).flatMap((item) => item.brand ? [item.brand] : []))].sort() : productBrands;
  const filters = [
    ...(category ? [] : [{ key: "category" as const, value: params.category, label: catalogCategories[params.category as CatalogCategory]?.label || params.category }]),
    { key: "make" as const, value: params.make, label: params.make },
    { key: "q" as const, value: params.q, label: params.q },
    { key: "year" as const, value: params.year, label: params.year },
  ].filter(({ key, value }) => value && !(key === "make" && value.toLowerCase() === "all"));
  const pageHref = (page: number) => categorySearchPath(basePath, { ...params, page: String(page) });
  const { items, total, currentPage, totalPages, pageSize } = paged;
  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])].filter((page) => page > 0 && page <= totalPages).sort((a, b) => a - b);

  return (
    <section className="cm-catalog" id="category-products" aria-labelledby="catalog-results-heading">
      <CatalogFilters key={categorySearchPath(basePath, params)} basePath={basePath} brands={brands} params={params} wheelCatalog={category === "wheels"} activeCount={filters.length} />
      {filters.length > 0 && (
        <div className="cm-filter-chips" aria-label="Applied filters">
          {filters.map(({ key, label }) => <Link key={key} href={categorySearchPath(basePath, { ...params, [key]: "", page: undefined })} aria-label={`Remove filter ${label}`}>{label}<X size={14} aria-hidden="true" /></Link>)}
          <Link className="cm-clear-filters" href={basePath}>Clear all</Link>
        </div>
      )}
      <div className="cm-section-head cm-catalog-results">
        <h2 id="catalog-results-heading">{filters.length ? "Search results" : "Catalog listings"}</h2>
        <p id="resultCount">{total ? `${((currentPage - 1) * pageSize + 1).toLocaleString("en-US")}–${((currentPage - 1) * pageSize + items.length).toLocaleString("en-US")} of ${total.toLocaleString("en-US")}` : "0 products"}</p>
      </div>
      {items.length ? (
        <div id="productGrid" className="cm-part-grid">{items.map((product) => <ProductCard key={product.__id} product={product} />)}</div>
      ) : (
        <div id="productGrid" className="cm-empty">
          <SearchX size={30} aria-hidden="true" />
          <h3>No matching parts</h3>
          <p>Clear the filters or send the vehicle and part reference for a sourcing review.</p>
          <div className="cm-inline-actions"><Link className="cm-btn cm-btn-outline" href={basePath}>Clear filters</Link><Link className="cm-btn cm-btn-primary" href="/quote">Request sourcing <ArrowRight size={17} aria-hidden="true" /></Link></div>
        </div>
      )}
      {totalPages > 1 && (
        <nav className="cm-pagination" aria-label="Product pagination">
          {currentPage > 1 ? <Link href={pageHref(currentPage - 1)} rel="prev" aria-label="Previous page" title="Previous page"><ArrowLeft size={18} /></Link> : <span className="cm-page-disabled" aria-hidden="true"><ArrowLeft size={18} /></span>}
          {pages.map((page, i) => (
            <span className="cm-page-unit" key={page}>
              {i > 0 && page - pages[i - 1] > 1 && <span className="cm-page-gap" aria-hidden="true">...</span>}
              {page === currentPage ? <span className="cm-page-current" aria-current="page">{page}</span> : <Link href={pageHref(page)} aria-label={`Page ${page}`}>{page}</Link>}
            </span>
          ))}
          {currentPage < totalPages ? <Link href={pageHref(currentPage + 1)} rel="next" aria-label="Next page" title="Next page"><ArrowRight size={18} /></Link> : <span className="cm-page-disabled" aria-hidden="true"><ArrowRight size={18} /></span>}
        </nav>
      )}
    </section>
  );
}
