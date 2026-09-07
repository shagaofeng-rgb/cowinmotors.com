import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { categoryPageMetadata, categorySearchPath, shouldNormalizeCategorySearch, type CategorySearchParams } from "@/lib/category-url";
import { categoryHeroImage, filterProducts, paginateProducts } from "@/lib/products";
import { UI_ASSETS } from "@/lib/ui-assets";

const baseMetadata = {
  title: "Performance Exhaust Systems by Vehicle Fitment",
  description:
    "Browse catalog-listed exhaust systems with vehicle, engine, installation, and destination-requirement confirmation before ordering.",
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<CategorySearchParams> }): Promise<Metadata> {
  return categoryPageMetadata({ ...baseMetadata, basePath: "/exhaust", params: await searchParams });
}

export default async function ExhaustPage({
  searchParams,
}: {
  searchParams: Promise<CategorySearchParams>;
}) {
  const params = await searchParams;
  if (shouldNormalizeCategorySearch(params)) permanentRedirect(categorySearchPath("/exhaust", params));
  const query = [params.year, params.q].filter(Boolean).join(" ");
  const paged = paginateProducts(filterProducts({ category: "exhaust", brand: params.make || "", query }), Number(params.page || 1), 25);

  return (
    <CategoryShowcase
      eyebrow="Exhaust Systems"
      title="Performance exhaust systems"
      highlight="by vehicle fitment."
      description="Browse catalog-listed cat-back, axle-back, downpipe, mid-pipe, and exhaust-tip products. Confirm vehicle, engine, installation position, and destination requirements before ordering."
      heroImage={categoryHeroImage("exhaust", UI_ASSETS.exhaustHero)}
      heroAlt="Performance exhaust system"
      basePath="/exhaust"
      products={paged.items}
      pageType="exhaust"
      initialBrand={params.make || "all"}
      initialSearch={params.q || ""}
      initialYear={params.year || ""}
      totalCount={paged.total}
      currentPage={paged.currentPage}
      totalPages={paged.totalPages}
      categorySlug="exhaust"
      finderTitle="Find the right exhaust fitment"
      ctaLabel="Request a Quote"
      ctaHref="/quote"
      quickStats={["Fitment Confirmation", "Product Detail Review", "Packaging Support", "Export Coordination"]}
      benefits={[
        ["Fitment Review", "Confirm application information before quotation."],
        ["Material Review", "Only listed material details are treated as product information."],
        ["Use and Sound", "Confirm intended use and destination requirements before ordering."],
        ["Buyer Support", "Fitment, sourcing, packaging, and export questions can be reviewed."],
      ]}
      checklistTitle="What to confirm before ordering an exhaust"
      checklist={[
        ["Fitment", "Year, make, model, engine code, body style and drivetrain."],
        ["Material", "Confirm the material stated for the selected product."],
        ["Sound Level", "Confirm the intended use and destination requirements before ordering."],
        ["Packing", "Retail-ready packaging or bulk packing per requirements."],
        ["Shipping", "Destination, shipping method, and import requirements."],
      ]}
      tabs={["All Systems", "Cat-Back Systems", "Axle-Back Systems", "Downpipes", "Exhaust Tips"]}
      supportTitle="Need a custom exhaust system or part not listed?"
      supportText="Our sourcing team can find the right product, match fitment and confirm the best solution for your market."
    />
  );
}
