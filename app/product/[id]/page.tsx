import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CarFront, Check, ChevronDown, ClipboardCheck, MessageCircle, PackageCheck, Ruler, Truck } from "lucide-react";
import { notFound, permanentRedirect } from "next/navigation";
import { InnerBreadcrumb, InnerPage } from "@/components/InnerPage";
import { MobileQuoteBar } from "@/components/MobileQuoteBar";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductCard } from "@/components/ProductCard";
import { QuoteForm } from "@/components/QuoteForm";
import { WheelFitmentDiagram } from "@/components/WheelFitmentDiagram";
import { categorySlug, findProduct, isProductIndexable, productCategoryOptions, productPath, products } from "@/lib/products";
import { productBreadcrumbSchema, productDisplayTitle, productFaqs, productFaqSchema, productFitment, productFitmentChecks, productReferences, productSchema, productSeoDescription, productSpecs } from "@/lib/product-detail";
import { catalogProductPhotos } from "@/lib/product-media";
import "./detail.css";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map((product) => ({ id: product.slug || String(product.__id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) return {};
  const title = productDisplayTitle(product);
  const description = productSeoDescription(product);
  const photo = catalogProductPhotos(product)[0];
  const image = photo && new URL(photo, "https://www.cowinmotors.com").href;
  return {
    title,
    description,
    alternates: { canonical: productPath(product) },
    robots: isProductIndexable(product) ? undefined : { index: false, follow: true },
    openGraph: { title, description, type: "website", url: `https://www.cowinmotors.com${productPath(product)}`, ...(image ? { images: [{ url: image, alt: product.title }] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) notFound();
  const canonicalId = product.slug || String(product.__id);
  if (id !== canonicalId) permanentRedirect(productPath(product));
  const category = categorySlug(product);
  const categoryLabel = productCategoryOptions.find((item) => item.slug === category)?.label || "Automotive Parts";
  const title = productDisplayTitle(product);
  const path = productPath(product);
  const reference = productReferences(product)[0];
  const photos = catalogProductPhotos(product);
  const fitment = productFitment(product);
  const checks = productFitmentChecks(product);
  const lighting = category === "headlights" || category === "tail-lights";
  const fitmentNote = lighting ? "Confirm original lamp, connector and LHD / RHD."
    : category === "exhaust" ? "Confirm engine code and current exhaust layout."
    : category === "wheels" ? "Confirm diameter, bolt pattern, offset and center bore."
    : "Confirm configuration and part reference.";
  const specs = productSpecs(product);
  const quickSpecs = specs.filter(({ label }) => !["Catalog type", "Part number / reference", "Wheel maker", "Wheel model"].includes(label)).slice(0, 3);
  const faqs = productFaqs(product);
  const whatsapp = `https://wa.me/8617601255205?text=${encodeURIComponent(`Hello, I'd like to ask about ${title}. https://www.cowinmotors.com${path}`)}`;
  const related = products.filter((item) => item.__id !== product.__id && categorySlug(item) === category && (item.model === product.model || item.brand === product.brand))
    .sort((a, b) => Number(b.model === product.model) - Number(a.model === product.model)).slice(0, 4);
  const fitmentName = fitment.vehicle || "Vehicle to be confirmed";

  return (
    <InnerPage className="cm-product">
      <div className="cm-wrap">
        <InnerBreadcrumb items={[{ label: "Catalog", href: "/products" }, ...(category === "products" ? [] : [{ label: categoryLabel, href: `/${category}` }]), { label: reference || "Product details" }]} />

        <section className="cm-product-top" aria-labelledby="product-title">
          <div className="cm-pd-identity">
            <h1 id="product-title">{product.title}</h1>
            {reference && <p className="cm-pd-reference">Part reference <strong>{reference}</strong></p>}
          </div>
          <ProductGallery photos={photos} title={product.title} category={category} />
          <div className="cm-pd-summary">
            <div className="cm-fitment-summary">
              <CarFront size={24} aria-hidden="true" />
              <div>
                <span>{category === "wheels" ? "Fitment" : "Listed fitment"}</span>
                <strong>{fitmentName}{fitment.years ? ` / ${fitment.years}` : ""}</strong>
                <p className="cm-fitment-note">{fitmentNote}</p>
              </div>
              <a href="#fitment" className="cm-icon-btn" aria-label="View fitment details" title="View fitment details"><ChevronDown size={20} aria-hidden="true" /></a>
            </div>
            {quickSpecs.length > 0 && <dl className="cm-quick-specs">{quickSpecs.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
            <div className="cm-pd-actions">
              <a className="cm-btn cm-btn-primary" href="#product-inquiry">Request a quote <ArrowUpRight size={19} aria-hidden="true" /></a>
              <a className="cm-btn cm-btn-outline" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17} aria-hidden="true" /> WhatsApp</a>
            </div>
            <p className="cm-pd-buying"><ClipboardCheck size={17} aria-hidden="true" /> Fitment and package contents confirmed before ordering.</p>
          </div>
        </section>
      </div>

      <nav className="cm-pd-section-nav" aria-label="On this product page">
        <div className="cm-wrap"><a href="#fitment">Fitment</a><a href="#specifications">Specifications</a><a href="#shipping">Shipping &amp; QC</a><a href="#product-faq">FAQ</a></div>
      </nav>

      <div className="cm-wrap cm-pd-details">
        <div className="cm-pd-data">
          <section id="fitment" className="cm-pd-section">
            <h2><CarFront aria-hidden="true" /> Vehicle fitment</h2>
            <dl className="cm-spec-table">
              <div><dt>{category === "wheels" ? "Application" : "Listed vehicle"}</dt><dd>{fitmentName}</dd></div>
              {category !== "wheels" && <div><dt>Model years</dt><dd>{fitment.years || "Confirm before ordering"}</dd></div>}
            </dl>
            <p className="cm-small">Vehicle names indicate compatibility only. Cowinmotors is an independent sourcing and export partner.</p>
          </section>
          <section id="specifications" className="cm-pd-section">
            <h2><Ruler aria-hidden="true" /> Technical specifications</h2>
            {product.description && !product.description.startsWith("Request a quote for ") && <p>{product.description}</p>}
            {specs.length > 0 && <dl className="cm-spec-table">{specs.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
            <p className="cm-small">Unlisted dimensions, components and installation requirements are confirmed by quote.</p>
            {category === "wheels" && <WheelFitmentDiagram />}
          </section>
          <section id="shipping" className="cm-pd-section">
            <h2><Truck aria-hidden="true" /> Shipping &amp; quality checks</h2>
            <p>Ask for product photos, a packaging review and pre-shipment QC coordination. Freight options and export documentation depend on the part and destination.</p>
            <div className="cm-pd-service-links">
              <Link href="/quality-control"><ClipboardCheck size={20} aria-hidden="true" /> Quality control <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link href="/packaging-shipping"><PackageCheck size={20} aria-hidden="true" /> Packaging &amp; shipping <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          </section>
        </div>
        <aside className="cm-pd-checklist">
          <h2>Before you order</h2>
          <ul>{checks.map((check) => <li key={check}><Check size={18} aria-hidden="true" />{check}</li>)}</ul>
          <Link className="cm-text-link" href="/fitment-check">Fitment checklist <ArrowRight size={17} aria-hidden="true" /></Link>
          <Link className="cm-text-link" href="/installation-guidance">Installation guidance <ArrowRight size={17} aria-hidden="true" /></Link>
        </aside>
      </div>

      <section id="product-inquiry" className="cm-inquiry-band">
        <div className="cm-wrap cm-inquiry-layout">
          <div className="cm-inquiry-aside">
            <h2>Request a quote</h2>
            <p>Tell us about the vehicle, quantity and destination so we can confirm the right configuration.</p>
            <div className="cm-quote-item"><strong>{product.title}</strong>{reference && <span>Ref. {reference}</span>}</div>
            <a className="cm-text-link" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden="true" /> Ask on WhatsApp <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
          <QuoteForm initialProduct={title} initialCategory={product.category} productUrl={`https://www.cowinmotors.com${path}`} lighting={lighting} />
        </div>
      </section>

      <div className="cm-wrap cm-pd-bottom">
        <section id="product-faq" className="cm-pd-faq">
          <h2>Buying questions</h2>
          <div className="cm-accordion">{faqs.map((item) => <details key={item.question}><summary>{item.question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div>
        </section>
        {related.length > 0 && (
          <section className="cm-pd-related">
            <div className="cm-section-head"><h2>Related products</h2><Link className="cm-text-link" href={`/${category}`}>Browse {categoryLabel.toLowerCase()} <ArrowRight size={18} aria-hidden="true" /></Link></div>
            <div className="cm-part-grid">{related.map((item) => <ProductCard product={item} key={item.__id} />)}</div>
          </section>
        )}
      </div>
      <MobileQuoteBar whatsapp={whatsapp} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema(product, photos)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productFaqSchema(product)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productBreadcrumbSchema(product)) }} />
    </InnerPage>
  );
}
