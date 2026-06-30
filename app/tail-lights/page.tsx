import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { filterProducts, paginateProducts, productCardData } from "@/lib/products";

export const metadata = {
  title: "Automotive LED Tail Lights by Vehicle Fitment",
  description:
    "Browse OEM replacement and upgrade LED tail lights for BMW, Mercedes-Benz, Audi, Porsche, Volkswagen, and other vehicle applications.",
  alternates: { canonical: "/tail-lights" },
};

export default async function TailLightsPage({
  searchParams,
}: {
  searchParams: Promise<{ make?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const paged = paginateProducts(filterProducts({ category: "tail-lights", brand: params.make || "", query: params.q || "" }), Number(params.page || 1), 25);

  return (
    <>
      <Header cta="Request quote" />
      <main>
        <section className="page-hero category-hero">
          <div>
            <p className="eyebrow">Tail Lights</p>
            <h1>LED tail lights and rear lamp assemblies by vehicle fitment.</h1>
            <p>Confirm year, trim, LHD/RHD, connector, outer/inner lamp position, side, part number, and compliance before order.</p>
          </div>
          <img src="/assets/catalog/tianju/id_818db2d3588f42aa806cd2c1a398ed6c.webp" alt="Automotive LED tail light assembly" />
        </section>
        <section className="section products-section">
          <div className="section-title-row"><div><p className="eyebrow">Tail Light Listings</p><h2>Rear lighting products.</h2></div></div>
          <ProductBrowser
            products={productCardData(paged.items)}
            initialBrand={params.make || "all"}
            initialCategory="tail-lights"
            initialSearch={params.q || ""}
            totalCount={paged.total}
            currentPage={paged.currentPage}
            totalPages={paged.totalPages}
            basePath="/tail-lights"
          />
        </section>
      </main>
    </>
  );
}
