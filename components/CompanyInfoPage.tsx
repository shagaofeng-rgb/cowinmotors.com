import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ClipboardList, Mail, MessageCircle } from "lucide-react";
import { CompanyMap } from "@/components/CompanyMap";
import { InnerBreadcrumb, InnerPage } from "@/components/InnerPage";
import { OrderStatusForm } from "@/components/OrderStatusForm";
import "@/app/guides.css";

const company = "Quzhou Qiying Import & Export Co., Ltd.";
const address = "Room 110, 1st Floor, Building 1, Qushidai Future Building, Kecheng District, Quzhou, Zhejiang Province, China";

const pages = {
  about: { title: "About Cowinmotors Automotive Parts", description: "Cowinmotors Automotive Parts is a China-based automotive parts sourcing and export partner for fitment-led B2B and retail-friendly inquiries.", sections: [["Who we are", "Cowinmotors Automotive Parts is operated by Quzhou Qiying Import & Export Co., Ltd. We help international buyers source aftermarket automotive parts with vehicle-fitment checks, product-detail confirmation, packaging review, and export coordination."], ["How we work", "We do not represent unverified factory ownership, brand authorization, inventory, or certifications. Product details, vehicle configuration, quantity, packaging, and destination are confirmed before quotation."], ["Who we support", "Importers, distributors, retailers, e-commerce sellers, repair and modification shops, and vehicle owners can submit a sourcing inquiry."]] },
  contact: { title: "Contact Cowinmotors Automotive Parts", description: "Contact Cowinmotors Automotive Parts for fitment confirmation, automotive parts sourcing, packaging review, and export coordination.", sections: [["Sales and sourcing", "Email info@cowinmotors.com. WhatsApp / Phone: +86 176 0125 5205."], ["What to send", "For an accurate response, send the product URL or SKU, vehicle year, make, model, trim or engine, LHD/RHD where relevant, OE number or product photo, quantity, and destination country."], ["Company address", `${company}\n${address}`]] },
  "quality-control": { title: "Quality Control Support for Automotive Parts Orders", description: "Learn how Cowinmotors coordinates product and packaging checks before shipment when applicable.", sections: [["Pre-shipment QC support", "Cowinmotors can coordinate product-photo confirmation and packaging review before shipment. The exact check scope depends on the product, supplier arrangement, and order requirements."], ["What can be checked", "Buyers can request confirmation of product reference, visible configuration, quantity, labels, and packaging condition when applicable. This is coordination support, not a claim of third-party certification."], ["Before ordering", "Share the required product reference, specification, packaging requirement, and acceptance criteria before quotation."]] },
  "packaging-shipping": { title: "Packaging and Shipping Coordination", description: "Packaging review, shipping coordination, and export documentation support for automotive parts orders.", sections: [["Packaging options", "Carton, pallet, and wooden-crate options may be available depending on the product, dimensions, destination, and supplier arrangement. Requirements are confirmed before ordering."], ["Shipping coordination", "Shipping methods, destination terms, and documentation requirements are reviewed with the buyer. Transit time, import taxes, and local clearance requirements are not assumed."], ["Export documentation", "Export documentation support is subject to product and destination requirements. Buyers should confirm their importer-of-record and local compliance obligations."]] },
  "fitment-check": { title: "Automotive Parts Fitment Check", description: "Send vehicle details and a product reference so Cowinmotors can coordinate a fitment check before quotation.", sections: [["Fitment details needed", "Provide vehicle year, make, model, trim, engine, market version, LHD/RHD when relevant, required side or set, OE number, and product photo if available."], ["Why fitment matters", "Lighting, exhaust, wheels, and body components can vary by market, configuration, connector, engine, or body style. Fitment is checked before ordering rather than assumed from a model name alone."], ["Start a request", "Use the quotation form to send the vehicle and product details. The team will review the available information before quotation."]] },
  "wholesale-auto-parts-sourcing": { title: "Wholesale Automotive Parts Sourcing Support", description: "Cowinmotors supports automotive parts sourcing inquiries for international buyers with product and fitment confirmation.", sections: [["Sourcing process", "Send the part reference and vehicle details. We review available product information, fitment needs, quantity, packaging, and destination before preparing a quotation."], ["For wholesale and retail-friendly orders", "Requests from distributors, retailers, workshops, e-commerce sellers, and vehicle owners are reviewed individually. Minimum quantity and packaging are confirmed per item rather than assumed."], ["Independent partner", "Cowinmotors is an independent automotive parts sourcing and export partner. Third-party vehicle brand names are used only to indicate compatibility."]] },
  "returns-warranty": { title: "Returns and Warranty Information", description: "Returns and warranty matters are reviewed against the confirmed product, condition, and order terms.", sections: [["Before ordering", "Confirm product reference, vehicle fitment, configuration, packaging, and destination requirements before payment. This reduces preventable fitment and transit issues."], ["If an issue occurs", "Keep product photos, packaging photos, labels, and the order reference. Contact the sales team promptly so the issue can be reviewed against the confirmed order details."], ["Warranty and return terms", "Warranty coverage, return eligibility, and any remedy depend on the confirmed product and order terms. No blanket warranty period or local return facility is represented on this website."]] },
  payment: { title: "Payment Methods for Automotive Parts Orders", description: "Payment method and order terms are confirmed after product details, fitment, quantity, packaging, and destination are reviewed.", sections: [["Quotation first", "Cowinmotors confirms the requested product information and order requirements before issuing payment instructions."], ["Order records", "Buyers should verify the quotation, product reference, destination, and payment beneficiary details through the official sales contacts before making a payment."], ["Questions", "Use the contact page or quotation form to request clarification before payment."]] },
  "track-your-order": { title: "Track Your Automotive Parts Order", description: "Request a shipment-status update using the confirmed Cowinmotors order reference.", sections: [["Information to provide", "Send your confirmed order or quotation reference, the receiving company name, and destination country. This helps the team locate the correct shipment record."], ["Status review", "Shipment status is reviewed against the confirmed order and available carrier or forwarding information. Transit milestones and local clearance are not assumed."], ["Need a correction", "If product, packing, or address information appears incorrect, contact the sales team immediately with photos and the applicable order reference."]] },
  "installation-guidance": { title: "Installation Guidance for Automotive Parts", description: "Review fitment and installation information before arranging work on automotive parts.", sections: [["Before installation", "Confirm the vehicle year, make, model, trim, engine, market version, LHD/RHD where relevant, and the exact product reference before installation."], ["Documentation", "Installation instructions, connector information, coding needs, and hardware scope depend on the item. Request available documentation for the confirmed product before work begins."], ["Professional assessment", "Installation suitability and local road-use or compliance requirements should be assessed by a qualified installer and the buyer for the destination market."]] },
  "sourcing-bulk-orders": { title: "Sourcing and Bulk Orders", description: "Submit a wholesale or bulk automotive parts inquiry with fitment, quantity, packaging, and destination requirements.", sections: [["What to send", "Provide the product URL, SKU, OE number, or reference photo with vehicle details, required quantity, packaging expectations, and destination country or port."], ["Review process", "Each request is reviewed against available product information and fitment needs before quotation. Quantity, packaging, and export requirements are confirmed per item."], ["Unlisted parts", "For a part not displayed in the catalog, send the vehicle information and product reference. Cowinmotors can review the sourcing request without representing that a specific item is available until confirmed."]] },
  "contact-support": { title: "Contact Automotive Parts Support", description: "Contact Cowinmotors support for product, fitment, packaging, order, and sourcing questions.", sections: [["Official support contacts", "Email info@cowinmotors.com. WhatsApp / Phone: +86 176 0125 5205."], ["For a useful review", "Include your product or order reference, vehicle details where relevant, photos, quantity, destination, and the specific question you need answered."], ["Business details", `${company}\n${address}`]] },
  "privacy-policy": { title: "Privacy Policy", description: "How Cowinmotors Automotive Parts handles inquiry and website information.", sections: [["Information collected", "We collect the contact and product-request information submitted through website forms to respond to sourcing and fitment inquiries."], ["How information is used", "Information is used to review requests, communicate with the inquirer, coordinate quotations, and maintain inquiry records. We do not sell inquiry information."], ["Contact", "For privacy questions, contact info@cowinmotors.com."]] },
  terms: { title: "Terms of Use", description: "Terms for using the Cowinmotors Automotive Parts website and submitting an inquiry.", sections: [["Informational catalog", "Product listings are inquiry-led catalog records. Buyers must confirm the exact vehicle configuration, product details, packaging, compliance needs, and order terms before ordering."], ["Compatibility names", "Vehicle and third-party brand names are used only to indicate compatibility. They do not state affiliation, authorization, or original-equipment status."], ["Quotes and orders", "A website inquiry is not an offer, stock confirmation, or binding delivery commitment. Final terms are confirmed in the applicable quotation and order documents."]] },
} as const;

export type CompanyPageKey = keyof typeof pages;

const views: Record<CompanyPageKey, { title: string; action?: [string, string]; image?: string; imageCaption?: string }> = {
  about: { title: "About Cowinmotors", action: ["/contact", "Talk to the team"], image: "/assets/ui/interior/sourcing.webp", imageCaption: "Sourcing workflow illustration" },
  contact: { title: "Contact Cowinmotors", action: ["/quote", "Request a quote"] },
  "quality-control": { title: "Quality control", action: ["/quote", "Discuss inspection requirements"] },
  "packaging-shipping": { title: "Packaging & shipping", action: ["/quote", "Discuss packaging and freight"] },
  "fitment-check": { title: "Vehicle fitment check", action: ["/quote", "Request a fitment review"] },
  "wholesale-auto-parts-sourcing": { title: "Wholesale parts sourcing", action: ["/quote", "Request a wholesale quote"], image: "/assets/ui/interior/sourcing.webp", imageCaption: "Sourcing workflow illustration" },
  "returns-warranty": { title: "Returns & warranty", action: ["/contact-support", "Contact order support"] },
  payment: { title: "Payment methods", action: ["/contact", "Verify payment instructions"] },
  "track-your-order": { title: "Track your order", action: ["/contact-support", "Contact order support"] },
  "installation-guidance": { title: "Installation guidance", action: ["/contact-support", "Request installation documents"] },
  "sourcing-bulk-orders": { title: "Sourcing & bulk orders", action: ["/quote", "Request a bulk quote"] },
  "contact-support": { title: "Contact order support", action: ["/track-your-order", "Request shipment status"] },
  "privacy-policy": { title: "Privacy policy" },
  terms: { title: "Terms of use" },
};

function sectionId(text: string) { return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""); }

export function companyPageMetadata(key: CompanyPageKey): Metadata {
  const page = pages[key];
  return { title: page.title, description: page.description, alternates: { canonical: `/${key}` } };
}

export function CompanyInfoPage({ pageKey }: { pageKey: CompanyPageKey }) {
  const page = pages[pageKey];
  const view = views[pageKey];
  const isContact = pageKey === "contact" || pageKey === "contact-support";
  const isPolicy = pageKey === "privacy-policy" || pageKey === "terms";
  const hasParent = !isPolicy && pageKey !== "about" && pageKey !== "contact";

  return (
    <InnerPage className="cm-guide-page">
      <div className="cm-guide-intro">
        <div className="cm-wrap">
          <InnerBreadcrumb items={[...(hasParent ? [{ label: "Support", href: "/support" }] : []), { label: view.title }]} />
          <h1>{view.title}</h1>
          <p>{page.description}</p>
          {!isContact && view.action && pageKey !== "track-your-order" && (
            <Link className="cm-btn cm-btn-primary" href={view.action[0]}>{view.action[1]} <ArrowUpRight size={18} aria-hidden="true" /></Link>
          )}
        </div>
      </div>
      {isContact && (
        <section className="cm-wrap cm-contact-channels" aria-label="Official contact channels">
          <a href="mailto:info@cowinmotors.com"><Mail aria-hidden="true" /><span><strong>Email</strong><small>info@cowinmotors.com</small></span><ArrowUpRight size={19} aria-hidden="true" /></a>
          <a href="https://wa.me/8617601255205" target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" /><span><strong>WhatsApp</strong><small>+86 176 0125 5205</small></span><ArrowUpRight size={19} aria-hidden="true" /></a>
          {view.action && <Link href={view.action[0]}><ClipboardList aria-hidden="true" /><span><strong>{view.action[1]}</strong><small>{pageKey === "contact" ? "Vehicle and part inquiries" : "Use an order reference"}</small></span><ArrowRight size={19} aria-hidden="true" /></Link>}
        </section>
      )}
      <div className="cm-wrap cm-guide-layout">
        <aside className="cm-guide-index">
          <nav aria-label="On this page">
            <strong>On this page</strong>
            {pageKey === "track-your-order" && <a href="#order-status">Shipment status request</a>}
            {page.sections.map(([heading]) => <a key={heading} href={`#${sectionId(heading)}`}>{heading}</a>)}
            {pageKey === "contact" && <a href="#company-location">Company location</a>}
          </nav>
          {hasParent && <Link className="cm-text-link" href="/support">Buyer support <ArrowRight size={16} aria-hidden="true" /></Link>}
        </aside>
        <article className="cm-guide-content">
          {pageKey === "track-your-order" && <section id="order-status"><h2>Request shipment status</h2><p>Use the confirmed order or quotation reference. Our team will review the available carrier or forwarding information.</p><OrderStatusForm /></section>}
          {view.image && <figure className="cm-guide-visual"><img src={view.image} alt="" loading="lazy" decoding="async" /><figcaption>{view.imageCaption}</figcaption></figure>}
          {page.sections.map(([heading, body]) => (
            <section id={sectionId(heading)} key={heading}>
              <h2>{heading}</h2>
              {body.split("\n").map((line) => <p key={line}>{line.includes("info@cowinmotors.com") ? <>{line.split("info@cowinmotors.com")[0]}<a href="mailto:info@cowinmotors.com">info@cowinmotors.com</a>{line.split("info@cowinmotors.com")[1]}</> : line}</p>)}
            </section>
          ))}
          {pageKey === "contact" && <div id="company-location"><CompanyMap /></div>}
        </article>
      </div>
    </InnerPage>
  );
}
