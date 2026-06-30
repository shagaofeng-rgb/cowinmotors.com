"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

const brandFilters = ["all", "BMW", "Mercedes-Benz", "Audi", "Porsche", "Volkswagen", "Tesla"];
const categoryFilters = ["headlights", "tail-lights", "exhaust", "oem-parts", "catalog-reference", "body-kits"];

function categorySlug(product: Product) {
  if (product.category.includes("Lighting")) return "headlights";
  if (product.category.includes("Tail")) return "tail-lights";
  if (product.category.includes("Exhaust")) return "exhaust";
  if (product.category.includes("Body")) return "body-kits";
  if (product.category.includes("OEM")) return "oem-parts";
  if (product.category.includes("Catalog")) return "catalog-reference";
  return "products";
}

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
  pageType?: "home" | "products" | "headlights" | "exhaust";
  limit?: number;
  initialBrand?: string;
  initialCategory?: string;
  initialSearch?: string;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  basePath?: string;
}) {
  const startingBrand = brandFilters.includes(initialBrand) ? initialBrand : "all";
  const startingCategory = categoryFilters.includes(initialCategory) ? initialCategory : "";
  const [activeFilter, setActiveFilter] = useState(startingBrand);

  const filtered = useMemo(() => {
    const query = initialSearch.trim().toLowerCase();

    return products.filter((product) => {
      const title = product.title.toLowerCase();
      const brandOk = activeFilter === "all" || title.includes(activeFilter.toLowerCase());
      if (!brandOk) return false;
      if (query && !title.includes(query)) return false;
      if (pageType === "headlights") return categorySlug(product) === "headlights";
      if (pageType === "exhaust") return categorySlug(product) === "exhaust";
      if (startingCategory) return categorySlug(product) === startingCategory;
      return true;
    });
  }, [activeFilter, initialSearch, pageType, products, startingCategory]);

  const visible = limit ? filtered.slice(0, limit) : filtered;
  const activeCriteria = [startingCategory, initialSearch.trim(), activeFilter !== "all" ? activeFilter : ""].filter(Boolean);
  const makeHref = (params: Record<string, string | number>) => {
    const search = new URLSearchParams();
    if (startingCategory) search.set("category", startingCategory);
    if (initialSearch.trim()) search.set("q", initialSearch.trim());
    if (activeFilter !== "all") search.set("make", activeFilter);
    Object.entries(params).forEach(([key, value]) => {
      if (value) search.set(key, String(value));
      else search.delete(key);
    });
    const query = search.toString();
    return `${basePath}${query ? `?${query}` : ""}`;
  };

  return (
    <>
      <div className="result-count" id="resultCount">
        {typeof totalCount === "number"
          ? `Showing ${visible.length} of ${totalCount} catalog products${activeCriteria.length ? ` for ${activeCriteria.join(" / ")}` : ""}.`
          : limit && filtered.length > limit
          ? `Showing ${visible.length} selected products from ${filtered.length}.`
          : `${visible.length} products shown${activeCriteria.length ? ` for ${activeCriteria.join(" / ")}` : ""}`}
      </div>
      <div className="filter-row" aria-label="Quick filters">
        {brandFilters.map((brand) => (
          <Link
            className={activeFilter === brand ? "active" : ""}
            data-filter={brand}
            href={makeHref({ make: brand === "all" ? "" : brand, page: 1 })}
            key={brand}
            onClick={() => setActiveFilter(brand)}
          >
            {brand === "all" ? "All" : brand}
          </Link>
        ))}
      </div>
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
