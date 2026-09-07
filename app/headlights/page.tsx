import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { categoryPageMetadata, categorySearchPath, shouldNormalizeCategorySearch, type CategorySearchParams } from "@/lib/category-url";
import { categoryHeroImage, filterProducts, paginateProducts } from "@/lib/products";
import { UI_ASSETS } from "@/lib/ui-assets";

const baseMetadata = {
  title: "Headlight Assemblies by Vehicle Fitment",
  description:
    "Browse catalog-listed headlight assemblies with vehicle-fitment inquiry support and configuration confirmation before ordering.",
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<CategorySearchParams> }): Promise<Metadata> {
  return categoryPageMetadata({ ...baseMetadata, basePath: "/headlights", params: await searchParams });
}

export default async function HeadlightsPage({
  searchParams,
}: {
  searchParams: Promise<CategorySearchParams>;
}) {
  const params = await searchParams;
  if (shouldNormalizeCategorySearch(params)) permanentRedirect(categorySearchPath("/headlights", params));
  const query = [params.year, params.q].filter(Boolean).join(" ");
  const paged = paginateProducts(filterProducts({ category: "headlights", brand: params.make || "", query }), Number(params.page || 1), 25);

  return (
    <CategoryShowcase
      eyebrow="Headlights"
      title="Headlight assemblies"
      highlight="by vehicle fitment."
      description="Browse catalog-listed lighting products. Confirm year, make, model, LHD/RHD, connector, beam pattern, DRL and signal options before ordering."
      heroImage={categoryHeroImage("headlights", UI_ASSETS.headlightHero)}
      heroAlt="Headlight assembly catalog image"
      basePath="/headlights"
      products={paged.items}
      pageType="headlights"
      initialBrand={params.make || "all"}
      initialSearch={params.q || ""}
      initialYear={params.year || ""}
      totalCount={paged.total}
      currentPage={paged.currentPage}
      totalPages={paged.totalPages}
      categorySlug="headlights"
      finderTitle="Find headlights that fit your vehicle"
      ctaLabel="Request Custom Quote"
      ctaHref="/quote"
      quickStats={["Fitment Confirmation", "Configuration Review", "Export Packaging Support", "Inquiry Support"]}
      benefits={[
        ["Fitment Support", "Confirm LHD/RHD, plugs, beam pattern and vehicle application."],
        ["Retail-Friendly Ordering", "Retail-friendly and wholesale inquiries are reviewed individually."],
        ["Shipping Coordination", "Packaging and destination requirements are confirmed before quotation."],
        ["Sourcing Beyond Listed Items", "Send the part reference and vehicle details for a sourcing review."],
      ]}
      checklistTitle="How to choose the right headlight"
      checklist={[
        ["Confirm Fitment", "Verify year, make, model, trim, LHD/RHD and connector type."],
        ["Choose Features", "Select DRL style, signal type, beam pattern and color temperature."],
        ["Check Compatibility", "Confirm adaptive, leveling, AFS and sensor requirements."],
        ["Review Installation", "Confirm installation, coding, and configuration requirements before ordering."],
      ]}
      tabs={["All", "BMW", "Mercedes-Benz", "Audi", "Porsche", "Volkswagen", "Tesla"]}
      supportTitle="Do not see what you need? We will source it for you."
      supportText="If the exact headlight is not listed, our team can source or customize solutions to match your requirements."
    />
  );
}
