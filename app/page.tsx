import Link from "next/link";
import { FinderForm } from "@/components/FinderForm";
import { Header } from "@/components/Header";
import { MissingModelForm } from "@/components/MissingModelForm";
import { ProductBrowser } from "@/components/ProductBrowser";
import { productCardData, products } from "@/lib/products";

export default function HomePage() {
  const wheelCategoryImage = products.find((product) => product.category === "Wheels")?.localImage || "/assets/live/category-exhaust.png";
  const featuredGroups = [
    {
      category: "Automotive Lighting",
      label: "Headlights",
      eyebrow: "Headlight Picks",
      title: "10 recommended headlight applications.",
      description: "Popular LED headlight assemblies and upgrade applications with vehicle fitment confirmation.",
      href: "/headlights",
    },
    {
      category: "Tail Lights",
      label: "Tail Lights",
      eyebrow: "Tail Light Picks",
      title: "10 recommended tail light applications.",
      description: "Rear lamp assemblies and sequential LED tail light upgrades for common export vehicle models.",
      href: "/tail-lights",
    },
    {
      category: "Exhaust Systems",
      label: "Exhaust Systems",
      eyebrow: "Exhaust Picks",
      title: "10 recommended exhaust system applications.",
      description: "SS304 and performance exhaust listings with material, fitment, packaging, and shipping confirmation.",
      href: "/exhaust",
    },
    {
      category: "Wheels",
      label: "Wheels",
      eyebrow: "Wheel Picks",
      title: "10 recommended wheel applications.",
      description: "Forged, flow-formed, and performance wheel listings with diameter, width, PCD, offset, finish, and fitment confirmation.",
      href: "/wheels",
    },
    {
      category: "Body Kits",
      label: "Body Kits",
      eyebrow: "Body Kit Picks",
      title: "10 recommended body kit applications.",
      description: "Exterior styling parts will be added after confirmed product images and fitment data are ready.",
      href: "/body-kits",
    },
  ]
    .map((group) => ({
      ...group,
      items: products.filter((product) => product.category === group.category).slice(0, 10),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <Header />
      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Global automotive parts supply</p>
            <h1>Find the right headlights, exhaust pipes, wheels, and body kits by vehicle.</h1>
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
            <img src={wheelCategoryImage} alt="Performance wheel product" />
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
            <h2>Shop by product category.</h2>
            <p>Start from the part type first, then narrow by vehicle model, year, fitment, side, material, and MOQ.</p>
          </div>
          <div className="category-grid">
            <Link className="category-card" href="/headlights">
              <img src="/assets/live/category-lighting.png" alt="Automotive Lighting" />
              <span>Headlights</span>
              <small>Certification, connector, LHD/RHD, DRL and turn-signal behavior.</small>
            </Link>
            <Link className="category-card" href="/tail-lights">
              <img src="/assets/catalog/tianju/id_818db2d3588f42aa806cd2c1a398ed6c.webp" alt="Automotive LED tail lights" />
              <span>Tail Lights</span>
              <small>Outer/inner rear lamps, side, OE number, connector and compliance confirmation.</small>
            </Link>
            <Link className="category-card" href="/exhaust">
              <img src="/assets/live/category-exhaust.png" alt="Exhaust Systems" />
              <span>Exhaust Systems</span>
              <small>Cat-back, axle-back, downpipe, material, sound level and compliance notes.</small>
            </Link>
            <Link className="category-card" href="/wheels">
              <img src={wheelCategoryImage} alt="Forged and performance wheels" />
              <span>Wheels</span>
              <small>Diameter, width, PCD, offset, center bore, finish, cap and fitment confirmation.</small>
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
              <h2>Recommended products by category.</h2>
              <p>Each live category highlights 10 quote-ready products. Body kits will be shown after confirmed product images and fitment data are ready.</p>
            </div>
            <Link className="catalog-link" href="/products">View all products</Link>
          </div>
          <div className="featured-category-stack">
            {featuredGroups.map((group) => (
              <section className="featured-category-panel" key={group.category} aria-labelledby={`${group.category}-featured`}>
                <div className="featured-category-head">
                  <div>
                    <p className="eyebrow">{group.eyebrow}</p>
                    <h3 id={`${group.category}-featured`}>{group.title}</h3>
                    <p>{group.description}</p>
                  </div>
                  <Link className="catalog-link" href={group.href}>
                    View {group.label}
                  </Link>
                </div>
                <ProductBrowser products={productCardData(group.items)} pageType="home" />
              </section>
            ))}
          </div>
        </section>

        <section className="section missing-model-section">
          <div>
            <p className="eyebrow">Need a specific fitment?</p>
            <h2>Submit the vehicle details for a matching solution.</h2>
            <p>
              If the exact vehicle model or part type is not listed, send the details here.
              Cowinmotors will check fitment, availability, MOQ, lead time, and shipping options.
            </p>
          </div>
          <MissingModelForm />
        </section>

        <section className="section support-columns process-section">
          <div>
            <p className="eyebrow">Custom RFQ</p>
            <h2>Custom fitment, packaging, and shipping are confirmed before quotation.</h2>
            <p>
              For body kits, mixed-supplier orders, special finishes, and bulk shipments, Cowinmotors confirms the vehicle data, product photos, packaging method, carton size, and destination before final quotation.
            </p>
          </div>
          <div className="process-media-grid">
            <article className="process-card">
              <img src="/assets/live/category-body-kits.png" alt="Body kit exterior styling parts for custom RFQ" loading="lazy" />
              <div>
                <h3>Custom fitment confirmation</h3>
                <p>Send year, make, model, trim, body type, side, finish, paint requirement, and sample or wholesale quantity.</p>
              </div>
            </article>
            <article className="process-card">
              <img src="/assets/live/exhaust-workshop.webp" alt="Automotive parts packing area and export inventory" loading="lazy" />
              <div>
                <h3>Packing and export shipping</h3>
                <p>Carton size, protective packaging, lead time, destination country, and shipping method are checked before payment.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="section company-section">
          <div className="company-copy">
            <p className="eyebrow">Export Support</p>
            <h2>Sourcing, inspection, packaging, and shipment coordination.</h2>
            <p>
              Cowinmotors supports overseas buyers with supplier coordination, product checks, sample handling,
              packaging confirmation, OEM/ODM communication, export documentation, and responsive after-sales follow-up.
            </p>
          </div>
          <img src="/assets/live/exhaust-workshop.webp" alt="Export-ready automotive parts workshop and packing support" loading="lazy" />
        </section>
      </main>
    </>
  );
}
