import { CategoryShowcase } from "@/components/CategoryShowcase";
import { filterProducts, paginateProducts, products } from "@/lib/products";

export const metadata = {
  title: "Forged, Cast, Flow-Formed and Performance Wheels by Fitment",
  description:
    "Browse forged, cast, flow-formed, off-road, and performance wheels with diameter, PCD, offset, center bore, finish, and export quotation support.",
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
    <CategoryShowcase
      eyebrow="Wheels"
      title="Forged, cast, flow-formed, off-road and performance wheels"
      highlight="by vehicle fitment."
      description="Shop premium wheels matched to your vehicle. Filter by size, PCD or bolt pattern, offset, center bore, finish and load rating."
      heroImage={heroImage}
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
        ["Wide Selection", "Forged, cast, flow-formed and off-road wheels."],
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
      tabs={["All Brands", "Vossen", "Rotiform", "Rays", "Enkei", "Konig", "Fuel Off-Road"]}
      supportTitle="Need a custom wheel style?"
      supportText="We source special finishes, offsets, and designs not listed online. Send your requirements for a fitment-based quote."
    />
  );
}
