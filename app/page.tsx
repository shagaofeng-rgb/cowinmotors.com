import Link from "next/link";
import { MissingModelForm } from "@/components/MissingModelForm";
import { SiteNav } from "@/components/SiteNav";
import { productPath, products } from "@/lib/products";
import { UI_ASSETS } from "@/lib/ui-assets";

const categories = [
  {
    category: "Automotive Lighting",
    label: "Headlights",
    href: "/headlights",
    text: "LED, DRL, projector and OE-style fitment support.",
    fallback: UI_ASSETS.headlightHero,
  },
  {
    category: "Tail Lights",
    label: "Tail Lights",
    href: "/tail-lights",
    text: "Rear lamps with connector, side and model checks.",
    fallback: UI_ASSETS.tailLightHero,
  },
  {
    category: "Exhaust Systems",
    label: "Exhaust Systems",
    href: "/exhaust",
    text: "Cat-back, axle-back, downpipe and valved systems.",
    fallback: UI_ASSETS.exhaustHero,
  },
  {
    category: "Wheels",
    label: "Wheels",
    href: "/wheels",
    text: "Alloy, forged, flow forged and fitment-focused wheels.",
    fallback: UI_ASSETS.wheelHero,
  },
  {
    category: "Body Kits",
    label: "Body Kits",
    href: "/body-kits",
    text: "Front lips, bumpers, side skirts and diffusers by request.",
    fallback: UI_ASSETS.bodyKitHero,
  },
];

const utilityItems = [
  "Global Shipping to 200+ Countries",
  "Fitment & Compatibility Support",
  "Retail & Wholesale Welcome",
  "Secure Payments",
];

const trustItems = [
  ["Fitment Support", "We help you check compatibility before ordering."],
  ["Retail-Friendly Ordering", "Flexible quantities, quote support and clear lead time."],
  ["Global Shipping", "Reliable logistics to 200+ countries worldwide."],
  ["Sourcing Beyond Listed Items", "If it is not listed, we help source or customize it."],
];

const steps = [
  ["1", "Tell us your vehicle", "Provide year, make, model and part needs."],
  ["2", "Confirm fitment", "We check compatibility and recommend options."],
  ["3", "Receive quote", "Get pricing, lead time and shipping details."],
  ["4", "Ship to your destination", "We pack, ship and keep you updated."],
];

function firstProduct(category: string) {
  return products.find((product) => product.category === category);
}

function productImage(category: string, fallback: string) {
  return fallback || firstProduct(category)?.localImage || "";
}

function featuredFor(category: (typeof categories)[number]) {
  const product = firstProduct(category.category);
  if (!product) {
    return {
      label: category.label,
      title: `${category.label} Sourcing Request`,
      image: category.fallback,
      price: "Request quote",
      href: category.href,
      quote: `/quote?product=${encodeURIComponent(`${category.label} sourcing request`)}`,
    };
  }

  return {
    label: category.label,
    title: product.title,
    image: product.localImage,
    price: product.price || "Request quote",
    href: productPath(product),
    quote: `/quote?product=${encodeURIComponent(product.title)}`,
  };
}

export default function HomePage() {
  const heroTiles = [
    categories[0],
    categories[4],
    categories[2],
    categories[3],
  ];
  const featuredProducts = categories.map(featuredFor);

  return (
    <main className="home-exact" id="home">
      <div className="home-topbar">
        <div>
          {utilityItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="home-topbar-right">
          <span>USD</span>
          <span>English</span>
        </div>
      </div>

      <header className="home-header">
        <Link className="home-logo" href="/" aria-label="Cowinmotors home">
          <img src={UI_ASSETS.logo} alt="Cowinmotors logo" />
        </Link>
        <SiteNav className="home-nav" />
        <div className="home-header-actions">
          <form className="home-search" action="/products">
            <input name="q" type="search" aria-label="Search products" placeholder="Search products" />
            <button type="submit" aria-label="Search products" />
          </form>
          <Link className="home-quote-button" href="/quote">Request Quote</Link>
        </div>
      </header>

      <section className="home-banner">
        <div className="home-banner-copy">
          <p className="home-kicker">Global automotive parts retail supply</p>
          <h1>
            Find the right headlights, tail lights, exhaust systems, wheels, and body kits <span>for your vehicle.</span>
          </h1>
          <p className="home-lead">
            Curated aftermarket parts from trusted suppliers. We help retail buyers worldwide find compatible products,
            check fitment, and place orders with confidence.
          </p>
          <div className="home-source-callout">
            <span className="home-cube" aria-hidden="true" />
            <p>Beyond the products displayed on our website, we can also source and customize parts based on your requirements.</p>
          </div>
          <div className="home-hero-actions">
            <Link className="home-button home-button-primary" href="/products">Browse Products</Link>
            <Link className="home-button home-button-light" href="/quote">Request a Quote</Link>
          </div>
        </div>
        <div className="home-banner-grid" aria-label="Main product categories">
          {heroTiles.map((item) => (
            <Link className="home-banner-tile" href={item.href} key={item.label}>
              <span>{item.label}</span>
              <img src={productImage(item.category, item.fallback)} alt={`${item.label} category`} />
            </Link>
          ))}
        </div>
      </section>

      <section className="home-fitment" id="vehicle-finder">
        <div className="home-fitment-title">
          <span aria-hidden="true" />
          <div>
            <p>Find parts that fit your vehicle</p>
            <strong>Start with year, make, model, and category.</strong>
          </div>
        </div>
        <form className="home-fitment-form" action="/products">
          <label>
            Year
            <select name="year" defaultValue="">
              <option value="">Select Year</option>
              <option>2026</option>
              <option>2025</option>
              <option>2024</option>
              <option>2023</option>
              <option>2022</option>
              <option>2021</option>
              <option>2020</option>
              <option>2019</option>
              <option>2018</option>
              <option>2017</option>
              <option>2016</option>
            </select>
          </label>
          <label>
            Make
            <select name="make" defaultValue="">
              <option value="">Select Make</option>
              <option>Audi</option>
              <option>BMW</option>
              <option>Mercedes-Benz</option>
              <option>Porsche</option>
              <option>Volkswagen</option>
              <option>Toyota</option>
              <option>Honda</option>
            </select>
          </label>
          <label>
            Model
            <input name="q" placeholder="Select Model" />
          </label>
          <label>
            Category
            <select name="category" defaultValue="">
              <option value="">Select Category</option>
              <option value="headlights">Headlights</option>
              <option value="tail-lights">Tail Lights</option>
              <option value="exhaust">Exhaust Systems</option>
              <option value="wheels">Wheels</option>
              <option value="body-kits">Body Kits</option>
            </select>
          </label>
          <button type="submit">Find Parts</button>
          <Link href="/products">Clear all selections</Link>
        </form>
      </section>

      <section className="home-trust" aria-label="Cowinmotors buyer support">
        {trustItems.map(([title, text]) => (
          <article key={title}>
            <i aria-hidden="true" />
            <strong>{title}</strong>
            <span>{text}</span>
          </article>
        ))}
      </section>

      <section className="home-block" id="categories">
        <div className="home-section-head">
          <div>
            <p className="home-kicker">Shop by category</p>
            <h2>Choose the product type you need.</h2>
          </div>
          <Link href="/products">View all categories</Link>
        </div>
        <div className="home-category-strip">
          {categories.map((item) => (
            <Link className="home-category-item" href={item.href} key={item.label}>
              <img src={productImage(item.category, item.fallback)} alt={`${item.label} product category`} />
              <strong>{item.label}</strong>
              <span>{item.text}</span>
            </Link>
          ))}
          <Link className="home-category-item" href="/quote?product=More%20Parts%20Sourcing">
            <img src={UI_ASSETS.moreParts} alt="More automotive parts sourcing" />
            <strong>More Parts</strong>
            <span>Send OE number, product photo or vehicle details for sourcing.</span>
          </Link>
        </div>
      </section>

      <section className="home-block home-featured-area" id="featured-products">
        <div className="home-section-head">
          <div>
            <p className="home-kicker">Featured products</p>
            <h2>Popular parts ready for inquiry.</h2>
          </div>
          <Link href="/products">View all products</Link>
        </div>
        <div className="home-tabs" aria-label="Featured product tabs">
          {categories.map((item) => (
            <Link href={item.href} key={item.label}>{item.label}</Link>
          ))}
        </div>
        <div className="home-featured-grid">
          {featuredProducts.map((product) => (
            <article className="home-product-card" key={product.title}>
              <span className="home-product-tag">New</span>
              <Link className="home-product-image" href={product.href}>
                <img src={product.image} alt={product.title} loading="lazy" />
              </Link>
              <div>
                <small>{product.label}</small>
                <h3>{product.title}</h3>
                <strong>{product.price}</strong>
              </div>
              <div className="home-card-actions">
                <Link href={product.quote}>Add to Inquiry</Link>
                <Link href={product.href} aria-label={`View ${product.title}`}>View</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-split" id="why-buy">
        <div className="home-how">
          <p className="home-kicker">How it works</p>
          <div className="home-step-grid">
            {steps.map(([num, title, text]) => (
              <article key={num}>
                <span>{num}</span>
                <strong>{title}</strong>
                <small>{text}</small>
              </article>
            ))}
          </div>
        </div>
        <div className="home-why">
          <p className="home-kicker">Why buy from us?</p>
          <h2>Buying support from inquiry to shipment.</h2>
          <p>
            We are a China-based automotive parts distributor and trading partner. Our team checks fitment,
            confirms product details, coordinates packaging, and supports international shipping for retail
            and wholesale buyers.
          </p>
        </div>
      </section>

      <section className="home-source-section">
        <div className="home-source-copy">
          <p className="home-kicker">Can't find what you need?</p>
          <h2>We can source it for you.</h2>
          <p>
            Send us your part details, OEM number, vehicle information or reference photos. Our team will source
            or customize it according to your requirements and provide a competitive quote.
          </p>
          <Link className="home-button home-button-primary" href="/quote?product=Sourcing%20Request">Submit a Sourcing Request</Link>
        </div>
        <div className="home-form-panel">
          <MissingModelForm />
        </div>
      </section>

      <section className="home-block home-service-block">
        <div className="home-section-head">
          <div>
            <p className="home-kicker">Retail service & logistics support</p>
            <h2>Support before and after ordering.</h2>
          </div>
        </div>
        <div className="home-service-grid-exact">
          {[
            ["Quality Inspection", "Careful inspection before packing to reduce quality risk.", UI_ASSETS.service.quality],
            ["Secure Packaging", "Strong packaging to protect parts during transit.", UI_ASSETS.service.packaging],
            ["Sourcing & Coordination", "We work with trusted suppliers and manage the process for you.", UI_ASSETS.service.sourcing],
            ["Global Shipping", "By sea, air or express to your destination country.", UI_ASSETS.service.shipping],
            ["After-Sales Support", "Responsive follow-up for order and shipping questions.", UI_ASSETS.service.afterSales],
          ].map(([title, text, image]) => (
            <article className="home-service-card-exact" key={title}>
              <img src={image} alt={`${title} support`} loading="lazy" />
              <strong>{title}</strong>
              <span>{text}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="home-help-strip">
        <div>
          <p className="home-kicker">Need help finding the right part?</p>
          <h2>Send your inquiry and our team will reply.</h2>
          <span>Quick response | Expert support | Reliable service</span>
        </div>
        <form className="home-quick-form" action="/quote">
          <label>Your Name<input name="name" placeholder="Please enter your name" required /></label>
          <label>Email<input name="email" type="email" placeholder="you@email.com" required /></label>
          <label>WhatsApp / Phone<input name="phone" placeholder="+86 176 0125 5205" required /></label>
          <label className="wide">Your Inquiry<input name="product" placeholder="Tell us what parts you need..." required /></label>
          <button type="submit">Send Inquiry</button>
        </form>
      </section>
    </main>
  );
}
