"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const categoryGroups = [
  {
    title: "Headlights",
    href: "/headlights",
    text: "View catalog",
  },
  {
    title: "Tail Lights",
    href: "/tail-lights",
    text: "View catalog",
  },
  {
    title: "Exhaust Systems",
    href: "/exhaust",
    text: "View catalog",
  },
  {
    title: "Wheels",
    href: "/wheels",
    text: "Forged catalog",
  },
  {
    title: "Body Kits",
    href: "/body-kits",
    text: "Request quote",
  },
];

export function SiteNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const closeWhenOutside = (event: PointerEvent) => {
      if (!drawerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeWhenOutside);
    return () => document.removeEventListener("pointerdown", closeWhenOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    const closeWhenPointerLeaves = (event: PointerEvent) => {
      if (event.pointerType !== "touch" && !drawerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const closeWhenMouseLeaves = (event: MouseEvent) => {
      if (!drawerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    window.addEventListener("pointermove", closeWhenPointerLeaves);
    window.addEventListener("mousemove", closeWhenMouseLeaves);
    return () => {
      window.removeEventListener("pointermove", closeWhenPointerLeaves);
      window.removeEventListener("mousemove", closeWhenMouseLeaves);
    };
  }, [open]);

  return (
    <nav className={`site-nav ${className}`.trim()} aria-label="Primary navigation">
      <Link href="/">Home</Link>

      <div
        className={`nav-drawer wide${open ? " open" : ""}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onPointerLeave={() => setOpen(false)}
        onBlur={(event) => {
          if (!drawerRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
        }}
        ref={drawerRef}
      >
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          className="nav-drawer-trigger"
          onClick={() => setOpen(true)}
          type="button"
        >
          Categories
        </button>
        <div aria-label="Product categories" className="nav-panel category-panel" role="menu">
          {categoryGroups.map((group) => (
            <Link className="nav-category-group nav-category-card" href={group.href} key={group.title} role="menuitem">
              <span className="nav-category-title">{group.title}</span>
              <p>{group.text}</p>
            </Link>
          ))}
        </div>
      </div>

      <Link href="/products">New Arrivals</Link>
      <Link href="/products?status=popular">Best Sellers</Link>
      <Link href="/support">About</Link>
      <Link href="/quote">Contact</Link>
    </nav>
  );
}
