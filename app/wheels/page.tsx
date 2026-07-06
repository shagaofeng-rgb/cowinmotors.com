import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { filterProducts, paginateProducts, productCardData, products } from "@/lib/products";

export const metadata = {
  title: "Forged and Performance Wheels by Fitment",
  description:
    "Browse forged, flow-formed, off-road, and performance wheels with diameter, width, PCD, offset, center bore, finish, and export quotation support.",
  alternates: { canonical: "/wheels" },
};

export default async function WheelsPage({
  searchParams,
}: {
  searchParams: Promise<{ make?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const paged = paginateProducts(filterProducts({ category: "wheels", brand: params.make || "", query: params.q || "" }), Number(params.page || 1), 25);
  const heroImage = products.find((product) => product.category === "Wheels")?.localImage || "/assets/live/category-exhaust.png";

  return (
    <>
      <Header cta="Request wheel quote" />
      <main>
        <section className="page-hero category-hero">
          <div>
            <p className="eyebrow">Wheels</p>
            <h1>Forged and performance wheels by vehicle fitment.</h1>
            <p>
              Source wheel applications with diameter, width, bolt pattern, offset, center bore, brake clearance,
              finish, cap, hardware, MOQ, packaging, and export shipping confirmed before quotation.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="/quote?product=Wheels%20RFQ">Request wheel quote</a>
              <a className="button secondary" href="#wheel-products">View wheel products</a>
            </div>
          </div>
          <img src={heroImage} alt="Forged and performance wheel product" />
        </section>
        <section className="section products-section" id="wheel-products">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Wheel Listings</p>
              <h2>Forged, flow-formed, off-road, and performance wheels.</h2>
              <p>Use search or brand filters to narrow wheel designs, vehicle applications, and source-brand references.</p>
            </div>
          </div>
          <ProductBrowser
            products={productCardData(paged.items)}
            pageType="wheels"
            initialBrand={params.make || "all"}
            initialCategory="wheels"
            initialSearch={params.q || ""}
            totalCount={paged.total}
            currentPage={paged.currentPage}
            totalPages={paged.totalPages}
            basePath="/wheels"
          />
        </section>
      </main>
    </>
  );
}
