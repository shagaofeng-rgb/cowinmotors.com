import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CatalogCategoryNav, CategoryBanner, CategoryChecklist } from "@/components/CategoryShowcase";
import { InnerPage } from "@/components/InnerPage";
import { QuoteForm } from "@/components/QuoteForm";
import { UI_ASSETS } from "@/lib/ui-assets";

export const metadata = {
  title: "Automotive Body Kits and Exterior Styling RFQ",
  description: "Request quotes for automotive body kits and exterior styling parts with fitment, material, finish, paint, packaging, and oversized shipping confirmation.",
  alternates: { canonical: "/body-kits" },
};

const components = ["Full body kits", "Front lips", "Rear diffusers", "Side skirts", "Spoilers & wings"];

export default function BodyKitsPage() {
  return (
    <InnerPage className="cm-catalog-page">
      <CategoryBanner category="body-kits" />
      <CatalogCategoryNav current="body-kits" />
      <section className="cm-wrap cm-body-kit-choices">
        <h2>Exterior components</h2>
        <p>Illustrative examples. Availability and fitment are confirmed by quote.</p>
        <div className="cm-body-kit-grid">
          {components.map((name, index) => (
            <Link href={`/quote?category=body-kits&product=${encodeURIComponent(name)}`} key={name}>
              <img src={UI_ASSETS.bodyKits[index]} alt="" loading="lazy" decoding="async" />
              <strong>{name} <ArrowUpRight size={16} aria-hidden="true" /></strong>
            </Link>
          ))}
        </div>
      </section>
      <CategoryChecklist category="body-kits" />
      <section id="body-kit-inquiry" className="cm-inquiry-band">
        <div className="cm-wrap cm-inquiry-layout">
          <div className="cm-inquiry-aside">
            <h2>Request a body kit quote</h2>
            <p>Include the model year, body style and parts you need. A photo of the car or mounting area helps with fitment review.</p>
          </div>
          <QuoteForm initialCategory="Body Kits" lighting={false} />
        </div>
      </section>
    </InnerPage>
  );
}
