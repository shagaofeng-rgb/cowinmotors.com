"use client";

import Link from "next/link";
import type { Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

const brandFilters = [
  "all",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Porsche",
  "Volkswagen",
  "Tesla",
  "PDW Group",
  "Vossen Wheels",
  "AL13 Wheels",
  "BC Forged NA",
  "HRE Wheels",
  "WORK Wheels USA",
  "Brixton Forged",
];
const vehicleBrandFilters = ["all", "BMW", "Mercedes-Benz", "Audi", "Porsche", "Volkswagen", "Tesla", "Toyota", "Ford", "Honda", "Lexus"];
const wheelBrandFilters = ["all", "PDW Group", "Vossen Wheels", "AL13 Wheels", "BC Forged NA", "HRE Wheels", "WORK Wheels USA", "Brixton Forged"];
const categoryFilters = ["headlights", "tail-lights", "exhaust", "body-kits", "wheels"];

export function ProductBrowser({
  products,
  pageType = "products",
  limit,
  initialBrand = "all",
  initialCategory = "",
  initialSearch = "",
  initialYear = "",
  totalCount,
  currentPage = 1,
  totalPages = 1,
  basePath = "/products",
}: {
  products: Product[];
  pageType?: "home" | "products" | "headlights" | "tail-lights" | "exhaust" | "wheels";
  limit?: number;
  initialBrand?: string;
  initialCategory?: string;
  initialSearch?: string;
  initialYear?: string;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  basePath?: string;
}) {
  const filterOptions = pageType === "wheels" ? wheelBrandFilters : pageType === "products" ? brandFilters : vehicleBrandFilters;
  const activeBrand = filterOptions.includes(initialBrand) ? initialBrand : "all";
  const startingCategory = categoryFilters.includes(initialCategory) ? initialCategory : "";
  const categoryInPath = basePath !== "/products";
  const visible = limit ? products.slice(0, limit) : products;
  const activeCriteria = [startingCategory, initialYear.trim(), initialSearch.trim(), activeBrand !== "all" ? activeBrand : ""].filter(Boolean);
  const makeHref = (params: Record<string, string | number>) => {
    const search = new URLSearchParams();
    if (startingCategory && !categoryInPath) search.set("category", startingCategory);
    if (initialSearch.trim()) search.set("q", initialSearch.trim());
    if (initialYear.trim()) search.set("year", initialYear.trim());
    if (activeBrand !== "all") search.set("make", activeBrand);
    Object.entries(params).forEach(([key, value]) => {
      if (key === "page" && String(value) === "1") {
        search.delete(key);
      } else if (value) {
        search.set(key, String(value));
      } else {
        search.delete(key);
      }
    });
    const query = search.toString();
    return `${basePath}${query ? `?${query}` : ""}`;
  };

  return (
    <>
      {pageType !== "home" ? (
        <form className="product-search" action={basePath}>
          {startingCategory && !categoryInPath ? <input type="hidden" name="category" value={startingCategory} /> : null}
          {activeBrand !== "all" ? <input type="hidden" name="make" value={activeBrand} /> : null}
          {initialYear.trim() ? <input type="hidden" name="year" value={initialYear} /> : null}
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
          {filterOptions.map((brand) => (
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
          <Link className="button primary" href="/quote">
            Request fitment quote
          </Link>
        </div>
      )}
      {totalPages > 1 ? (
        <nav className="pagination" aria-label="Product pagination">
          {currentPage > 1 ? <Link href={makeHref({ page: currentPage - 1 })}>Previous</Link> : <span className="disabled">Previous</span>}
          {[...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages].filter((page) => page >= 1 && page <= totalPages))]
            .sort((left, right) => left - right)
            .map((page, index, pages) => (
              <span key={page} className="pagination-page">
                {index > 0 && page - pages[index - 1] > 1 ? <span className="pagination-gap" aria-hidden="true">…</span> : null}
                {page === currentPage ? <span aria-current="page">{page}</span> : <Link href={makeHref({ page })}>{page}</Link>}
              </span>
            ))}
          {currentPage < totalPages ? <Link href={makeHref({ page: currentPage + 1 })}>Next</Link> : <span className="disabled">Next</span>}
        </nav>
      ) : null}
    </>
  );
}
