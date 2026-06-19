import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { products } from "@/lib/products";

export default function ExhaustPage() {
  return (
    <>
      <Header announcement="Exhaust orders should confirm material, pipe diameter, sound level, emissions and fitment." cta="Request quote" />
      <main>
        <section className="page-hero category-hero">
          <div>
            <p className="eyebrow">Exhaust Systems</p>
            <h1>Catback, axle-back, downpipe, SS304 and titanium options.</h1>
            <p>Use the catalog to review BMW, Audi, Mercedes-Benz, Porsche, Nissan, Toyota, Chevrolet, Ford and Maserati exhaust listings.</p>
          </div>
          <img src="/assets/live/category-exhaust.png" alt="Exhaust system product" />
        </section>
        <section className="section products-section">
          <div className="section-title-row"><div><p className="eyebrow">Exhaust Listings</p><h2>Performance exhaust products.</h2></div></div>
          <ProductBrowser products={products} pageType="exhaust" />
        </section>
      </main>
    </>
  );
}
