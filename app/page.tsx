import Link from "next/link";
import { FinderForm } from "@/components/FinderForm";
import { Header } from "@/components/Header";
import { MissingModelForm } from "@/components/MissingModelForm";
import { productPath, products } from "@/lib/products";

const categoryMeta = [
  {
    category: "Automotive Lighting",
    label: "Headlights",
    href: "/headlights",
    summary: "Connector, LHD/RHD, DRL, beam pattern and fitment check.",
    fallback: "/assets/live/category-lighting.png",
  },
  {
    category: "Tail Lights",
    label: "Tail Lights",
    href: "/tail-lights",
    summary: "Rear lamp side, OE number, connector and compliance check.",
    fallback: "/assets/catalog/tianju/id_818db2d3588f42aa806cd2c1a398ed6c.webp",
  },
  {
    category: "Exhaust Systems",
    label: "Exhaust Systems",
    href: "/exhaust",
    summary: "Cat-back, axle-back, downpipe, material and sound level notes.",
    fallback: "/assets/live/category-exhaust.png",
  },
  {
    category: "Wheels",
    label: "Wheels",
    href: "/wheels",
    summary: "Diameter, width, PCD, offset, center bore and finish check.",
    fallback: "/assets/live/category-exhaust.png",
  },
  {
    category: "Body Kits",
    label: "Body Kits",
    href: "/body-kits",
    summary: "Front lip, bumper, side skirt, diffuser, packing and shipping quote.",
    fallback: "/assets/live/category-body-kits.png",
  },
];

function firstProduct(category: string) {
  return products.find((product) => product.category === category);
}

function imageFor(category: string, fallback: string) {
  return firstProduct(category)?.localImage || fallback;
}

export default function HomePage() {
  const heroTiles = categoryMeta.filter((item) => item.label !== "Tail Lights").slice(0, 4);
  const featured = categoryMeta.slice(0, 5).map((item) => {
    const product = firstProduct(item.category);
    return {
      label: item.label,
      title: product?.title || `${item.label} custom sourcing request`,
      image: product?.localImage || item.fallback,
      price: product?.price || "Request quote",
      href: product ? productPath(product) : item.href,
      quote: `/quote?product=${encodeURIComponent(product?.title || `${item.label} sourcing request`)}`,
    };
  });

  return (
    <>
      <Header />
      <main id="home" className="home-redesign">
        <section className="home-hero">
          <div className="home-hero-copy">
            <p className="eyebrow">Global automotive parts supply</p>
            <h1>
              Find the right headlights, exhaust pipes, wheels, and body kits <span>by vehicle.</span>
            </h1>
            <p>
              Cowinmotors is a China-based trading and export partner for stocked and quote-only aftermarket parts.
              We help buyers confirm compatibility, MOQ, lead time, packaging, shipping, and QC before ordering.
            </p>
            <div className="home-sourcing-note">
              <span aria-hidden="true">□</span>
              <p>Beyond the products displayed on our website, we can also source and customize parts based on your requirements.</p>
            </div>
            <div className="hero-actions">
              <Link className="button primary" href="#vehicle-finder">Check compatibility</Link>
              <Link className="button secondary" href="/quote">Request wholesale quote</Link>
            </div>
          </div>
          <div className="home-hero-grid" aria-label="Main product categories">
            {heroTiles.map((item) => (
              <Link className="home-hero-tile" href={item.href} key={item.label}>
                <span>{item.label}</span>
                <img src={imageFor(item.category, item.fallback)} alt={`${item.label} product`} />
              </Link>
            ))}
          </div>
        </section>

        <section className="home-finder-shell" id="vehicle-finder">
          <div className="home-section-label">
            <span aria-hidden="true">▣</span>
            <div>
              <p className="eyebrow">Find parts that fit your vehicle</p>
              <h2>Start with fitment details.</h2>
            </div>
          </div>
          <FinderForm />
        </section>

        <section className="home-trust-grid" aria-label="Buying support">
          {[
            ["Fitment Support", "We help check compatibility before order."],
            ["Retail-Friendly Ordering", "Flexible quantities, quote support, and clear lead time."],
            ["Global Shipping", "Logistics support to 200+ countries and regions."],
            ["Sourcing Beyond Listed Items", "Send a request when the part is not listed."],
          ].map(([title, text]) => (
            <article key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </article>
          ))}
        </section>

        <section className="home-section home-categories" id="categories">
          <div className="home-title-row">
            <div>
              <p className="eyebrow">Shop by category</p>
              <h2>Product category entry points.</h2>
            </div>
            <Link className="home-inline-link" href="/products">View all categories</Link>
          </div>
          <div className="home-category-row">
            {categoryMeta.map((item) => (
              <Link className="home-category-card" href={item.href} key={item.label}>
                <img src={imageFor(item.category, item.fallback)} alt={`${item.label} category`} />
                <strong>{item.label}</strong>
                <span>{item.summary}</span>
              </Link>
            ))}
            <Link className="home-category-card more-card" href="/quote?product=More%20Parts%20Sourcing">
              <img src="/assets/live/exhaust-workshop.webp" alt="More automotive parts sourcing" />
              <strong>More Parts</strong>
              <span>Send part name, OE number, photos or vehicle data for sourcing.</span>
            </Link>
          </div>
        </section>

        <section className="home-section home-featured" id="featured-products">
          <div className="home-title-row">
            <div>
              <p className="eyebrow">Featured products</p>
              <h2>Quote-ready product picks.</h2>
            </div>
            <Link className="home-inline-link" href="/products">View all products</Link>
          </div>
          <div className="home-product-row">
            {featured.map((product) => (
              <article className="home-feature-card" key={product.title}>
                <span className="badge">RFQ</span>
                <Link className="image-wrap" href={product.href}>
                  <img src={product.image} alt={product.title} loading="lazy" />
                </Link>
                <div className="product-info">
                  <small>{product.label}</small>
                  <h3>{product.title}</h3>
                  <div className="price-row"><span className="price">{product.price}</span></div>
                  <div className="product-actions">
                    <Link className="product-link" href={product.href}>View details</Link>
                    <Link className="quote-link" href={product.quote}>Add to inquiry</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section home-process-buy">
          <div className="home-how-card">
            <p className="eyebrow">How it works</p>
            <div className="home-steps">
              {[
                ["1", "Tell us your vehicle", "Provide year, make, model and part needs."],
                ["2", "Confirm fitment", "We check compatibility and recommended options."],
                ["3", "Receive quote", "Get pricing, lead time and shipping details."],
                ["4", "Ship to destination", "We pack, ship and keep you updated."],
              ].map(([num, title, text]) => (
                <article key={num}>
                  <span>{num}</span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </article>
              ))}
            </div>
          </div>
          <div className="home-why-card">
            <p className="eyebrow">Why buy from us?</p>
            <h2>China sourcing support for retail and wholesale buyers.</h2>
            <p>
              We coordinate with trusted suppliers, confirm fitment information, check product photos, and support packaging,
              export documentation, and after-sales follow-up for international orders.
            </p>
          </div>
        </section>

        <section className="home-section home-sourcing-form">
          <div>
            <p className="eyebrow">Can't find what you need?</p>
            <h2>We can source it for you.</h2>
            <p>
              Send us your part details, OEM number or reference photos. Our team will source or customize it according
              to your requirements and provide a competitive quote.
            </p>
            <Link className="button primary" href="/quote?product=Sourcing%20Request">Submit a sourcing request</Link>
          </div>
          <MissingModelForm />
        </section>

        <section className="home-section home-service">
          <div className="home-title-row">
            <div>
              <p className="eyebrow">Retail service and logistics support</p>
              <h2>From product check to export shipment.</h2>
            </div>
          </div>
          <div className="home-service-grid">
            {[
              ["Quality Inspection", "Careful inspection before packing to reduce quality risk.", imageFor("Automotive Lighting", "/assets/live/category-lighting.png")],
              ["Secure Packaging", "Strong packaging to protect parts during transit.", "/assets/live/exhaust-workshop.webp"],
              ["Sourcing Coordination", "We work with suppliers and manage the process for you.", "/assets/live/exhaust-workshop.webp"],
              ["Global Shipping", "By sea, air or express to your destination country.", "/assets/live/exhaust-workshop.webp"],
              ["After-Sales Support", "Responsive follow-up for order and shipping questions.", "/assets/live/logo.jpg"],
            ].map(([title, text, image]) => (
              <article className="home-service-card" key={title}>
                <img src={image} alt={`${title} support`} />
                <strong>{title}</strong>
                <span>{text}</span>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
