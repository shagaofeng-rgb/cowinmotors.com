import { Header } from "@/components/Header";
import { QuoteForm } from "@/components/QuoteForm";

export const metadata = {
  title: "Request a Wholesale Automotive Parts Quote",
  description:
    "Send vehicle fitment, product type, quantity, destination country, and packaging requirements to request a Cowinmotors wholesale quote.",
  alternates: { canonical: "/quote" },
  robots: { index: false, follow: true },
};

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const params = await searchParams;

  return (
    <>
      <Header cta="Request quote" />
      <main>
        <section className="section rfq-section quote-page">
          <div className="rfq-copy">
            <p className="eyebrow">Request Quote</p>
            <h1>Tell us your vehicle and order requirement.</h1>
            <p>Send the product reference, vehicle details, quantity, destination country, and packaging requirements for review.</p>
          </div>
          <QuoteForm initialProduct={params.product || ""} />
        </section>
      </main>
    </>
  );
}
