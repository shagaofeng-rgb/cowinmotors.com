import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InnerBreadcrumb, InnerPage } from "@/components/InnerPage";
import "@/app/guides.css";

export default function NotFound() {
  return (
    <InnerPage className="cm-guide-page">
      <div className="cm-wrap">
        <InnerBreadcrumb items={[{ label: "Page not found" }]} />
        <section className="cm-404">
          <h1>Page not found</h1>
          <p>The page may have moved or the part is no longer listed. Search the catalog or ask for sourcing support.</p>
          <div className="cm-inline-actions"><Link className="cm-btn cm-btn-primary" href="/products">Browse the catalog <ArrowRight size={18} aria-hidden="true" /></Link><Link className="cm-btn cm-btn-outline" href="/support">Buyer support</Link></div>
        </section>
      </div>
    </InnerPage>
  );
}
