import { FinderForm } from "@/components/FinderForm";
import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { filterProducts, paginateProducts, productCardData } from "@/lib/products";

export const metadata = {
  title: "Automotive Headlights, Tail Lights and Exhaust Products Catalog",
  description:
    "Browse Cowinmotors English automotive parts catalog by brand, model, year, category, part number, headlights, tail lights, and exhaust systems.",
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

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <p className="eyebrow">All Products</p>
          <h1>Browse by vehicle, category, and brand.</h1>
          <p>Search lighting, exhaust, and exterior parts by vehicle fitment, product category, brand, year, and part number.</p>
        </section>
        <section className="vehicle-finder page-finder">
          <div className="finder-copy">
            <p className="eyebrow">Shop by Vehicle</p>
            <h2>Filter the catalog.</h2>
            <p>Search by make, model, engine, year, category, or feature.</p>
          </div>
          <FinderForm />
        </section>
        <section className="section products-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Catalog</p>
              <h2>All available listings.</h2>
              <p>Open a product page to review fitment notes, available images, and quotation details.</p>
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
