import { CategoryShowcase } from "@/components/CategoryShowcase";
import { categoryHeroImage, filterProducts, paginateProducts } from "@/lib/products";
import { UI_ASSETS } from "@/lib/ui-assets";

export const metadata = {
  title: "Performance Exhaust Systems by Vehicle Fitment",
  description:
    "Browse SS304 performance exhaust systems, cat-back exhausts, axle-back exhausts, downpipes, tips, and replacement exhaust products with RFQ support.",
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
      description="Source cat-back, axle-back, downpipes, mid-pipes and exhaust tips built for performance, sound and quality. We help retail buyers confirm fitment and export coordination."
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
      ctaHref="/quote?product=Exhaust%20System%20RFQ"
      quickStats={["Verified Fitment", "Premium Materials", "Performance & Sound", "Global Distribution"]}
      benefits={[
        ["Verified Fitment", "Application-checked systems for accurate compatibility."],
        ["Premium Materials", "T304 stainless steel and high-quality construction."],
        ["Performance & Sound", "Greater flow, power gains and refined exhaust note."],
        ["Retail Buyer Support", "Fitment help, sourcing and after-sales assistance."],
      ]}
      checklistTitle="What to confirm before ordering an exhaust"
      checklist={[
        ["Fitment", "Year, make, model, engine code, body style and drivetrain."],
        ["Material", "Choose stainless steel, aluminum steel or titanium options."],
        ["Sound Level", "Aggressive, sporty or mild sound note."],
        ["Packing", "Retail-ready packaging or bulk packing per requirements."],
        ["Shipping", "Destination, incoterms, lead time and import requirements."],
      ]}
      tabs={["All Systems", "Cat-Back Systems", "Axle-Back Systems", "Downpipes", "Exhaust Tips"]}
      supportTitle="Need a custom exhaust system or part not listed?"
      supportText="Our sourcing team can find the right product, match fitment and confirm the best solution for your market."
    />
  );
}
