import Link from "next/link";
import { Header } from "@/components/Header";
import { UI_ASSETS } from "@/lib/ui-assets";

export const metadata = {
  title: "Automotive Parts Order Support",
  description:
    "Get support for Cowinmotors automotive parts orders, including fitment confirmation, shipping, payment, warranty, returns, tracking, and installation documents.",
  alternates: { canonical: "/support" },
};

const topics = [
  ["Shipping & Delivery", "Review packaging, shipment coordination, and destination requirements.", "/packaging-shipping"],
  ["Payment Methods", "Confirm payment instructions only after the quotation and product reference are reviewed.", "/payment"],
  ["Returns & Warranty", "Understand confirmation, issue-review, and order-term requirements.", "/returns-warranty"],
  ["Fitment & Compatibility", "Send vehicle configuration and product reference before ordering.", "/fitment-check"],
  ["Track Your Order", "Request shipment-status support using your confirmed order reference.", "/track-your-order"],
  ["Installation Guidance", "Review installation considerations and request applicable documentation before installation.", "/installation-guidance"],
  ["Sourcing & Bulk Orders", "Request a fitment-led sourcing quotation for listed or unlisted parts.", "/sourcing-bulk-orders"],
  ["Contact Us", "Use official email, WhatsApp, phone, or the quotation form.", "/contact-support"],
];

export default function SupportPage() {
  return (
    <>
      <Header cta="Request a Quote" />
      <main className="category-design support-design">
        <section className="support-hero">
          <div>
            <p className="category-kicker">Support Center</p>
            <h1>We&apos;re here to help. Every order, every mile.</h1>
            <p>
              Fitment-led sourcing and export support for headlights, tail lights, exhaust systems, forged wheels, and exterior parts.
              Product, packaging, and destination requirements are reviewed before quotation.
            </p>
            <div className="support-actions">
              <Link href="mailto:racheljiang@cowinmotors.com">Contact Support</Link>
              <Link href="https://api.whatsapp.com/send/?phone=%2B8617601255205&text&type=phone_number&app_absent=0" target="_blank">Chat on WhatsApp</Link>
              <Link href="/quote">Sourcing Request</Link>
            </div>
          </div>
          <img src={UI_ASSETS.supportNetwork} alt="Cowinmotors global order support" />
        </section>

        <section className="support-search-panel">
          <div>
            <p className="category-kicker">How can we help you today?</p>
            <strong>Search FAQs, guides, policies and support topics.</strong>
          </div>
          <form action="/support">
            <input name="q" placeholder="Search by topic, keyword or question..." />
            <button type="submit">Search</button>
          </form>
          <div>
            {["Track my order", "Shipping time", "Returns & warranty", "Fitment help", "Payment methods"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section className="support-topic-section">
          <p className="category-kicker">Support Topics</p>
          <div className="support-topic-grid">
            {topics.map(([title, text, href]) => (
              <article key={title}>
                <i aria-hidden="true" />
                <h2>{title}</h2>
                <p>{text}</p>
                <Link href={href}>Learn more</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="support-contact-row">
          <article>
            <strong>Email Us</strong>
            <a href="mailto:racheljiang@cowinmotors.com">racheljiang@cowinmotors.com</a>
            <span>Response timing is confirmed after review.</span>
          </article>
          <article>
            <strong>WhatsApp</strong>
            <a href="https://api.whatsapp.com/send/?phone=%2B8617601255205&text&type=phone_number&app_absent=0" target="_blank">+86 176 0125 5205</a>
            <span>Share your product and vehicle details.</span>
          </article>
          <article>
            <strong>Fitment Review</strong>
            <span>Send year, make, model, trim, and reference.</span>
            <span>Include LHD/RHD and OE number where applicable.</span>
          </article>
          <article>
            <strong>Order Notes</strong>
            <span>Fitment, packaging, and destination are confirmed before ordering.</span>
          </article>
        </section>

        <section className="support-faq-layout">
          <div>
            <p className="category-kicker">Frequently Asked Questions</p>
            {[
              "How can I confirm fitment for my vehicle?",
              "How long does shipping take?",
              "Which payment methods do you accept?",
              "Can I return or exchange a product?",
              "Do you offer warranty on your products?",
              "How do I track my order?",
            ].map((item) => (
              <details key={item}>
                <summary>{item}</summary>
                <p>Use the related support page above to prepare the information needed for an accurate answer. Product and order details are confirmed against the specific request.</p>
              </details>
            ))}
          </div>
          <aside>
            <img src={UI_ASSETS.supportHeadset} alt="" aria-hidden="true" />
            <h2>Need immediate help?</h2>
            <p>Chat with our support team for fast answers or start a sourcing conversation.</p>
            <Link href="https://api.whatsapp.com/send/?phone=%2B8617601255205&text&type=phone_number&app_absent=0" target="_blank">Chat on WhatsApp</Link>
          </aside>
        </section>
      </main>
    </>
  );
}
