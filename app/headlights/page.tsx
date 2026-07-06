import { CategoryShowcase } from "@/components/CategoryShowcase";
import { filterProducts, paginateProducts } from "@/lib/products";
import { UI_ASSETS } from "@/lib/ui-assets";

export const metadata = {
  title: "Premium LED Headlights by Vehicle Fitment",
  description:
    "Browse LED headlight assemblies and upgrade kits with LHD/RHD, connector, DRL, beam pattern, and vehicle fitment confirmation.",
  alternates: { canonical: "/headlights" },
};

export default async function HeadlightsPage({
  searchParams,
}: {
  searchParams: Promise<{ make?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const paged = paginateProducts(filterProducts({ category: "headlights", brand: params.make || "", query: params.q || "" }), Number(params.page || 1), 25);

  return (
    <CategoryShowcase
      eyebrow="Headlights"
      title="Premium headlights"
      highlight="by vehicle fitment."
      description="Find high-performance headlights with precise fitment for your vehicle. Confirm year, make, model, LHD/RHD, connector, beam pattern, DRL and signal options before ordering."
      heroImage={UI_ASSETS.headlightHero}
      heroAlt="Premium LED headlight assembly"
      basePath="/headlights"
      products={paged.items}
      pageType="headlights"
      initialBrand={params.make || "all"}
      initialSearch={params.q || ""}
      totalCount={paged.total}
      currentPage={paged.currentPage}
      totalPages={paged.totalPages}
      categorySlug="headlights"
      finderTitle="Find headlights that fit your vehicle"
      ctaLabel="Request Custom Quote"
      ctaHref="/quote?product=Headlight%20Custom%20Quote"
      quickStats={["Exact Fitment", "OE-Style Install", "Wide Compatibility", "Global Retail Ordering"]}
      benefits={[
        ["Fitment Support", "Confirm LHD/RHD, plugs, beam pattern and vehicle application."],
        ["Retail-Friendly Ordering", "Competitive pricing, low MOQs, dropshipping and bulk options."],
        ["Global Shipping", "Reliable delivery to 200+ countries worldwide."],
        ["Sourcing Beyond Listed Items", "If it is not here, we help source or customize it."],
      ]}
      checklistTitle="How to choose the right headlight"
      checklist={[
        ["Confirm Fitment", "Verify year, make, model, trim, LHD/RHD and connector type."],
        ["Choose Features", "Select DRL style, signal type, beam pattern and color temperature."],
        ["Check Compatibility", "Confirm adaptive, leveling, AFS and sensor requirements."],
        ["Review Installation", "Most products are plug-and-play; professional installation is recommended."],
      ]}
      tabs={["All", "BMW", "Mercedes-Benz", "Audi", "Porsche", "Volkswagen", "Tesla"]}
      supportTitle="Do not see what you need? We will source it for you."
      supportText="If the exact headlight is not listed, our team can source or customize solutions to match your requirements."
    />
  );
}
