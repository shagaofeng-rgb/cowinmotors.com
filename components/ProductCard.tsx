import Link from "next/link";
import type { Product } from "@/lib/products";

function productPath(product: Product) {
  return `/product/${product.slug || product.__id}`;
}

function inferBuyingPath(product: Product) {
  const title = product.title.toLowerCase();
  if (title.includes("body") || title.includes("kit") || title.includes("paint") || title.includes("titanium") || title.includes("wholesale")) {
    return "RFQ";
  }
  return "Direct / RFQ";
}

function listingUrl(url?: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url, "https://www.cowinmotors.com");
    if (parsed.hostname.replace(/^www\./, "") === "cowinmotors.com") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

export function ProductCard({ product, showLive = false }: { product: Product; showLive?: boolean }) {
  const externalListingUrl = listingUrl(product.url);

  return (
    <article className="product-card">
      {product.status ? <span className="badge">{product.status}</span> : null}
      <span className="quote-badge">{inferBuyingPath(product)}</span>
      <Link className="image-wrap" href={productPath(product)}>
        <img src={product.localImage} alt={product.title} loading="lazy" />
      </Link>
      <div className="product-info">
        <h3>{product.title}</h3>
        <span className="fitment-line">
          {[product.brand, product.model, product.yearRange].filter(Boolean).join(" / ") || product.category || "Automotive Parts"}
        </span>
        {product.partNumbers?.length ? <span className="fitment-line">Part No. {product.partNumbers.slice(0, 2).join(" / ")}</span> : null}
        <div className="price-row">
          <span className="price">{product.price || "Request quote"}</span>
          {product.compareAt ? <span className="compare">{product.compareAt}</span> : null}
        </div>
        <div className="product-actions">
          <Link className="product-link" href={productPath(product)}>
            View details
          </Link>
          {showLive && externalListingUrl ? (
            <a className="quote-link" href={externalListingUrl} target="_blank" rel="noreferrer">
              Product listing
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
