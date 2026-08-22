import Link from "next/link";
import { hasUsableProductImage, type Product } from "@/lib/products";
import { ResilientImage } from "@/components/ResilientImage";
import { productDisplayTitle } from "@/lib/product-detail";

function productPath(product: Product) {
  return `/product/${product.slug || product.__id}`;
}

export function ProductCard({ product, showLive = false }: { product: Product; showLive?: boolean }) {
  return (
    <article className="product-card">
      <Link className="image-wrap" href={productPath(product)}>
        {hasUsableProductImage(product) ? <ResilientImage src={product.localImage} alt={product.title} fallback={product.localImage} /> : <span className="product-card-image-unavailable">Image verification pending</span>}
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
