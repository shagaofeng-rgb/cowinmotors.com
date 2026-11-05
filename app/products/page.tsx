import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CatalogCategoryNav } from "@/components/CategoryShowcase";
import { InnerBreadcrumb, InnerPage } from "@/components/InnerPage";
import { ProductBrowser } from "@/components/ProductBrowser";
import { categoryPageMetadata, categorySearchPath, normalizedPage, readCategorySearchParams, shouldNormalizeCategorySearch } from "@/lib/category-url";
import { filterProducts, paginateProducts } from "@/lib/products";

const basePath = "/products";
const baseMetadata = {
  title: "Automotive Headlights, Tail Lights, Exhaust and Wheels Catalog",
  description: "Browse Cowinmotors English automotive parts catalog by brand, model, year, category, part number, headlights, tail lights, exhaust systems, wheels, and body kit RFQ items.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return categoryPageMetadata({ ...baseMetadata, basePath, params: readCategorySearchParams(await searchParams) });
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = readCategorySearchParams(await searchParams);
  if (shouldNormalizeCategorySearch(params, false)) permanentRedirect(categorySearchPath(basePath, params));
  const page = normalizedPage(params.page);
  const paged = paginateProducts(filterProducts({ category: params.category, brand: params.make, query: params.q, year: params.year }), page, 25);
  if (page > paged.totalPages) notFound();

  return (
    <InnerPage className="cm-catalog-page">
      <div className="cm-catalog-intro">
        <div className="cm-wrap">
          <InnerBreadcrumb items={[{ label: "Catalog" }]} />
          <h1>Automotive parts catalog</h1>
          <p>Find lighting, exhaust systems and forged wheels by model or part reference.</p>
        </div>
      </div>
      <CatalogCategoryNav />
      <div className="cm-wrap"><ProductBrowser paged={paged} params={params} basePath={basePath} /></div>
    </InnerPage>
  );
}
