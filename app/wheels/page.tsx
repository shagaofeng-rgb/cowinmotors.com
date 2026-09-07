import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { categoryPageMetadata, categorySearchPath, shouldNormalizeCategorySearch, type CategorySearchParams } from "@/lib/category-url";
import { categoryHeroImage, filterProducts, paginateProducts } from "@/lib/products";
import { UI_ASSETS } from "@/lib/ui-assets";

const baseMetadata = {
  title: "Forged Automotive Wheels by Fitment",
  description:
    "Browse forged automotive wheels with diameter, PCD, offset, center bore, finish, and export quotation support.",
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<CategorySearchParams> }): Promise<Metadata> {
  return categoryPageMetadata({ ...baseMetadata, basePath: "/wheels", params: await searchParams });
}

export default async function WheelsPage({
  searchParams,
}: {
  searchParams: Promise<CategorySearchParams>;
}) {
  const params = await searchParams;
  if (shouldNormalizeCategorySearch(params)) permanentRedirect(categorySearchPath("/wheels", params));
  const query = [params.year, params.q].filter(Boolean).join(" ");
  const paged = paginateProducts(filterProducts({ category: "wheels", brand: params.make || "", query }), Number(params.page || 1), 25);

  return (
    <CategoryShowcase
      eyebrow="Wheels"
      title="Forged automotive wheels"
      highlight="by vehicle fitment."
      description="Browse automotive forged-wheel inquiries. Confirm size, PCD or bolt pattern, offset, center bore, finish, and load requirements before ordering."
      heroImage={categoryHeroImage("wheels", UI_ASSETS.wheelHero)}
      heroAlt="Performance alloy wheel"
      basePath="/wheels"
      products={paged.items}
      pageType="wheels"
      initialBrand={params.make || "all"}
      initialSearch={params.q || ""}
      initialYear={params.year || ""}
      totalCount={paged.total}
      currentPage={paged.currentPage}
      totalPages={paged.totalPages}
      categorySlug="wheels"
      finderTitle="Find wheels that fit your vehicle"
      ctaLabel="Request a Quote"
      ctaHref="/quote"
      quickStats={["Fitment Review", "Packaging Support", "Retail & Wholesale Inquiry", "Export Coordination"]}
      benefits={[
        ["Forged Selection", "Forged automotive wheels for retail and wholesale buyers."],
        ["Fitment Review", "PCD, offset, center bore, and vehicle configuration are confirmed before quotation."],
        ["Shipping Coordination", "Packaging and export-document requirements are reviewed by destination."],
        ["Retail-Focused", "Retail and wholesale inquiries are reviewed individually."],
      ]}
      checklistTitle="Wheel specs explained"
      checklist={[
        ["Size", "Diameter and width for fit and handling."],
        ["PCD / Bolt Pattern", "Number of bolts and diameter."],
        ["Offset (ET)", "Distance from hub mounting surface."],
        ["Center Bore", "Center hole size for hub fit."],
        ["Load Rating", "Confirm the required load rating before ordering."],
      ]}
      tabs={["All Brands", "Vossen", "AL13", "BC Forged", "HRE", "WORK", "Brixton Forged"]}
      supportTitle="Need a custom wheel style?"
      supportText="We source special finishes, offsets, and designs not listed online. Send your requirements for a fitment-based quote."
    />
  );
}
