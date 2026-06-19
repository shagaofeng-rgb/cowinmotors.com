import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { products } from "@/lib/products";

export default function HeadlightsPage() {
  return (
    <>
      <Header announcement="Headlights require fitment, connector, LHD/RHD and certification confirmation." cta="Request quote" />
      <main>
        <section className="page-hero category-hero">
          <div>
            <p className="eyebrow">Automotive Lighting</p>
            <h1>LED headlights by vehicle fitment.</h1>
            <p>Confirm year, trim, LHD/RHD, connector style, DRL behavior, dynamic turn signal, housing color, and compliance before order.</p>
          </div>
          <img src="/assets/live/category-lighting.png" alt="Automotive lighting product" />
        </section>
        <section className="section products-section">
          <div className="section-title-row"><div><p className="eyebrow">Headlight Listings</p><h2>Lighting products.</h2></div></div>
          <ProductBrowser products={products} pageType="headlights" />
        </section>
      </main>
    </>
  );
}
