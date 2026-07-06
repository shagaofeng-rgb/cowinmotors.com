import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { NewsCard } from "@/components/NewsCard";
import { getRelatedNewsForProduct } from "@/lib/news";
import { categorySlug, findProduct, inferBuyingPath, products } from "@/lib/products";

export function generateStaticParams() {
  return products.slice(0, 250).map((product) => ({ id: product.slug || String(product.__id) }));
}

function absoluteImageUrl(image: string) {
  if (!image) return "https://www.cowinmotors.com/assets/live/logo.jpg";
  if (image.startsWith("http")) return image;
  return `https://www.cowinmotors.com${image.startsWith("/") ? image : `/${image}`}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) return {};
  const title = `${product.title} | Cowinmotors`;
  const imageUrl = absoluteImageUrl(product.localImage);
  const description =
    product.description ||
    `Request a quote for ${product.title}. Confirm vehicle fitment, MOQ, lead time, packaging, and international shipping.`;
  return {
    title,
    description: description.slice(0, 155),
    alternates: { canonical: `/product/${product.slug || product.__id}` },
    openGraph: {
      title,
      description,
      images: [imageUrl],
    },
  };
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

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) notFound();
  const relatedNews = await getRelatedNewsForProduct(product, 3).catch(() => []);
  const imageUrl = absoluteImageUrl(product.localImage);
  const externalListingUrl = listingUrl(product.url);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: [imageUrl],
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    category: product.category,
    model: product.model || undefined,
    sku: product.partNumbers?.[0] || product.slug,
    description: product.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://www.cowinmotors.com/product/${product.slug || product.__id}`,
    },
  };

  return (
    <>
      <Header cta="Request quote" />
      <main className="section">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span><Link href="/products">Products</Link><span>/</span><Link href={`/products?category=${categorySlug(product)}`}>{product.category}</Link>
        </nav>
        <section className="pdp">
          <div className="pdp-media">
            <img src={product.localImage} alt={product.title} />
          </div>
          <div className="pdp-copy">
            <p className="eyebrow">{product.category}</p>
            <h1>{product.title}</h1>
            <div className="price-row pdp-price">
              <span className="price">{product.price || "Request quote"}</span>
              {product.compareAt ? <span className="compare">{product.compareAt}</span> : null}
            </div>
            <div className="pdp-actions">
              <Link className="button primary" href={`/quote?product=${encodeURIComponent(product.title)}`}>Request quote</Link>
              {externalListingUrl ? <a className="button secondary" href={externalListingUrl} target="_blank" rel="noreferrer">View product listing</a> : null}
            </div>
            <dl className="spec-table">
              <div><dt>Buying path</dt><dd>{inferBuyingPath(product)}</dd></div>
              <div><dt>Brand</dt><dd>{product.brand || "Confirm by quote"}</dd></div>
              <div><dt>Model / Fitment</dt><dd>{[product.model, product.yearRange].filter(Boolean).join(" / ") || "Confirm year / make / model / trim before ordering."}</dd></div>
              {product.partNumbers?.length ? <div><dt>Part number</dt><dd>{product.partNumbers.join(" / ")}</dd></div> : null}
              {product.side ? <div><dt>Side</dt><dd>{product.side}</dd></div> : null}
              {product.material ? <div><dt>Material</dt><dd>{product.material}</dd></div> : null}
              {product.moq ? <div><dt>MOQ</dt><dd>{product.moq}</dd></div> : null}
              {product.features?.length ? <div><dt>Features</dt><dd>{product.features.join(", ")}</dd></div> : null}
              <div><dt>Lead time</dt><dd>Estimated before dispatch. Confirm with sales for wholesale or custom orders.</dd></div>
              <div><dt>Shipping</dt><dd>Destination, carton size, tax/VAT, and customs duties are confirmed before payment.</dd></div>
              <div><dt>QC</dt><dd>Product and packaging checks can be arranged before shipment.</dd></div>
            </dl>
            <section className="pdp-description">
              <h2>Fitment and quotation notes</h2>
              <p>{product.description}</p>
              <p>For an accurate quotation, send the vehicle year, market region, trim, left/right side, OE part number if available, and target quantity. Cowinmotors will confirm fitment, availability, packaging, and export shipping before quotation.</p>
            </section>
          </div>
        </section>
        {relatedNews.length ? (
          <section className="related-news-section">
            <div className="section-title-row compact">
              <div>
                <p className="eyebrow">Related News</p>
                <h2>Market updates linked to this product.</h2>
              </div>
            </div>
            <div className="news-grid">
              {relatedNews.map((article) => <NewsCard article={article} key={article.id} />)}
            </div>
          </section>
        ) : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      </main>
    </>
  );
}
