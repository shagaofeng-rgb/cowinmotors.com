import { Header } from "@/components/Header";

export const metadata = {
  title: "Automotive Parts Order Support",
  description:
    "Get support for Cowinmotors automotive parts orders, including fitment confirmation, shipping, payment, warranty, returns, tracking, and installation documents.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <>
      <Header cta="Request quote" />
      <main>
        <section className="page-hero">
          <p className="eyebrow">Support Center</p>
          <h1>Order support for global automotive parts buyers.</h1>
          <p>Get clear guidance on shipping, payment, returns, warranty, fitment confirmation, and installation documents before placing an order.</p>
        </section>
        <section className="section support-grid">
          <article><h3>Shipping & Payment</h3><p>Worldwide shipping options can be confirmed by destination, product size, quantity, and preferred logistics method.</p></article>
          <article><h3>Returns & Warranty</h3><p>Contact support before returning any item so the order, product condition, packaging, and return address can be confirmed.</p></article>
          <article><h3>Track Order</h3><p>Tracking details are provided after shipment, including carrier information and available logistics updates.</p></article>
          <article><h3>Installation Documents</h3><p>Available support may include wiring notes, product photos, packing lists, exhaust installation guidance, and fitment confirmation.</p></article>
          <article><h3>Compatibility Help</h3><p>Confirm year, trim, body type, engine, region spec, LHD/RHD and connector style before shipment.</p></article>
          <article><h3>Contact</h3><p>Email: <a href="mailto:racheljiang@cowinmotors.com">racheljiang@cowinmotors.com</a>. WhatsApp is available from the floating button.</p></article>
        </section>
      </main>
    </>
  );
}
