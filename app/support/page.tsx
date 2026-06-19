import { Header } from "@/components/Header";

export default function SupportPage() {
  return (
    <>
      <Header announcement="Support helps buyers confirm fitment, shipping, returns, warranty and installation information." cta="Request quote" />
      <main>
        <section className="page-hero">
          <p className="eyebrow">Support Center</p>
          <h1>Clear support pages for global buyers.</h1>
          <p>Keep order, shipping, return, warranty, fitment and manuals visible so buyers feel safe before checkout or RFQ.</p>
        </section>
        <section className="section support-grid">
          <article><h3>Shipping & Payment</h3><p>Free Shipping Worldwide is shown on the live site. Delivery estimates are listed as 7-12 days, with DHL, UPS, TNT, FedEx and EMS usually used.</p></article>
          <article><h3>Returns & Warranty</h3><p>The live store has a 30-day return policy. Buyers should contact support before returning any item.</p></article>
          <article><h3>Track Order</h3><p>Connect this page later to Shopline order tracking or logistics tracking URLs.</p></article>
          <article><h3>Installation Manuals</h3><p>Add downloadable manuals, wiring diagrams, exhaust install guides, sound videos and packing lists.</p></article>
          <article><h3>Compatibility Help</h3><p>Confirm year, trim, body type, engine, region spec, LHD/RHD and connector style before shipment.</p></article>
          <article><h3>Contact</h3><p>Email: <a href="mailto:racheljiang@cowinmotors.com">racheljiang@cowinmotors.com</a>. WhatsApp is available from the floating button.</p></article>
        </section>
      </main>
    </>
  );
}
