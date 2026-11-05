import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import type { ReactNode } from "react";
import { InnerMobileNav } from "@/components/InnerMobileNav";
import { SiteNav } from "@/components/SiteNav";
import { UI_ASSETS } from "@/lib/ui-assets";
import "@/app/inner.css";

export function InnerPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <>
      <a className="cm-skip" href="#cm-content">Skip to content</a>
      <header className="site-header cm-header">
        <div className="cm-wrap cm-header-row">
          <Link className="cm-wordmark" href="/" aria-label="Cowinmotors home">
            <img src={UI_ASSETS.logo} alt="" width="43" height="43" />
            <span>Cowinmotors</span>
          </Link>
          <SiteNav className="cm-desktop-nav" includeSupport />
          <form className="cm-header-search" action="/products" role="search" aria-label="Catalog">
            <input name="q" type="search" aria-label="Search products" placeholder="Search parts" />
            <button type="submit" title="Search parts" aria-label="Search parts"><Search size={18} /></button>
          </form>
          <Link className="cm-btn cm-btn-primary cm-header-quote" href="/quote">Get a quote</Link>
          <InnerMobileNav />
        </div>
      </header>
      <main className={`cm-inner ${className}`} id="cm-content">{children}</main>
    </>
  );
}

export function InnerBreadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="cm-crumb" aria-label="Breadcrumb">
      <ol>
        <li><Link href="/">Home</Link></li>
        {items.map(({ label, href }) => (
          <li key={href || label}>
            <ChevronRight size={13} aria-hidden="true" />
            {href ? <Link href={href}>{label}</Link> : <span aria-current="page">{label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
