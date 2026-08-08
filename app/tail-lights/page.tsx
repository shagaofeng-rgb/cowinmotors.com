import { CategoryShowcase } from "@/components/CategoryShowcase";
import { categoryHeroImage, filterProducts, paginateProducts } from "@/lib/products";
import { UI_ASSETS } from "@/lib/ui-assets";

export const metadata = {
  title: "LED Tail Lights and Rear Lamp Assemblies by Fitment",
  description:
    "Browse catalog-listed tail light assemblies with side, connector, and vehicle-fitment confirmation before ordering.",
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
      description="Explore catalog-listed tail light assemblies. Confirm vehicle year, body style, side, lens style, connector, and signal configuration before ordering."
      heroImage={categoryHeroImage("tail-lights", UI_ASSETS.tailLightHero)}
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
      quickStats={["Fitment Confirmation", "Side and Set Review", "Connector Check", "Inquiry Support"]}
      benefits={[
        ["Wholesale Inquiry", "Retail and wholesale requests are reviewed by product and quantity."],
        ["Source Unlisted Parts", "Send the product reference and vehicle details for review."],
        ["Packaging Review", "Packaging requirements can be confirmed before quotation."],
        ["QC Support", "Pre-shipment QC coordination can be discussed for the order."],
      ]}
      checklistTitle="Tail light order checklist"
      checklist={[
        ["Confirm Trim", "Check year, make, model, sedan, coupe, wagon or other body style."],
        ["Check Side", "Confirm left, right, inner, outer, pair or full set requirements."],
        ["Verify Connector", "Confirm plug, pin count and wiring compatibility."],
        ["Confirm Lens Style", "Confirm the listed lens and signal configuration before ordering."],
      ]}
      tabs={["All", "BMW", "Mercedes-Benz", "Audi", "Porsche", "Volkswagen", "Toyota", "Ford"]}
      supportTitle="Need a tail light not listed online?"
      supportText="We source, customize, and deliver what you need with fitment confirmation and export-ready packaging."
    />
  );
}
