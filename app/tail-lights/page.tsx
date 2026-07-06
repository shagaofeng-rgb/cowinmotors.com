import { CategoryShowcase } from "@/components/CategoryShowcase";
import { filterProducts, paginateProducts } from "@/lib/products";
import { UI_ASSETS } from "@/lib/ui-assets";

export const metadata = {
  title: "LED Tail Lights and Rear Lamp Assemblies by Fitment",
  description:
    "Browse OEM replacement and upgrade LED tail lights with OE style, sequential signal, connector, side, and vehicle fitment confirmation.",
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
    <CategoryShowcase
      eyebrow="Tail Lights"
      title="LED tail lights and rear lamp assemblies"
      highlight="by vehicle fitment."
      description="Explore LED tail lights with OE fitment, multiple lens styles, signal types, dynamic or sequential turn indicators, and reliable performance."
      heroImage={UI_ASSETS.tailLightHero}
      heroAlt="LED tail light assembly"
      basePath="/tail-lights"
      products={paged.items}
      pageType="tail-lights"
      initialBrand={params.make || "all"}
      initialSearch={params.q || ""}
      totalCount={paged.total}
      currentPage={paged.currentPage}
      totalPages={paged.totalPages}
      categorySlug="tail-lights"
      finderTitle="Find tail lights for your vehicle"
      ctaLabel="Request Sourcing"
      ctaHref="/quote?product=Tail%20Light%20Sourcing"
      quickStats={["OE Replacement Quality", "Dynamic / Sequential Signals", "DOT / SAE Options", "Plug & Play Direct Fit"]}
      benefits={[
        ["Wholesale Pricing", "Best rates for retailers and resellers."],
        ["Source Unavailable Parts", "We locate hard-to-find or discontinued parts."],
        ["Custom & Private Label", "OEM packaging and branding options available."],
        ["Strict QC Inspection", "Every part checked before shipment."],
      ]}
      checklistTitle="Tail light order checklist"
      checklist={[
        ["Confirm Trim", "Check year, make, model, sedan, coupe, wagon or other body style."],
        ["Check Side", "Confirm left, right, inner, outer, pair or full set requirements."],
        ["Verify Connector", "Confirm plug, pin count and wiring compatibility."],
        ["Confirm Lens Style", "Choose OE, smoked, clear, LED or sequential turn options."],
      ]}
      tabs={["All", "BMW", "Mercedes-Benz", "Audi", "Porsche", "Volkswagen", "Toyota", "Ford"]}
      supportTitle="Need a tail light not listed online?"
      supportText="We source, customize, and deliver what you need with fitment confirmation and export-ready packaging."
    />
  );
}
