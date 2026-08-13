import Link from "next/link";
import { Header } from "@/components/Header";
import { MissingModelForm } from "@/components/MissingModelForm";
import { UI_ASSETS } from "@/lib/ui-assets";

export const metadata = {
  title: "Automotive Body Kits and Exterior Styling RFQ",
  description:
    "Request quotes for automotive body kits and exterior styling parts with fitment, material, finish, paint, packaging, and oversized shipping confirmation.",
  alternates: { canonical: "/body-kits" },
};

const bodyKitChecks = [
  ["Fitment", "Confirm year, make, model, trim, body type and bumper style."],
  ["Material", "Confirm the listed material for the requested component."],
  ["Finish", "Confirm surface finish and paint requirements before ordering."],
  ["Components", "Confirm included parts and hardware before ordering."],
  ["Packaging", "Box size, protection method and label requirements."],
  ["Shipping", "Packaging, freight method, and destination requirements."],
];

export default function BodyKitsPage() {
  return (
    <>
      <Header cta="Request a Quote" />
      <main className="category-design bodykit-design">
        <section className="category-visual-hero">
          <div className="category-copy">
            <div className="category-breadcrumb">Home / Categories / Body Kits</div>
            <p className="category-kicker">Body Kits</p>
            <h1>
              Body kits, lips, spoilers, diffusers, side skirts, and exterior styling parts <span>by vehicle fitment.</span>
            </h1>
            <p>
              Submit a fitment-led sourcing request for exterior styling parts. Confirm material, finish, paint option, packaging, and destination before ordering.
            </p>
            <div className="category-quick-stats">
              <span>Vehicle Fitment</span>
              <span>Product Detail Review</span>
              <span>Export Coordination</span>
            </div>
            <div className="category-source-box">
              <strong>Can&apos;t find what you need?</strong>
              <span>Send the vehicle details, product reference, material or finish requirement, and destination for review.</span>
              <Link href="/quote">Request a Quote</Link>
            </div>
          </div>
          <div className="category-hero-media">
            <img src={UI_ASSETS.bodyKitHero} alt="Body kit exterior styling parts" />
          </div>
        </section>

        <section className="category-fitment-panel">
          <div>
            <p className="category-kicker">Find body kits for your vehicle</p>
            <strong>Submit vehicle details to receive matched body kit options, finish guidance, packaging notes, and shipping support.</strong>
          </div>
          <form action="/quote">
            <label>Year<input name="year" placeholder="Select Year" /></label>
            <label>Make<input name="make" placeholder="Select Make" /></label>
            <label>Model<input name="model" placeholder="Select Model" /></label>
            <label>Body Type<input name="bodyType" placeholder="Sedan / Coupe / SUV" /></label>
            <button type="submit">Find Parts</button>
            <Link href="/body-kits">Clear all filters</Link>
          </form>
        </section>

        <section className="category-benefit-row">
          {[
            ["Fitment", "Confirm year, model, trim and body style before ordering."],
            ["Finish Options", "Confirm surface finish and paint requirements before quotation."],
            ["Packaging", "Packaging requirements are reviewed before ordering."],
            ["Shipping / Quantity", "Quantity, shipping method, and destination are confirmed per request."],
          ].map(([title, text]) => (
            <article key={title}>
              <i aria-hidden="true" />
              <strong>{title}</strong>
              <span>{text}</span>
            </article>
          ))}
        </section>

        <section className="category-products-section bodykit-rfq-list">
          <div className="category-section-head">
            <div>
              <p className="category-kicker">Shop body kits</p>
              <h2>Exterior-part sourcing requests.</h2>
              <p>Send the vehicle fitment requirements and product reference for a sourcing review.</p>
            </div>
            <div className="category-tabs">
              <span>All Body Kits</span>
              <span>Full Kits</span>
              <span>Front Lips</span>
              <span>Rear Diffusers</span>
              <span>Side Skirts</span>
            </div>
          </div>
          <div className="bodykit-request-grid">
            {["Full Body Kits", "Front Lips", "Rear Diffusers", "Side Skirts", "Spoilers & Wings"].map((item, index) => (
              <Link className="bodykit-request-card" href="/quote" key={item}>
                <img src={UI_ASSETS.bodyKits[index] || UI_ASSETS.bodyKitHero} alt={`${item} sourcing request`} />
                <strong>{item}</strong>
                <span>Submit vehicle fitment, material or finish requirement, and destination for quotation.</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="category-checklist">
          <div>
            <p className="category-kicker">Before you order</p>
            <h2>What to confirm before ordering a body kit</h2>
          </div>
          <div className="category-check-grid six">
            {bodyKitChecks.map(([title, text], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <small>{text}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="category-support-cta bodykit-form-panel">
          <div>
            <p className="category-kicker">Need a custom solution?</p>
            <h2>Request a quote for special requests or unlisted body kits.</h2>
            <p>Send the vehicle configuration and product reference so fitment, available details, packaging, and destination can be reviewed before quotation.</p>
          </div>
          <MissingModelForm />
        </section>
      </main>
    </>
  );
}
