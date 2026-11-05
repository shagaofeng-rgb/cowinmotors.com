import Link from "next/link";
import { ArrowRight, CarFront, ChevronDown, ClipboardCheck, CreditCard, Mail, MessageCircle, PackageCheck, PackageSearch, Search, Wrench, Boxes, RotateCcw } from "lucide-react";
import { InnerBreadcrumb, InnerPage } from "@/components/InnerPage";
import "@/app/guides.css";

export const metadata = {
  title: "Automotive Parts Order Support",
  description: "Get support for Cowinmotors automotive parts orders, including fitment confirmation, shipping, payment, warranty, returns, tracking, and installation documents.",
  alternates: { canonical: "/support" },
};

const groups = [
  { title: "Before ordering", links: [
    { title: "Vehicle fitment check", text: "Confirm year, configuration and the original part reference.", href: "/fitment-check", icon: CarFront, keywords: "compatible vehicle model oe headlight" },
    { title: "Sourcing & bulk orders", text: "Request quotes for listed and unlisted parts.", href: "/sourcing-bulk-orders", icon: Boxes, keywords: "wholesale quantity quote sample" },
    { title: "Payment methods", text: "Verify quotation and beneficiary details before paying.", href: "/payment", icon: CreditCard, keywords: "pay bank transfer invoice" },
    { title: "Quality control", text: "Discuss product, quantity and packing checks.", href: "/quality-control", icon: ClipboardCheck, keywords: "qc inspect inspection condition photo" },
  ] },
  { title: "Order & installation support", links: [
    { title: "Packaging & shipping", text: "Review protection, freight and export requirements.", href: "/packaging-shipping", icon: PackageCheck, keywords: "shipment delivery shipping time transport tracking box" },
    { title: "Track your order", text: "Request a shipment update using your order reference.", href: "/track-your-order", icon: PackageSearch, keywords: "where is my order tracking status shipment delivery" },
    { title: "Installation guidance", text: "Check required connectors, hardware or documentation.", href: "/installation-guidance", icon: Wrench, keywords: "install instruction coding wire guide" },
    { title: "Returns & warranty", text: "Prepare photos and the order reference for review.", href: "/returns-warranty", icon: RotateCcw, keywords: "return refund exchange damaged problem warranty claim" },
  ] },
];

const faqs = [
  ["What do I need for a fitment check?", "Send the year, make, model and trim with a part number or photo. For lighting, include the original lamp and market version.", "/fitment-check"],
  ["Can I get an update on a shipment?", "Use the confirmed order or quotation reference. We'll review the shipment information available for that order.", "/track-your-order"],
  ["What should I send if a part arrives damaged?", "Keep photos of the part, packaging and labels, then contact support with your order reference.", "/returns-warranty"],
];

export default async function SupportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const tokens = query.toLowerCase().match(/[a-z0-9]+/g) || [];
  const filtered = groups.map((group) => ({ ...group, links: group.links.filter((item) => tokens.every((token) => `${item.title} ${item.text} ${item.keywords}`.toLowerCase().includes(token))) }));
  const matchCount = filtered.reduce((sum, group) => sum + group.links.length, 0);

  return (
    <InnerPage className="cm-support-page">
      <div className="cm-support-intro">
        <div className="cm-wrap">
          <InnerBreadcrumb items={[{ label: "Buyer support" }]} />
          <h1>Buyer support</h1>
          <p>Fitment, shipping, payment and help with an existing order.</p>
          <form action="/support" className="cm-support-search" role="search" aria-label="Support topics">
            <label>Search support topics<input name="q" type="search" placeholder="e.g. shipping or warranty" defaultValue={query} maxLength={100} /></label>
            <button className="cm-btn cm-btn-primary" type="submit"><Search size={18} aria-hidden="true" /> Search</button>
          </form>
        </div>
      </div>
      <div className="cm-wrap cm-support-content">
        <div>
          {query && <div className="cm-section-head"><h2>{matchCount ? `Results for "${query}"` : "No matching topics"}</h2><Link href="/support" className="cm-text-link">Clear search</Link></div>}
          {!matchCount && <p>Try a shorter keyword or contact support with your question.</p>}
          {filtered.filter((group) => group.links.length).map(({ title, links }) => (
            <section className="cm-support-group" key={title}>
              <h2>{title}</h2>
              <div className="cm-support-list">
                {links.map(({ title: label, text, href, icon: Icon }) => <Link key={href} href={href}><Icon size={22} aria-hidden="true" /><span><strong>{label}</strong><small>{text}</small></span><ArrowRight size={18} aria-hidden="true" /></Link>)}
              </div>
            </section>
          ))}
        </div>
        <aside className="cm-support-aside">
          <h2>Contact support</h2>
          <p>Include the order or part reference and any photos that help explain the issue.</p>
          <a className="cm-text-link" href="mailto:info@cowinmotors.com"><Mail size={18} aria-hidden="true" /> Email support</a>
          <a className="cm-text-link" href="https://wa.me/8617601255205" target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden="true" /> WhatsApp support</a>
          <Link className="cm-text-link" href="/contact-support">Official contact details <ArrowRight size={16} aria-hidden="true" /></Link>
        </aside>
      </div>
      {!query && <section className="cm-wrap cm-support-faq"><h2>Common questions</h2><div className="cm-accordion">{faqs.map(([question, answer, href]) => <details key={href}><summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{answer} <Link className="cm-text-link" href={href}>Read more</Link></p></details>)}</div></section>}
    </InnerPage>
  );
}
