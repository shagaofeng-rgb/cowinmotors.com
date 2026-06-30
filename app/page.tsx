import Link from "next/link";
import { FinderForm } from "@/components/FinderForm";
import { Header } from "@/components/Header";
import { MissingModelForm } from "@/components/MissingModelForm";
import { ProductBrowser } from "@/components/ProductBrowser";
import { productCardData, products } from "@/lib/products";

export default function HomePage() {
  const featuredProducts = products
    .filter((product) => ["Automotive Lighting", "Tail Lights", "Exhaust Systems"].includes(product.category))
    .slice(0, 24);

  return (
    <>
      <Header />
      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Global automotive parts supply</p>
            <h1>Find the right headlights, exhaust pipes, and body kits by vehicle.</h1>
            <p>
              Cowinmotors is a China-based trading and export partner for stocked and quote-only aftermarket
              parts. We help buyers confirm compatibility, MOQ, lead time, packaging, shipping, and QC before
              ordering.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/products">
                Check compatibility
              </Link>
              <Link className="button secondary" href="/quote">
                Request wholesale quote
              </Link>
            </div>
          </div>
          <div className="hero-gallery" aria-label="Main product categories">
            <img src="/assets/live/category-lighting.png" alt="Automotive lighting headlight upgrade" />
            <img src="/assets/live/category-body-kits.png" alt="Body kit exterior styling parts" />
            <img src="/assets/live/category-exhaust.png" alt="Exhaust pipe system" />
          </div>
        </section>

        <section className="vehicle-finder" id="vehicle-finder">
          <div className="finder-copy">
            <p className="eyebrow">Shop by Vehicle</p>
            <h2>Start with year, make, model, and part type.</h2>
            <p>Please confirm trim, body type, engine, and LHD/RHD where relevant before ordering.</p>
          </div>
          <FinderForm />
        </section>

        <section className="trust-strip" aria-label="Trust signals">
          <div><strong>Fitment first</strong><span>Year / make / model / trim confirmation before order.</span></div>
          <div><strong>Two-lane buying</strong><span>Direct purchase for stocked items, RFQ for bulky or custom orders.</span></div>
          <div><strong>QC inspection</strong><span>Trading/export partner with product and packaging checks.</span></div>
          <div><strong>Global shipping</strong><span>Customs, tax, duty, lead time, and shipping method notes.</span></div>
        </section>

        <section className="section" id="categories">
          <div className="section-heading">
            <p className="eyebrow">Primary Categories</p>
            <h2>Clean catalog entry points.</h2>
            <p>Each category is built around compatibility, product specs, support documents, and clear buying path.</p>
          </div>
          <div className="category-grid">
            <Link className="category-card" href="/headlights">
              <img src="/assets/live/category-lighting.png" alt="Automotive Lighting" />
              <span>Headlights</span>
              <small>Certification, connector, LHD/RHD, DRL and turn-signal behavior.</small>
            </Link>
            <Link className="category-card" href="/tail-lights">
              <img src="/assets/live/category-lighting.png" alt="Automotive tail lights" />
              <span>Tail Lights</span>
              <small>Outer/inner rear lamps, side, OE number, connector and compliance confirmation.</small>
            </Link>
            <Link className="category-card" href="/exhaust">
              <img src="/assets/live/category-exhaust.png" alt="Exhaust Systems" />
              <span>Exhaust Pipes</span>
              <small>Cat-back, axle-back, downpipe, material, sound level and compliance notes.</small>
            </Link>
            <Link className="category-card" href="/products?category=oem-parts">
              <img src="/assets/live/logo.jpg" alt="OEM automotive replacement parts" />
              <span>OEM Parts</span>
              <small>Search factory part numbers for BMW and Mercedes-Benz replacement parts.</small>
            </Link>
            <Link className="category-card" href="/body-kits">
              <img src="/assets/live/category-body-kits.png" alt="Body Kits" />
              <span>Body Kits</span>
              <small>Paint requirement, drilling requirement, shipping class and quote flow.</small>
            </Link>
          </div>
        </section>

        <section className="section products-section" id="products">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Featured Products</p>
              <h2>Featured stocked and quote-ready products.</h2>
              <p>Homepage only shows representative SKUs. Keep the full catalog on product pages.</p>
            </div>
            <Link className="catalog-link" href="/products">View all products</Link>
          </div>
          <ProductBrowser products={productCardData(featuredProducts)} pageType="home" limit={8} />
        </section>

        <section className="section missing-model-section">
          <div>
            <p className="eyebrow">Can not find your model?</p>
            <h2>Tell us what you need. We will contact you with a solution.</h2>
            <p>
              If the exact vehicle model or part type is not listed on our website, submit the details here.
              Our team will check fitment, supplier availability, MOQ, lead time, and shipping options for you.
            </p>
          </div>
          <MissingModelForm />
        </section>

        <section className="section support-columns">
          <div>
            <p className="eyebrow">Quote-only logic</p>
            <h2>Body kits need fitment and shipping confirmation.</h2>
            <p>
              Oversized, paint-required, custom-finish, or mixed-supplier orders should use RFQ instead of a normal cart.
            </p>
          </div>
          <div className="support-card">
            <h3>Body kit RFQ fields</h3>
            <ul>
              <li>Vehicle year, make, model, trim and body type</li>
              <li>Front / rear / side / full kit requirement</li>
              <li>Material, finish, paint requirement and drilling requirement</li>
              <li>Destination country, quantity, carton size and shipping method</li>
            </ul>
          </div>
        </section>

        <section className="section company-section">
          <div>
            <p className="eyebrow">Company Role</p>
            <h2>Transparent trading and export partner.</h2>
          </div>
          <p>
            Cowinmotors should avoid vague factory claims unless factory-owned evidence is provided. The stronger trust
            position is clear: supplier sourcing, QC inspection, packaging support, sample coordination, OEM/ODM options,
            export handling, and responsive after-sales communication.
          </p>
        </section>
      </main>
    </>
  );
}
