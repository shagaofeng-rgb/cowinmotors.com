"use client";

import { useMemo, useState } from "react";
import { categorySlug, type Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

const brandFilters = ["all", "BMW", "Mercedes-Benz", "Audi", "Porsche", "Nissan", "Toyota", "Chevrolet"];

export function ProductBrowser({
  products,
  pageType = "products",
  limit,
}: {
  products: Product[];
  pageType?: "home" | "products" | "headlights" | "exhaust";
  limit?: number;
}) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const title = product.title.toLowerCase();
      const brandOk = activeFilter === "all" || title.includes(activeFilter.toLowerCase());
      if (!brandOk) return false;
      if (pageType === "headlights") return categorySlug(product) === "headlights";
      if (pageType === "exhaust") return categorySlug(product) === "exhaust";
      return true;
    });
  }, [activeFilter, pageType, products]);

  const visible = limit ? filtered.slice(0, limit) : filtered;

  return (
    <>
      <div className="result-count" id="resultCount">
        {limit && filtered.length > limit
          ? `Showing ${visible.length} selected products from ${filtered.length}.`
          : `${visible.length} products shown`}
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
      <div className="product-grid" id="productGrid">
        {visible.map((product) => (
          <ProductCard key={product.__id} product={product} showLive={pageType !== "home"} />
        ))}
      </div>
    </>
  );
}
