import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { filterProducts, paginateProducts, productCardData } from "@/lib/products";

export const metadata = {
  title: "Performance Exhaust Systems and Downpipes",
  description:
    "Browse SS304 performance exhaust systems, catback exhausts, downpipes, and replacement exhaust products with RFQ support.",
};

export default async function ExhaustPage({
  searchParams,
}: {
  searchParams: Promise<{ make?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const paged = paginateProducts(filterProducts({ category: "exhaust", brand: params.make || "", query: params.q || "" }), Number(params.page || 1), 25);

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
              <p>Production and packing support covers fabrication workstations, warehouse storage, protective packaging, and export-ready cartons.</p>
            </div>
          </div>
          <img src="/assets/live/exhaust-workshop.webp" alt="Exhaust production workshop, packaging area, and warehouse inventory" loading="lazy" />
        </section>
        <section className="section products-section" id="exhaust-products">
          <div className="section-title-row"><div><p className="eyebrow">Exhaust Listings</p><h2>Performance exhaust products.</h2></div></div>
          <ProductBrowser
            products={productCardData(paged.items)}
            pageType="exhaust"
            initialBrand={params.make || "all"}
            initialCategory="exhaust"
            initialSearch={params.q || ""}
            totalCount={paged.total}
            currentPage={paged.currentPage}
            totalPages={paged.totalPages}
            basePath="/exhaust"
          />
        </section>
      </main>
    </>
  );
}
