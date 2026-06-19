import Link from "next/link";
import { inferBuyingPath, type Product } from "@/lib/products";

export function ProductCard({ product, showLive = false }: { product: Product; showLive?: boolean }) {
  return (
    <article className="product-card">
      {product.status ? <span className="badge">{product.status}</span> : null}
      <span className="quote-badge">{inferBuyingPath(product)}</span>
      <Link className="image-wrap" href={`/product/${product.__id}`}>
        <img src={product.localImage} alt={product.title} loading="lazy" />
      </Link>
      <div className="product-info">
        <h3>{product.title}</h3>
        <span className="fitment-line">{product.category || "Automotive Parts"} | Confirm fitment before order</span>
        <div className="price-row">
          <span className="price">{product.price || "Request quote"}</span>
          {product.compareAt ? <span className="compare">{product.compareAt}</span> : null}
        </div>
        <div className="product-actions">
          <Link className="product-link" href={`/product/${product.__id}`}>
            View details
          </Link>
          {showLive ? (
            <a className="quote-link" href={product.url} target="_blank" rel="noreferrer">
              Live store
            </a>
          ) : null}
          <Link className="quote-link" href={`/quote?product=${encodeURIComponent(product.title)}`}>
            Request quote
          </Link>
        </div>
      </div>
    </article>
  );
}
