import Link from "next/link";
import { Header } from "@/components/Header";
import { inferBuyingPath, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ id: String(product.__id) }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products[Number(id)] || products[0];

  return (
    <>
      <Header cta="Request quote" />
      <main className="section">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span><Link href="/products">Products</Link><span>/</span><span>{product.category}</span>
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
              <a className="button secondary" href={product.url} target="_blank" rel="noreferrer">Open live store product</a>
            </div>
            <dl className="spec-table">
              <div><dt>Buying path</dt><dd>{inferBuyingPath(product)}</dd></div>
              <div><dt>Fitment</dt><dd>Confirm year / make / model / trim before ordering.</dd></div>
              <div><dt>Lead time</dt><dd>Estimated before dispatch. Confirm with sales for wholesale or custom orders.</dd></div>
              <div><dt>Shipping</dt><dd>Destination, carton size, tax/VAT and customs duties should be confirmed before payment.</dd></div>
              <div><dt>QC</dt><dd>Product and packaging checks can be arranged before shipment.</dd></div>
            </dl>
          </div>
        </section>
      </main>
    </>
  );
}
