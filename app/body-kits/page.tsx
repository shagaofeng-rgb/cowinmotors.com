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
  ["Material", "PP, ABS or PU. Confirm strength and flexibility."],
  ["Finish", "Unpainted, gloss black, carbon look or painted color code."],
  ["Components", "Confirm included parts and hardware in the full kit."],
  ["Packaging", "Box size, protection method and label requirements."],
  ["Shipping", "Lead time, MOQ, freight method and destination."],
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
              Source a wide range of body kits and exterior styling parts for global retail and e-commerce.
              Confirm material, finish, paint option, packaging and shipping before placing an order.
            </p>
            <div className="category-quick-stats">
              <span>Vehicle Fitment</span>
              <span>Premium Finishes</span>
              <span>Global Shipping</span>
            </div>
            <div className="category-source-box">
              <strong>Can&apos;t find what you need?</strong>
              <span>We source unlisted or custom body kits and styling parts. Share your request and we will find it.</span>
              <Link href="/quote?product=Body%20Kit%20RFQ">Request a Quote</Link>
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
            ["Finish Options", "Unpainted, gloss black, carbon look or painted to match."],
            ["Packaging", "Carton size, foam protection and part-by-part packing available."],
            ["Shipping / MOQ", "MOQ varies by product. Global shipping with export documents."],
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
              <h2>Quote-only sourcing categories.</h2>
              <p>Select a body kit category and send your vehicle fitment requirements for a matched quotation.</p>
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
              <Link className="bodykit-request-card" href={`/quote?product=${encodeURIComponent(item)}`} key={item}>
                <img src={UI_ASSETS.bodyKits[index] || UI_ASSETS.bodyKitHero} alt={`${item} sourcing request`} />
                <strong>{item}</strong>
                <span>Submit vehicle fitment, material, finish and destination for quotation.</span>
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
            <p>We help global retail and e-commerce buyers source the right body kits and exterior parts with accurate fitment, finishes, and reliable delivery.</p>
          </div>
          <MissingModelForm />
        </section>
      </main>
    </>
  );
}
