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
  ["Shipping & Delivery", "Worldwide shipping options, delivery time, tracking and customs information."],
  ["Payments", "Accepted payment methods, currency, invoices and payment terms."],
  ["Returns & Warranty", "Return eligibility, process, warranty coverage and claims support."],
  ["Fitment & Compatibility", "Check fitment by year, model, trim, engine and connector type before ordering."],
  ["Track Your Order", "Track shipments, view order status and get delivery updates in real time."],
  ["Installation Guidance", "Installation tips, manuals, wiring guides and product documents."],
  ["Sourcing & Bulk Orders", "Request sourcing or bulk quotation for products not listed online."],
  ["Contact Us", "Email, WhatsApp, phone support and regional representative help."],
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
              Global distributor of headlights, tail lights, exhaust systems, wheels and body kits. Expert support for retail buyers
              worldwide before, during and after your order.
            </p>
            <div className="support-actions">
              <Link href="mailto:racheljiang@cowinmotors.com">Contact Support</Link>
              <Link href="https://api.whatsapp.com/send/?phone=%2B8617601255205&text&type=phone_number&app_absent=0" target="_blank">Chat on WhatsApp</Link>
              <Link href="/quote?product=Sourcing%20Request">Sourcing Request</Link>
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
            {topics.map(([title, text]) => (
              <article key={title}>
                <i aria-hidden="true" />
                <h2>{title}</h2>
                <p>{text}</p>
                <Link href="/quote">Learn more</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="support-contact-row">
          <article>
            <strong>Email Us</strong>
            <a href="mailto:racheljiang@cowinmotors.com">racheljiang@cowinmotors.com</a>
            <span>We reply within 24h.</span>
          </article>
          <article>
            <strong>WhatsApp</strong>
            <a href="https://api.whatsapp.com/send/?phone=%2B8617601255205&text&type=phone_number&app_absent=0" target="_blank">+86 176 0125 5205</a>
            <span>Chat with our team.</span>
          </article>
          <article>
            <strong>Working Hours</strong>
            <span>Mon - Fri 9:00 - 18:00 (GMT+8)</span>
            <span>Weekends by appointment.</span>
          </article>
          <article>
            <strong>Response Promise</strong>
            <span>We aim to respond to inquiries within 24 hours.</span>
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
                <p>Please contact our team with your vehicle and order details. We will confirm the correct answer before you place an order.</p>
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
