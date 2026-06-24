import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { products } from "@/lib/products";

export default function ExhaustPage() {
  return (
    <>
      <Header cta="Request quote" />
      <main>
        <section className="page-hero category-hero">
          <div>
            <p className="eyebrow">Exhaust Systems</p>
            <h1>Factory direct performance exhaust systems from USD 1,999.</h1>
            <p>Source catback, axle-back, downpipe, SS304 and titanium exhaust systems with fitment confirmation, strict QC inspection, protective packaging, and worldwide shipping support.</p>
            <div className="hero-actions">
              <a className="button primary" href="/quote?product=Exhaust%20System%20RFQ">Request exhaust quote</a>
              <a className="button secondary" href="#exhaust-products">View exhaust products</a>
            </div>
          </div>
          <img src="/assets/live/category-exhaust.png" alt="Exhaust system product" />
        </section>
        <section className="section price-band">
          <div>
            <p className="eyebrow">Unified Exhaust Pricing</p>
            <h2>All exhaust pipe listings are displayed at USD 1,999.</h2>
            <p>Final landed cost can still vary by vehicle fitment, material, shipping country, carton size, and order quantity. Use RFQ for wholesale, titanium, mixed-container, or custom requirements.</p>
          </div>
          <div className="price-callout">
            <span>Factory Direct Price</span>
            <strong>USD 1,999</strong>
            <small>Fitment and shipping confirmed before order.</small>
          </div>
        </section>
        <section className="section workshop-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Production Workshop</p>
              <h2>Welding, packing, and stocked export inventory.</h2>
              <p>Show buyers the operational side of the exhaust supply chain: fabrication workstations, packaging workflow, warehouse storage, and export-ready cartons.</p>
            </div>
          </div>
          <img src="/assets/live/exhaust-workshop.webp" alt="Exhaust production workshop, packaging area, and warehouse inventory" loading="lazy" />
        </section>
        <section className="section products-section" id="exhaust-products">
          <div className="section-title-row"><div><p className="eyebrow">Exhaust Listings</p><h2>Performance exhaust products.</h2></div></div>
          <ProductBrowser products={products} pageType="exhaust" />
        </section>
      </main>
    </>
  );
}
