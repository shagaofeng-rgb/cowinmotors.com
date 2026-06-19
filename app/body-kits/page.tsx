import Link from "next/link";
import { Header } from "@/components/Header";

export default function BodyKitsPage() {
  return (
    <>
      <Header announcement="Body kits usually need RFQ because of size, paint, fitment, and shipping class." cta="Request body kit quote" />
      <main>
        <section className="page-hero category-hero">
          <div>
            <p className="eyebrow">Body Kits</p>
            <h1>Quote-led exterior styling orders.</h1>
            <p>Confirm vehicle body type, front/rear/side/full-kit grouping, material, finish, paint requirement, drilling requirement and shipping method.</p>
            <Link className="button primary" href="/quote?product=Body%20Kit%20RFQ">Start body kit RFQ</Link>
          </div>
          <img src="/assets/live/category-body-kits.png" alt="Body kit exterior styling parts" />
        </section>
        <section className="section support-grid bodykit-notes">
          <article><h3>Fitment</h3><p>Year, make, model, trim, body type and region spec must be confirmed before quote.</p></article>
          <article><h3>Finish</h3><p>Confirm ABS, carbon fiber style, gloss black, primer, painted or unpainted requirement.</p></article>
          <article><h3>Shipping</h3><p>Oversized cartons need quote-specific shipping estimates and import-duty notice.</p></article>
          <article><h3>MOQ</h3><p>Sample and wholesale orders can use different packaging, lead time and payment terms.</p></article>
        </section>
      </main>
    </>
  );
}
