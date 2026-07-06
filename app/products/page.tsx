import { FinderForm } from "@/components/FinderForm";
import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { filterProducts, paginateProducts, productCardData, productCategoryOptions, products as allProducts } from "@/lib/products";

export const metadata = {
  title: "Automotive Headlights, Tail Lights, Exhaust and Wheels Catalog",
  description:
    "Browse Cowinmotors English automotive parts catalog by brand, model, year, category, part number, headlights, tail lights, exhaust systems, wheels, and body kit RFQ items.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; make?: string; q?: string; year?: string; page?: string }>;
}) {
  const params = await searchParams;
  const searchTerms = [params.year, params.q].filter(Boolean).join(" ");
  const filtered = filterProducts({
    category: params.category || "",
    brand: params.make || "",
    query: searchTerms,
  });
  const page = Number(params.page || 1);
  const paged = paginateProducts(filtered, page, 25);
  const heroProducts = productCardData((filtered.length ? filtered : allProducts).slice(0, 4));

  return (
    <>
      <Header />
      <main className="category-design products-design">
        <section className="category-visual-hero products-hero">
          <div className="category-copy">
            <div className="category-breadcrumb">Home / Products</div>
            <p className="category-kicker">All Products</p>
            <h1>
              Search real automotive parts by category, brand, fitment, and product keyword.
            </h1>
            <p>
              Browse Cowinmotors catalog listings for headlights, tail lights, exhaust systems, wheels, and quote-only exterior sourcing requests.
              Open a product page to review fitment notes, images, and quotation details.
            </p>
            <div className="category-quick-stats">
              <span>Real Product Images</span>
              <span>Fitment-Led Search</span>
              <span>Quote Support</span>
            </div>
          </div>
          <div className="products-hero-grid" aria-label="Featured catalog products">
            {heroProducts.map((product) => (
              <img src={product.localImage} alt={product.title} key={product.__id} />
            ))}
          </div>
        </section>

        <section className="category-fitment-panel">
          <div>
            <p className="category-kicker">Catalog Search</p>
            <strong>Start with year, make, model, product category, or part keyword.</strong>
          </div>
          <FinderForm />
        </section>

        <section className="category-benefit-row" aria-label="Catalog support">
          {[
            ["Fitment Check", "Confirm year, market, side, connector, engine, and trim."],
            ["Real Listings", "Products use real catalog data and available product images."],
            ["Wholesale Quote", "Send quantity, target market, and shipping destination."],
            ["Sourcing Support", "Request unlisted models through the RFQ flow."],
          ].map(([title, text]) => (
            <article key={title}>
              <i aria-hidden="true" />
              <strong>{title}</strong>
              <span>{text}</span>
            </article>
          ))}
        </section>

        <section className="category-products-section products-section">
          <div className="category-section-head">
            <div>
              <p className="category-kicker">Catalog Results</p>
              <h2>All available listings.</h2>
              <p>Showing real catalog products that match the selected search and filters.</p>
            </div>
            <div className="category-tabs">
              {productCategoryOptions.map((category) => (
                <span key={category.slug}>{category.label}</span>
              ))}
            </div>
          </div>
          <ProductBrowser
            products={productCardData(paged.items)}
            initialBrand={params.make || "all"}
            initialCategory={params.category || ""}
            initialSearch={searchTerms}
            totalCount={paged.total}
            currentPage={paged.currentPage}
            totalPages={paged.totalPages}
          />
        </section>
      </main>
    </>
  );
}
