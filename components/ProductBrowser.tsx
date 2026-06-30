"use client";

import Link from "next/link";
import type { Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

const brandFilters = ["all", "BMW", "Mercedes-Benz", "Audi", "Porsche", "Volkswagen", "Tesla"];
const categoryFilters = ["headlights", "tail-lights", "exhaust", "catalog-reference", "body-kits"];

export function ProductBrowser({
  products,
  pageType = "products",
  limit,
  initialBrand = "all",
  initialCategory = "",
  initialSearch = "",
  totalCount,
  currentPage = 1,
  totalPages = 1,
  basePath = "/products",
}: {
  products: Product[];
  pageType?: "home" | "products" | "headlights" | "tail-lights" | "exhaust";
  limit?: number;
  initialBrand?: string;
  initialCategory?: string;
  initialSearch?: string;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  basePath?: string;
}) {
  const activeBrand = brandFilters.includes(initialBrand) ? initialBrand : "all";
  const startingCategory = categoryFilters.includes(initialCategory) ? initialCategory : "";
  const visible = limit ? products.slice(0, limit) : products;
  const activeCriteria = [startingCategory, initialSearch.trim(), activeBrand !== "all" ? activeBrand : ""].filter(Boolean);
  const makeHref = (params: Record<string, string | number>) => {
    const search = new URLSearchParams();
    if (startingCategory) search.set("category", startingCategory);
    if (initialSearch.trim()) search.set("q", initialSearch.trim());
    if (activeBrand !== "all") search.set("make", activeBrand);
    Object.entries(params).forEach(([key, value]) => {
      if (value) search.set(key, String(value));
      else search.delete(key);
    });
    const query = search.toString();
    return `${basePath}${query ? `?${query}` : ""}`;
  };

  return (
    <>
      {pageType !== "home" ? (
        <form className="product-search" action={basePath}>
          {startingCategory ? <input type="hidden" name="category" value={startingCategory} /> : null}
          {activeBrand !== "all" ? <input type="hidden" name="make" value={activeBrand} /> : null}
          <input
            name="q"
            type="search"
            defaultValue={initialSearch}
            placeholder="Search by model, year, part number, product type..."
            aria-label="Search products"
          />
          <button type="submit">Search</button>
          {initialSearch.trim() ? (
            <Link className="search-reset" href={makeHref({ q: "", page: 1 })}>
              Clear
            </Link>
          ) : null}
        </form>
      ) : null}
      <div className="result-count" id="resultCount">
        {typeof totalCount === "number"
          ? `Showing ${visible.length} of ${totalCount} catalog products${activeCriteria.length ? ` for ${activeCriteria.join(" / ")}` : ""}.`
          : limit && products.length > limit
          ? `Showing ${visible.length} selected products from ${products.length}.`
          : `${visible.length} products shown${activeCriteria.length ? ` for ${activeCriteria.join(" / ")}` : ""}`}
      </div>
      {pageType !== "home" ? (
        <div className="filter-row" aria-label="Quick filters">
          {brandFilters.map((brand) => (
            <Link
              className={activeBrand === brand ? "active" : ""}
              data-filter={brand}
              href={makeHref({ make: brand === "all" ? "" : brand, page: 1 })}
              key={brand}
            >
              {brand === "all" ? "All" : brand}
            </Link>
          ))}
        </div>
      ) : null}
      {visible.length ? (
        <div className="product-grid" id="productGrid">
          {visible.map((product) => (
            <ProductCard key={product.__id} product={product} showLive={pageType !== "home"} />
          ))}
        </div>
      ) : (
        <div className="no-results" id="productGrid">
          <h3>No matching catalog listings yet.</h3>
          <p>Send vehicle fitment, part type, quantity, and destination country. We can confirm sourcing, MOQ, lead time, and shipping options by quote.</p>
          <Link className="button primary" href="/quote?product=Custom%20fitment%20RFQ">
            Request fitment quote
          </Link>
        </div>
      )}
      {totalPages > 1 ? (
        <nav className="pagination" aria-label="Product pagination">
          <Link className={currentPage <= 1 ? "disabled" : ""} href={makeHref({ page: Math.max(1, currentPage - 1) })}>Previous</Link>
          <span>Page {currentPage} of {totalPages}</span>
          <Link className={currentPage >= totalPages ? "disabled" : ""} href={makeHref({ page: Math.min(totalPages, currentPage + 1) })}>Next</Link>
        </nav>
      ) : null}
    </>
  );
}
