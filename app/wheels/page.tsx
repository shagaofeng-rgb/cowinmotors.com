import { CategoryShowcase } from "@/components/CategoryShowcase";
import { filterProducts, paginateProducts } from "@/lib/products";
import { UI_ASSETS } from "@/lib/ui-assets";

export const metadata = {
  title: "Forged Automotive Wheels by Fitment",
  description:
    "Browse forged automotive wheels with diameter, PCD, offset, center bore, finish, and export quotation support.",
  alternates: { canonical: "/wheels" },
};

export default async function WheelsPage({
  searchParams,
}: {
  searchParams: Promise<{ make?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const paged = paginateProducts(filterProducts({ category: "wheels", brand: params.make || "", query: params.q || "" }), Number(params.page || 1), 25);

  return (
    <CategoryShowcase
      eyebrow="Wheels"
      title="Forged automotive wheels"
      highlight="by vehicle fitment."
      description="Shop forged wheels matched to passenger and performance vehicles. Filter by size, PCD or bolt pattern, offset, center bore, finish and load rating."
      heroImage={UI_ASSETS.wheelHero}
      heroAlt="Performance alloy wheel"
      basePath="/wheels"
      products={paged.items}
      pageType="wheels"
      initialBrand={params.make || "all"}
      initialSearch={params.q || ""}
      totalCount={paged.total}
      currentPage={paged.currentPage}
      totalPages={paged.totalPages}
      categorySlug="wheels"
      finderTitle="Find wheels that fit your vehicle"
      ctaLabel="Request a Quote"
      ctaHref="/quote?product=Wheels%20RFQ"
      quickStats={["Fitment-Verified Results", "Global Logistics", "Retail & Wholesale Support", "QC Inspected"]}
      benefits={[
        ["Forged Selection", "Forged automotive wheels for retail and wholesale buyers."],
        ["Verified Fitment", "Accurate specs for your vehicle application."],
        ["Global Shipping", "Secure packaging and export documentation."],
        ["Retail-Focused", "Competitive pricing for resellers."],
      ]}
      checklistTitle="Wheel specs explained"
      checklist={[
        ["Size", "Diameter and width for fit and handling."],
        ["PCD / Bolt Pattern", "Number of bolts and diameter."],
        ["Offset (ET)", "Distance from hub mounting surface."],
        ["Center Bore", "Center hole size for hub fit."],
        ["Load Rating", "Supports vehicle weight safely."],
      ]}
      tabs={["All Brands", "Vossen", "AL13", "BC Forged", "HRE", "WORK", "Brixton Forged"]}
      supportTitle="Need a custom wheel style?"
      supportText="We source special finishes, offsets, and designs not listed online. Send your requirements for a fitment-based quote."
    />
  );
}
