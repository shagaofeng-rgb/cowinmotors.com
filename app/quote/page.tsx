import Link from "next/link";
import { ArrowUpRight, ClipboardList, Mail, MessageCircle } from "lucide-react";
import { InnerBreadcrumb, InnerPage } from "@/components/InnerPage";
import { QuoteForm } from "@/components/QuoteForm";
import { productCategoryOptions } from "@/lib/products";

export const metadata = {
  title: "Request a Wholesale Automotive Parts Quote",
  description:
    "Send vehicle fitment, product type, quantity, destination country, and packaging requirements to request a Cowinmotors wholesale quote.",
  alternates: { canonical: "/quote" },
  robots: { index: false, follow: true },
};

export default async function QuotePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const category = params.category === "wheels" ? "Forged Wheels" : productCategoryOptions.find(({ slug }) => slug === params.category)?.label || "";
  const product = typeof params.product === "string" ? params.product.slice(0, 240) : "";

  return (
    <InnerPage>
      <div className="cm-wrap cm-quote-page">
        <InnerBreadcrumb items={[{ label: "Request a quote" }]} />
        <section className="cm-inquiry-layout cm-quote-layout">
          <div className="cm-inquiry-aside cm-quote-head">
            <h1>Request a quote</h1>
            <p>Send a part reference, vehicle details, quantity and destination for sourcing and fitment review.</p>
          </div>
          <QuoteForm initialProduct={product} initialCategory={category} lighting={!category || category === "Headlights" || category === "Tail Lights"} />
          <aside className="cm-quote-side">
            <div className="cm-quote-help">
              <h2><ClipboardList size={21} aria-hidden="true" /> Before you submit</h2>
              <ul><li>Product URL, SKU or OE number</li><li>Year, make, model and trim</li><li>Quantity and destination country</li></ul>
              <Link className="cm-text-link" href="/fitment-check">Fitment checklist <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </div>
            <div className="cm-contact-mini">
              <a className="cm-text-link" href="mailto:info@cowinmotors.com"><Mail size={18} aria-hidden="true" /> info@cowinmotors.com</a>
              <a className="cm-text-link" href="https://wa.me/8617601255205" target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden="true" /> WhatsApp sales</a>
            </div>
          </aside>
        </section>
      </div>
    </InnerPage>
  );
}
