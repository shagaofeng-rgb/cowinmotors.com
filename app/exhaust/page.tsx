import { CategoryShowcase } from "@/components/CategoryShowcase";
import { categoryHeroImage, filterProducts, paginateProducts } from "@/lib/products";
import { UI_ASSETS } from "@/lib/ui-assets";

export const metadata = {
  title: "Performance Exhaust Systems by Vehicle Fitment",
  description:
    "Browse catalog-listed exhaust systems with vehicle, engine, installation, and destination-requirement confirmation before ordering.",
  alternates: { canonical: "/exhaust" },
};

export default async function ExhaustPage({
  searchParams,
}: {
  searchParams: Promise<{ make?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const paged = paginateProducts(filterProducts({ category: "exhaust", brand: params.make || "", query: params.q || "" }), Number(params.page || 1), 25);

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
