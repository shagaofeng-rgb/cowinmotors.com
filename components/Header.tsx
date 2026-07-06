import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export function Header({
  cta = "Request wholesale quote",
}: {
  cta?: string;
}) {
  return (
    <>
      <div className="announcement">Factory Direct Manufacturer | Worldwide Shipping | Strict QC Inspection</div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Cowinmotors home">
          <img src="/assets/live/logo.jpg" alt="Cowinmotors logo" />
        </Link>
        <SiteNav className="main-nav" />
        <div className="header-actions">
          <form className="site-search" action="/products">
            <input name="q" type="search" aria-label="Search products" placeholder="Search products" />
            <button type="submit" aria-label="Search products" />
          </form>
          <Link className="header-cta" href="/quote">
            {cta}
          </Link>
        </div>
      </header>
    </>
  );
}
