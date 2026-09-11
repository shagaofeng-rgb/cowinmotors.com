import Link from "next/link";
import { MissingModelForm } from "@/components/MissingModelForm";
import { SiteNav } from "@/components/SiteNav";
import { getPublishedBlogPosts } from "@/lib/blog";
import { getPublishedNews } from "@/lib/news";
import { productPath, products, type Product } from "@/lib/products";
import { UI_ASSETS } from "@/lib/ui-assets";

const categories = [
  { category: "Automotive Lighting", label: "Headlights", href: "/headlights", description: "LED, DRL, projector and OE-style fitment support.", fallback: UI_ASSETS.headlightHero },
  { category: "Tail Lights", label: "Tail Lights", href: "/tail-lights", description: "Rear lamps with connector, side and model checks.", fallback: UI_ASSETS.tailLightHero },
  { category: "Exhaust Systems", label: "Exhaust Systems", href: "/exhaust", description: "Cat-back, axle-back, downpipe and valved systems.", fallback: UI_ASSETS.exhaustHero },
  { category: "Wheels", label: "Forged Wheels", href: "/wheels", description: "Automotive forged wheel inquiries with fitment-focused specs.", fallback: UI_ASSETS.wheelHero },
  { category: "Body Kits", label: "Body Kits", href: "/body-kits", description: "Front lips, bumpers, side skirts and diffusers by request.", fallback: UI_ASSETS.bodyKitHero },
];

const utilityItems = ["Global Shipping Coordination", "Fitment & Compatibility Support", "Retail & Wholesale Inquiry"];
const supportItems = [
  ["Fitment Confirmation", "Check year, model, market version and configuration before ordering."],
  ["Packaging Review", "Review packaging requirements for the product and destination."],
  ["Pre-Shipment QC Coordination", "Coordinate product checks before shipment where applicable."],
  ["Shipping Coordination", "Discuss shipping options and export documentation requirements."],
];
const sourcingSteps = [
  ["01", "Share the part need", "Send a vehicle, OE number, SKU or product photo."],
  ["02", "Confirm fitment", "Review vehicle details and product configuration."],
  ["03", "Review the quotation", "Confirm the selected parts, quantity and requirements."],
  ["04", "Coordinate delivery", "Arrange packaging and shipping after confirmation."],
];

function firstProduct(category: string) {
  return products.find((product) => product.category === category);
}

function productImage(category: string, fallback: string) {
  return firstProduct(category)?.localImage || fallback;
}

function productDetails(product: Product) {
  return [product.brand, product.model, product.yearRange].filter(Boolean).join(" | ") || "Vehicle compatibility available on request";
}

function productReference(product: Product) {
  const reference = product.partNumbers?.find((value) => value && !/^(?:n\/a|na|unknown|sjc)$/i.test(value.trim()));
  return reference ? `Reference: ${reference}` : "Send vehicle details to confirm fitment";
}

export default async function HomePage() {
  const heroProduct = firstProduct("Automotive Lighting");
  const featuredProducts = categories.map((category) => firstProduct(category.category)).filter((product): product is Product => Boolean(product));
  const [guideResult, newsResult] = await Promise.allSettled([
    getPublishedBlogPosts({ limit: 2 }),
    getPublishedNews({ limit: 1 }),
  ]);
  const guides = guideResult.status === "fulfilled" ? guideResult.value : [];
  const news = newsResult.status === "fulfilled" ? newsResult.value : [];
  const resources = [
    ...guides.map((article) => ({ label: "Buyer Guide", title: article.title, image: article.coverImageUrl, href: `/blog/${article.slug}`, alt: article.coverImageAlt || article.title })),
    ...news.map((article) => ({ label: "News & Insights", title: article.title, image: article.coverImageUrl, href: `/news/${article.slug}`, alt: article.coverImageAlt || article.title })),
  ].slice(0, 3);

  return (
    <main className="home-exact home-catalog" id="home">
      <div className="home-catalog-topbar"><div>{utilityItems.map((item) => <span key={item}>{item}</span>)}</div><div><span>USD</span><span>English</span></div></div>

      <header className="home-catalog-header">
        <Link className="home-catalog-logo" href="/" aria-label="Cowinmotors home"><img src={UI_ASSETS.logo} alt="Cowinmotors Automotive Parts" /><span>Cowinmotors<small>Automotive Parts</small></span></Link>
        <SiteNav className="home-catalog-nav" />
        <div className="home-catalog-actions"><form action="/products" className="home-catalog-search"><input name="q" type="search" aria-label="Search by keyword, OE number or part name" placeholder="Search product or OE number" /><button type="submit">Search</button></form><Link className="catalog-primary-action" href="/quote">Request Quote</Link></div>
      </header>

      <section className="catalog-hero" aria-labelledby="catalog-home-title">
        <div className="catalog-hero-copy">
          <p className="catalog-eyebrow">China-Based Automotive Parts Sourcing &amp; Export Partner</p>
          <h1 id="catalog-home-title">Your reliable partner in automotive parts.</h1>
          <p className="catalog-hero-lead">Find catalog products by vehicle, send an OE number or product photo, and confirm the details needed for your inquiry.</p>
          <div className="catalog-hero-actions"><Link className="catalog-primary-action" href="#vehicle-finder">Check Fitment</Link><Link className="catalog-secondary-action" href="/quote">Request a Quote</Link></div>
          <div className="catalog-hero-notes" aria-label="Buyer support highlights"><span>Catalog Products</span><span>Fitment Review</span><span>Export Coordination</span></div>
        </div>
        <div className="catalog-hero-visual">
          <div className="catalog-hero-product"><span>Featured category</span><img src={heroProduct?.localImage || UI_ASSETS.headlightHero} alt="Headlight assembly from the Cowinmotors catalog" /><strong>Headlights</strong></div>
          <div className="catalog-hero-index" aria-label="Browse product categories">
            {categories.map((category) => <Link href={category.href} key={category.label}><img src={productImage(category.category, category.fallback)} alt="" /><span><strong>{category.label}</strong><small>{category.description}</small></span><b aria-hidden="true">&gt;</b></Link>)}
          </div>
        </div>
      </section>

      <section className="catalog-finder" id="vehicle-finder" aria-labelledby="finder-title">
        <div><p className="catalog-eyebrow">Start with your vehicle</p><h2 id="finder-title">Find compatible parts faster.</h2></div>
        <form action="/products" className="catalog-finder-form">
          <label><span>Year</span><select name="year" defaultValue=""><option value="">Select Year</option>{[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016].map((year) => <option key={year}>{year}</option>)}</select></label>
          <label><span>Make</span><select name="make" defaultValue=""><option value="">Select Make</option>{["Audi", "BMW", "Mercedes-Benz", "Porsche", "Volkswagen", "Toyota", "Honda"].map((make) => <option key={make}>{make}</option>)}</select></label>
          <label><span>Model</span><input name="q" placeholder="Model or platform" /></label>
          <label><span>Category</span><select name="category" defaultValue=""><option value="">All Categories</option><option value="headlights">Headlights</option><option value="tail-lights">Tail Lights</option><option value="exhaust">Exhaust Systems</option><option value="wheels">Forged Wheels</option><option value="body-kits">Body Kits</option></select></label>
          <button type="submit">Search Catalog</button><Link href="/fitment-check">Get sourcing assistance</Link>
        </form>
      </section>

      <section className="catalog-browse" aria-labelledby="browse-title">
        <aside className="catalog-category-nav"><p className="catalog-eyebrow">Browse the catalog</p><h2 id="browse-title">Start by category.</h2><p>Explore product types or send the details of a part you cannot find online.</p><nav aria-label="Product category links">{categories.map((category) => <Link href={category.href} key={category.label}>{category.label}<span>&gt;</span></Link>)}</nav><Link className="catalog-text-link" href="/products">View all products &gt;</Link></aside>
        <div className="catalog-product-showcase">
          <div className="catalog-section-heading"><div><p className="catalog-eyebrow">Catalog selection</p><h2>Featured products</h2></div><Link className="catalog-text-link" href="/products">View all products &gt;</Link></div>
          <div className="catalog-product-grid">
            {featuredProducts.map((product) => <article className="catalog-product-card" key={product.__id}><Link className="catalog-product-image" href={productPath(product)}><img src={product.localImage} alt={product.title} loading="lazy" /></Link><div className="catalog-product-copy"><p>{product.category.includes("Wheel") ? "Forged Wheels" : product.category}</p><h3><Link href={productPath(product)}>{product.title}</Link></h3><span>{productDetails(product)}</span><small>{productReference(product)}</small></div><div className="catalog-product-actions"><Link href={productPath(product)}>View details</Link><Link href={`${productPath(product)}#product-inquiry`}>Inquiry</Link></div></article>)}
          </div>
          <div className="catalog-category-tiles">{categories.slice(1).map((category) => <Link href={category.href} key={category.label}><img src={productImage(category.category, category.fallback)} alt={`${category.label} catalog`} loading="lazy" /><span>{category.label}<small>View products &gt;</small></span></Link>)}</div>
        </div>
      </section>

      <section className="catalog-support-strip" aria-label="Cowinmotors sourcing support">{supportItems.map(([title, description]) => <article key={title}><strong>{title}</strong><span>{description}</span></article>)}</section>

      <section className="catalog-sourcing" aria-labelledby="sourcing-title"><div className="catalog-sourcing-intro"><p className="catalog-eyebrow">From inquiry to delivery</p><h2 id="sourcing-title">A clear sourcing process for every request.</h2><p>Use the details you already have. We will review the part, vehicle information and destination requirements with you.</p><Link className="catalog-secondary-action" href="/wholesale-auto-parts-sourcing">How sourcing works</Link></div><div className="catalog-step-list">{sourcingSteps.map(([number, title, description]) => <article key={number}><span>{number}</span><div><strong>{title}</strong><p>{description}</p></div></article>)}</div></section>

      <section className="catalog-rfq" aria-labelledby="rfq-title"><div className="catalog-rfq-media"><img src={UI_ASSETS.service.packaging} alt="Automotive parts export packaging support" loading="lazy" /><div><p className="catalog-eyebrow">Quote by OE number or product photo</p><h2 id="rfq-title">Tell us what you are sourcing.</h2><p>Share a product URL, reference, vehicle details or photos so the inquiry can be reviewed accurately.</p></div></div><div className="catalog-rfq-form"><MissingModelForm /></div></section>

      <section className="catalog-resources" aria-labelledby="resources-title"><div className="catalog-section-heading"><div><p className="catalog-eyebrow">Buyer Guides &amp; Industry News</p><h2 id="resources-title">Useful information for confident sourcing.</h2></div><div className="catalog-resource-links"><Link href="/blog">Buyer Guides &gt;</Link><Link href="/news">News &amp; Insights &gt;</Link></div></div>{resources.length ? <div className="catalog-resource-grid">{resources.map((resource) => <Link href={resource.href} key={resource.href} className="catalog-resource-card"><img src={resource.image} alt={resource.alt} loading="lazy" /><span><small>{resource.label}</small><strong>{resource.title}</strong><b>Read more &gt;</b></span></Link>)}</div> : <div className="catalog-resources-empty"><p>Browse practical sourcing guidance and current automotive parts insights.</p><Link className="catalog-secondary-action" href="/blog">Explore Buyer Guides</Link></div>}</section>
    </main>
  );
}
