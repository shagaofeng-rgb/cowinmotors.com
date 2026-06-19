import { Header } from "@/components/Header";
import { QuoteForm } from "@/components/QuoteForm";

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const params = await searchParams;

  return (
    <>
      <Header announcement="RFQ is recommended for wholesale, bulky, painted, custom, or mixed-container orders." cta="Request quote" />
      <main>
        <section className="section rfq-section quote-page">
          <div className="rfq-copy">
            <p className="eyebrow">Request Quote</p>
            <h1>Tell us your vehicle and order requirement.</h1>
            <p>Send year, make, model, trim, product type, quantity, destination country, and any certification or packaging requirements.</p>
          </div>
          <QuoteForm initialProduct={params.product || ""} />
        </section>
      </main>
    </>
  );
}
