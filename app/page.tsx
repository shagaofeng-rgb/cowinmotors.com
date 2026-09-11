import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { getPublishedBlogPosts } from "@/lib/blog";
import { getPublishedNews } from "@/lib/news";
import { productPath, products, type Product } from "@/lib/products";
import { UI_ASSETS } from "@/lib/ui-assets";

const categories = [
  { category: "Automotive Lighting", label: "Headlights", href: "/headlights", short: "Lighting the road ahead.", fallback: UI_ASSETS.headlightHero, icon: "/assets/ui/shared/icons-png/headlight.png" },
  { category: "Tail Lights", label: "Tail Lights", href: "/tail-lights", short: "Safety in every journey.", fallback: UI_ASSETS.tailLightHero, icon: "/assets/ui/shared/icons-png/tail-light.png" },
  { category: "Exhaust Systems", label: "Exhaust Systems", href: "/exhaust", short: "Performance without limits.", fallback: UI_ASSETS.exhaustHero, icon: "/assets/ui/shared/icons-png/exhaust.png" },
  { category: "Wheels", label: "Forged Wheels", href: "/wheels", short: "Stronger. Lighter. Further.", fallback: UI_ASSETS.wheelHero, icon: "/assets/ui/shared/icons-png/wheel.png" },
  { category: "Body Kits", label: "Body Kits", href: "/body-kits", short: "Bold style. Perfect fit.", fallback: UI_ASSETS.bodyKitHero, icon: "/assets/ui/shared/icons-png/body-kit.png" },
];

const supportItems = [
  ["Fitment Confirmation", "We verify compatibility before sourcing.", "/assets/ui/pages/headlights/icons/fitment-support_on-dark.png"],
  ["Packaging Review", "Export-ready packaging is reviewed with you.", "/assets/ui/pages/body-kits/icons/packaging_on-dark.png"],
  ["Pre-shipment QC Coordination", "Coordinate product checks before shipment.", "/assets/ui/pages/tail-lights/icons/qc-inspection_on-dark.png"],
  ["Shipping Coordination", "Discuss delivery options worldwide.", "/assets/ui/pages/wheels/icons/global-shipping_on-dark.png"],
];

function productsFor(category: string, count = 1) {
  return products.filter((product) => product.category === category).slice(0, count);
}

function productImage(category: string, fallback: string) {
  return productsFor(category)[0]?.localImage || fallback;
}

function productDetails(product: Product) {
  return [product.brand, product.model, product.yearRange].filter(Boolean).join(" | ") || "Vehicle compatibility available on request";
}

function productReference(product: Product) {
  const reference = product.partNumbers?.find((value) => value && !/^(?:n\/a|na|unknown|sjc)$/i.test(value.trim()));
  return reference ? `OE: ${reference}` : "Fitment check available";
}

export default async function HomePage() {
  const featuredHeadlights = productsFor("Automotive Lighting", 4);
  const [guideResult, newsResult] = await Promise.allSettled([
    getPublishedBlogPosts({ limit: 2 }),
    getPublishedNews({ limit: 1 }),
  ]);
  const guides = guideResult.status === "fulfilled" ? guideResult.value : [];
  const news = newsResult.status === "fulfilled" ? newsResult.value : [];
  const resources = [
    ...guides.map((article) => ({ label: "Buyer Guide", title: article.title, image: article.coverImageUrl, href: `/blog/${article.slug}`, alt: article.coverImageAlt || article.title })),
    ...news.map((article) => ({ label: "Industry News", title: article.title, image: article.coverImageUrl, href: `/news/${article.slug}`, alt: article.coverImageAlt || article.title })),
  ].slice(0, 3);

  return (
    <main className="home-exact home-catalog home-catalog-template" id="home">
      <div className="home-catalog-topbar">
        <span>Global Parts. Stronger Partnerships.</span>
        <div><span>English</span><Link href="/contact">Contact Us</Link><Link href="/quote">For Business Buyers</Link></div>
      </div>

      <header className="home-catalog-header">
        <Link className="home-catalog-logo" href="/" aria-label="Cowinmotors home"><img src={UI_ASSETS.logo} alt="Cowinmotors Automotive Parts" /><span>Cowin<span>motors</span><small>Automotive Parts</small></span></Link>
        <SiteNav className="home-catalog-nav" catalogMode />
        <div className="home-catalog-actions"><form action="/products" className="home-catalog-search"><input name="q" type="search" aria-label="Search by keyword, OE number or part name" placeholder="Search by keyword, OE number, or part name..." /><button type="submit" aria-label="Search catalog">Search</button></form><Link className="catalog-primary-action" href="/quote">Request a Quote</Link></div>
      </header>

      <section className="catalog-hero" aria-labelledby="catalog-home-title">
        <img className="catalog-hero-backdrop" src="/assets/ui/generated/catalog-hero-vehicle.png" alt="" aria-hidden="true" />
        <div className="catalog-hero-copy">
          <p className="catalog-eyebrow">Sourcing Today. Driving Tomorrow.</p>
          <h1 id="catalog-home-title">Your Reliable Partner in Automotive Parts</h1>
          <strong className="catalog-hero-kicker">Quality parts. Global supply. Real business results.</strong>
          <p className="catalog-hero-lead">Cowinmotors sources and exports automotive parts for global distributors, wholesalers and repair professionals.</p>
          <div className="catalog-hero-actions"><Link className="catalog-primary-action" href="/products">Browse Products <span aria-hidden="true">&rarr;</span></Link><Link className="catalog-secondary-action" href="/quote">Request a Quote</Link></div>
          <div className="catalog-hero-notes" aria-label="Buyer support highlights"><span>Wide Product Range</span><span>Export Expertise</span><span>Responsive Support</span></div>
        </div>
        <nav className="catalog-hero-index" aria-label="Browse product categories">
          {categories.map((category) => <Link href={category.href} key={category.label}><img src={productImage(category.category, category.fallback)} alt="" /><span><strong>{category.label}</strong><small>{category.short}</small></span><b aria-hidden="true">&rsaquo;</b></Link>)}
        </nav>
      </section>

      <section className="catalog-finder" id="vehicle-finder" aria-labelledby="finder-title">
        <div><h2 id="finder-title">Start with your vehicle</h2><p>Find the right parts faster with vehicle fitment.</p></div>
        <form action="/products" className="catalog-finder-form">
          <label><span>Year</span><select name="year" defaultValue=""><option value="">Select Year</option>{[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016].map((year) => <option key={year}>{year}</option>)}</select></label>
          <label><span>Make</span><select name="make" defaultValue=""><option value="">Select Make</option>{["Audi", "BMW", "Mercedes-Benz", "Porsche", "Volkswagen", "Toyota", "Honda"].map((make) => <option key={make}>{make}</option>)}</select></label>
          <label><span>Model</span><input name="q" placeholder="Select Model" /></label>
          <label><span>Category</span><select name="category" defaultValue=""><option value="">All Categories</option><option value="headlights">Headlights</option><option value="tail-lights">Tail Lights</option><option value="exhaust">Exhaust Systems</option><option value="wheels">Forged Wheels</option><option value="body-kits">Body Kits</option></select></label>
          <button type="submit">Search Parts</button><Link href="/fitment-check">Get Sourcing Assistance</Link>
        </form>
      </section>

      <section className="catalog-browse" aria-labelledby="browse-title">
        <aside className="catalog-category-nav"><h2 id="browse-title">Browse the catalog</h2><p>Explore product categories and featured items.</p><nav aria-label="Product category links">{categories.map((category, index) => <Link className={index === 0 ? "active" : ""} href={category.href} key={category.label}><img src={category.icon} alt="" />{category.label}<span>&rsaquo;</span></Link>)}</nav><Link className="catalog-text-link" href="/products">View All Products &rarr;</Link><div className="catalog-browse-shortcuts"><Link href="/products?sort=new">New Arrivals</Link><Link href="/products?sort=popular">Best Sellers</Link></div></aside>
        <div className="catalog-product-showcase">
          <div className="catalog-section-heading"><div><h2>Headlights</h2><p>OE fitment. Premium quality. Global supply.</p></div><Link className="catalog-text-link" href="/headlights">View All Headlights &rarr;</Link></div>
          <div className="catalog-product-grid">
            {featuredHeadlights.map((product) => <article className="catalog-product-card" key={product.__id}><Link className="catalog-product-image" href={productPath(product)}><img src={product.localImage} alt={product.title} loading="lazy" /></Link><div className="catalog-product-copy"><h3><Link href={productPath(product)}>{product.title}</Link></h3><span>{productDetails(product)}</span><small>{productReference(product)}</small></div><div className="catalog-product-actions"><Link href={productPath(product)}>View Details</Link><Link href={`${productPath(product)}#product-inquiry`}>Inquiry</Link></div></article>)}
          </div>
          <div className="catalog-category-tiles">{categories.slice(1).map((category) => <Link href={category.href} key={category.label}><img src={productImage(category.category, category.fallback)} alt="" loading="lazy" /><span>{category.label}<small>View Products &rarr;</small></span></Link>)}</div>
        </div>
      </section>

      <section className="catalog-support-strip" aria-label="Cowinmotors sourcing support">{supportItems.map(([title, description, icon]) => <article key={title}><img src={icon} alt="" /><div><strong>{title}</strong><span>{description}</span></div></article>)}</section>

      <section className="catalog-quick-rfq" aria-labelledby="quick-rfq-title"><div><h2 id="quick-rfq-title">Compare &amp; Request for Quotation</h2><p>Send an OE number or product photo. Tell us what you need and we&apos;ll get back to you with suitable options.</p></div><div className="catalog-quick-actions"><div><span>By OE Number</span><span>By Product Photo</span></div><Link href="/quote">Open the detailed quote form &rarr;</Link></div><Link className="catalog-primary-action" href="/quote">Request a Quote</Link></section>

      <section className="catalog-resources" aria-labelledby="resources-title"><div className="catalog-section-heading"><div><h2 id="resources-title">Buyer Guides &amp; Industry News</h2><p>Practical knowledge for smarter sourcing.</p></div><Link className="catalog-text-link" href="/blog">View All Resources &rarr;</Link></div>{resources.length ? <div className="catalog-resource-grid">{resources.map((resource) => <Link href={resource.href} key={resource.href} className="catalog-resource-card"><img src={resource.image || UI_ASSETS.newsLighting} alt={resource.alt} loading="lazy" /><span><small>{resource.label}</small><strong>{resource.title}</strong><b>Read More &rarr;</b></span></Link>)}</div> : <div className="catalog-resources-empty"><p>Browse practical sourcing guidance and automotive parts insights.</p><Link className="catalog-text-link" href="/blog">Explore Buyer Guides &rarr;</Link></div>}</section>
    </main>
  );
}
