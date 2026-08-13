import Link from "next/link";
import type { Product } from "@/lib/products";
import { ResilientImage } from "@/components/ResilientImage";
import { UI_ASSETS } from "@/lib/ui-assets";
import { productDisplayTitle } from "@/lib/product-detail";

function productPath(product: Product) {
  return `/product/${product.slug || product.__id}`;
}

export function ProductCard({ product, showLive = false }: { product: Product; showLive?: boolean }) {
  const fallbackImage = product.category.includes("Wheel")
    ? UI_ASSETS.wheelHero
    : product.category.includes("Tail")
      ? UI_ASSETS.tailLightHero
      : product.category.includes("Exhaust")
        ? UI_ASSETS.exhaustHero
        : product.category.includes("Body")
          ? UI_ASSETS.bodyKitHero
          : UI_ASSETS.headlightHero;

  return (
    <article className="product-card">
      <Link className="image-wrap" href={productPath(product)}>
        <ResilientImage src={product.localImage} alt={product.title} fallback={fallbackImage} />
      </Link>
      <div className="product-info">
        <h3>{productDisplayTitle(product)}</h3>
        <span className="fitment-line">
          {[product.brand, product.model, product.yearRange].filter(Boolean).join(" / ") || product.category || "Automotive Parts"}
        </span>
        {product.partNumbers?.length ? <span className="fitment-line">Part No. {product.partNumbers.slice(0, 2).join(" / ")}</span> : null}
        <div className="product-actions">
          <Link className="product-link" href={productPath(product)}>
            View details
          </Link>
          <Link className="quote-link" href={`${productPath(product)}#product-inquiry`}>
            Request a Quote
          </Link>
        </div>
      </div>
    </article>
  );
}
