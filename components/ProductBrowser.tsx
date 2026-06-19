"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categorySlug, type Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

const brandFilters = ["all", "BMW", "Mercedes-Benz", "Audi", "Porsche", "Nissan", "Toyota", "Chevrolet"];
const categoryFilters = ["headlights", "exhaust", "body-kits"];

export function ProductBrowser({
  products,
  pageType = "products",
  limit,
  initialBrand = "all",
  initialCategory = "",
  initialSearch = "",
}: {
  products: Product[];
  pageType?: "home" | "products" | "headlights" | "exhaust";
  limit?: number;
  initialBrand?: string;
  initialCategory?: string;
  initialSearch?: string;
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

  return (
    <>
      <div className="result-count" id="resultCount">
        {limit && filtered.length > limit
          ? `Showing ${visible.length} selected products from ${filtered.length}.`
          : `${visible.length} products shown${activeCriteria.length ? ` for ${activeCriteria.join(" / ")}` : ""}`}
      </div>
      <div className="filter-row" aria-label="Quick filters">
        {brandFilters.map((brand) => (
          <button
            className={activeFilter === brand ? "active" : ""}
            data-filter={brand}
            key={brand}
            onClick={() => setActiveFilter(brand)}
            type="button"
          >
            {brand === "all" ? "All" : brand}
          </button>
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
    </>
  );
}
