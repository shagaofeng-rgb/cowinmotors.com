import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { QuoteForm } from "@/components/QuoteForm";
import { categorySlug, findProduct, productPath, products } from "@/lib/products";
import { productBreadcrumbSchema, productDisplayTitle, productFaqs, productFaqSchema, productSchema, productSeoDescription, productSpecs } from "@/lib/product-detail";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map((product) => ({ id: product.slug || String(product.__id) }));
}

function absoluteImageUrl(image: string) {
  return image.startsWith("http") ? image : `https://www.cowinmotors.com${image.startsWith("/") ? image : `/${image}`}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) return {};
  const title = productDisplayTitle(product);
  const description = productSeoDescription(product);
  return {
    title,
    description,
    alternates: { canonical: productPath(product) },
    openGraph: { title, description, type: "website", url: `https://www.cowinmotors.com${productPath(product)}`, images: [{ url: absoluteImageUrl(product.localImage), alt: product.title }] },
    twitter: { card: "summary_large_image", title, description, images: [absoluteImageUrl(product.localImage)] },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) notFound();
  const category = categorySlug(product);
  const title = productDisplayTitle(product);
  const specs = productSpecs(product);
  const faqs = productFaqs(product);
  const related = products.filter((item) => item.__id !== product.__id && categorySlug(item) === category && (item.model === product.model || item.brand === product.brand)).slice(0, 4);

  return (
    <>
      <Header cta="Request a Quote" />
      <main className="product-detail-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span><Link href={`/${category}`}>{product.category}</Link><span>/</span><span>{title}</span>
        </nav>

        <section className="product-hero">
          <div className="product-gallery">
            <figure><img src={product.localImage} alt={`${title} product image`} /><figcaption>Product image supplied with the catalog record.</figcaption></figure>
          </div>
          <div className="product-summary">
            <p className="eyebrow">{product.category}</p>
            <h1>{title}</h1>
            <p className="product-fitment">Compatible with {[product.brand, product.model, product.yearRange].filter(Boolean).join(" ") || "vehicle fitment to be confirmed"}</p>
            {product.partNumbers?.length ? <p className="product-reference">Reference: {product.partNumbers.join(" / ")}</p> : null}
            <div className="product-actions">
              <a className="button primary" href="#product-inquiry">Request a Quote</a>
              <Link className="button secondary" href="/fitment-check">Check Fitment</Link>
              <a className="button secondary" href={`https://api.whatsapp.com/send/?phone=%2B8617601255205&text=${encodeURIComponent(`Hello, I would like to confirm ${title}.`)}`} target="_blank" rel="noreferrer">WhatsApp Inquiry</a>
            </div>
            <p className="product-confirmation">Before ordering, confirm model year, market version, LHD/RHD where applicable, side or set, connector or configuration, and OE number or reference photo.</p>
          </div>
        </section>

        <section className="trust-strip" aria-label="Service support"><div><strong>Fitment Confirmation</strong><span>Checked before quotation</span></div><div><strong>Pre-Shipment QC Support</strong><span>Coordination available</span></div><div><strong>Export Packaging Support</strong><span>Reviewed for the order</span></div><div><strong>Worldwide Shipping Coordination</strong><span>By destination requirement</span></div><div><strong>Retail & Wholesale Inquiry Support</strong><span>For qualified requests</span></div></section>

        <section className="product-content-grid">
          <div className="product-longform">
            <section><p className="eyebrow">Product overview</p><h2>What this product is</h2><p>{product.description || `This catalog-listed ${product.category.toLowerCase()} item is available for fitment-led sourcing inquiry.`}</p><p>It is intended for buyers who need compatibility confirmation, product-detail review, packaging coordination, and export support before ordering.</p></section>
            <section><h2>Vehicle compatibility</h2><p>Compatible with {([product.brand, product.model, product.yearRange].filter(Boolean).join(" ") || "the vehicle configuration confirmed by sales")}. Vehicle brand names are used only to indicate compatibility. Cowinmotors Automotive Parts is an independent automotive parts sourcing and export partner.</p></section>
            <section><h2>Product details</h2><dl className="product-specs">{specs.map((spec) => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></section>
            <section><h2>What to confirm before ordering</h2><ol className="confirmation-list"><li>Vehicle year</li><li>Make and model</li><li>Trim and engine</li><li>LHD or RHD where applicable</li><li>Left, right, or full set</li><li>OE number or product photo if available</li><li>Destination country</li><li>Quantity and packaging requirements</li></ol></section>
            <section><h2>Packaging & Export Support</h2><ul><li>Product photo confirmation</li><li>Packaging review</li><li>Pre-shipment QC coordination</li><li>Carton, pallet, or wooden-crate options when applicable</li><li>Shipping coordination</li><li>Export documentation support subject to product and destination requirements</li></ul></section>
          </div>
          <aside className="product-buying-notes"><p className="eyebrow">Buying notes</p><h2>Fitment-led sourcing</h2><p>Unlisted specifications are not assumed. Send the exact vehicle and product reference so the quotation can be checked before ordering.</p><Link href="/wholesale-auto-parts-sourcing">How sourcing support works</Link></aside>
        </section>

        <section id="product-inquiry" className="product-inquiry-section"><div><p className="eyebrow">Request a product quote</p><h2>Send the vehicle details for a fitment check.</h2><p>We will review the product reference, vehicle configuration, quantity, packaging, and destination before quotation.</p></div><QuoteForm initialProduct={title} initialCategory={product.category} /></section>

        <section className="product-faq"><p className="eyebrow">Product FAQ</p><h2>Buying questions</h2>{faqs.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>

        {related.length ? <section className="related-products"><div className="section-title-row compact"><div><p className="eyebrow">Related products</p><h2>More catalog items to compare</h2></div><Link href={`/${category}`}>View category</Link></div><div className="product-grid">{related.map((item) => <ProductCard product={item} key={item.__id} />)}</div></section> : null}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema(product)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productFaqSchema(product)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productBreadcrumbSchema(product)) }} />
      </main>
    </>
  );
}
