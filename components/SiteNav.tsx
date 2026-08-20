"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const categoryGroups = [
  { title: "Headlights", href: "/headlights", text: "Fitment-led catalog" },
  { title: "Tail Lights", href: "/tail-lights", text: "Rear lighting catalog" },
  { title: "Exhaust Systems", href: "/exhaust", text: "View catalog" },
  { title: "Wheels", href: "/wheels", text: "Forged wheel inquiries" },
  { title: "Body Kits", href: "/body-kits", text: "Request quote" },
];

export function SiteNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<"categories" | "company" | null>(null);

  useEffect(() => setOpenMenu(null), [pathname]);

  useEffect(() => {
    const closeWhenOutside = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("pointerdown", closeWhenOutside);
    return () => document.removeEventListener("pointerdown", closeWhenOutside);
  }, []);

  return (
    <nav
      className={["site-nav", className].filter(Boolean).join(" ")}
      aria-label="Primary navigation"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpenMenu(null);
      }}
      ref={navRef}
    >
      <Link href="/">Home</Link>

      <div
        className={"nav-drawer wide" + (openMenu === "categories" ? " open" : "")}
        onMouseEnter={() => setOpenMenu("categories")}
        onMouseLeave={() => setOpenMenu(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenMenu(null);
        }}
      >
        <button
          aria-controls="product-category-menu"
          aria-expanded={openMenu === "categories"}
          aria-haspopup="menu"
          className="nav-drawer-trigger"
          onClick={() => setOpenMenu((current) => current === "categories" ? null : "categories")}
          type="button"
        >
          Categories
        </button>
        <div aria-label="Product categories" className="nav-panel category-panel" id="product-category-menu" role="menu">
          {categoryGroups.map((group) => (
            <Link className="nav-category-group nav-category-card" href={group.href} key={group.title} onClick={() => setOpenMenu(null)} role="menuitem">
              <span className="nav-category-title">{group.title}</span>
              <p>{group.text}</p>
            </Link>
          ))}
        </div>
      </div>

      <Link href="/products">Products</Link>
      <Link href="/fitment-check">Fitment Check</Link>
      <Link href="/news">News</Link>
      <Link href="/blog">Blog</Link>

      <div
        className={"nav-drawer company" + (openMenu === "company" ? " open" : "")}
        onMouseEnter={() => setOpenMenu("company")}
        onMouseLeave={() => setOpenMenu(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenMenu(null);
        }}
      >
        <button
          aria-controls="company-menu"
          aria-expanded={openMenu === "company"}
          aria-haspopup="menu"
          className="nav-drawer-trigger"
          onClick={() => setOpenMenu((current) => current === "company" ? null : "company")}
          type="button"
        >
          Company
        </button>
        <div aria-label="Company information" className="nav-panel company-panel" id="company-menu" role="menu">
          <Link className="nav-company-card" href="/about" onClick={() => setOpenMenu(null)} role="menuitem">
            <span>About Us</span>
            <small>Our company, sourcing approach, and buyer support.</small>
          </Link>
          <Link className="nav-company-card" href="/contact" onClick={() => setOpenMenu(null)} role="menuitem">
            <span>Contact Us</span>
            <small>Talk with the Cowinmotors parts and sourcing team.</small>
          </Link>
        </div>
      </div>
    </nav>
  );
}
