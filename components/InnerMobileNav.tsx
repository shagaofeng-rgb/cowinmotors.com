"use client";

import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const links = [
  { label: "All products", href: "/products" }, { label: "Headlights", href: "/headlights" },
  { label: "Tail lights", href: "/tail-lights" }, { label: "Exhaust systems", href: "/exhaust" },
  { label: "Forged wheels", href: "/wheels" }, { label: "Body kit sourcing", href: "/body-kits" },
  { label: "Fitment check", href: "/fitment-check" }, { label: "Buyer support", href: "/support" },
  { label: "News", href: "/news" }, { label: "Buyer guides", href: "/blog" },
  { label: "About us", href: "/about" }, { label: "Contact", href: "/contact" },
];

export function InnerMobileNav() {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const close = () => { if (ref.current) ref.current.open = false; };

  useEffect(close, [pathname]);
  useEffect(() => {
    const onOutside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, []);

  return (
    <details className="cm-menu" ref={ref} onKeyDown={(event) => {
      if (event.key === "Escape" && ref.current?.open) {
        close();
        ref.current.querySelector("summary")?.focus();
      }
    }}>
      <summary title="Navigation menu" aria-label="Navigation menu"><Menu size={23} /><X size={23} /></summary>
      <div className="cm-menu-panel">
        <form action="/products" className="cm-header-search" role="search" aria-label="Mobile catalog">
          <input name="q" type="search" aria-label="Search products" placeholder="Search parts" />
          <button type="submit" aria-label="Search parts"><Search size={19} /></button>
        </form>
        <nav aria-label="Mobile navigation">
          {links.map(({ label, href }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={close}>{label}</Link>
          ))}
        </nav>
      </div>
    </details>
  );
}
