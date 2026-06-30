import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { filterProducts, paginateProducts, productCardData } from "@/lib/products";

export const metadata = {
  title: "Automotive LED Headlights by Vehicle Fitment",
  description:
    "Browse LED headlight assemblies and upgrade kits for BMW, Mercedes-Benz, Audi, Porsche, Volkswagen, Tesla, and other vehicle applications.",
};

export default async function HeadlightsPage({
  searchParams,
}: {
  searchParams: Promise<{ make?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const paged = paginateProducts(filterProducts({ category: "headlights", brand: params.make || "", query: params.q || "" }), Number(params.page || 1), 25);

  return (
    <>
      <Header cta="Request quote" />
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
          <ProductBrowser
            products={productCardData(paged.items)}
            pageType="headlights"
            initialBrand={params.make || "all"}
            initialCategory="headlights"
            initialSearch={params.q || ""}
            totalCount={paged.total}
            currentPage={paged.currentPage}
            totalPages={paged.totalPages}
            basePath="/headlights"
          />
        </section>
      </main>
    </>
  );
}
