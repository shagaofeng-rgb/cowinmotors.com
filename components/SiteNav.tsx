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

type MenuName = "categories" | "company";

export function SiteNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);

  const cancelScheduledClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const open = (menu: MenuName) => {
    cancelScheduledClose();
    setOpenMenu(menu);
  };

  const close = () => {
    cancelScheduledClose();
    setOpenMenu(null);
  };

  const scheduleClose = () => {
    cancelScheduledClose();
    closeTimer.current = setTimeout(() => setOpenMenu(null), 160);
  };

  useEffect(() => {
    close();
  }, [pathname]);

  useEffect(() => () => cancelScheduledClose(), []);

  useEffect(() => {
    const closeWhenOutside = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", closeWhenOutside);
    return () => document.removeEventListener("pointerdown", closeWhenOutside);
  }, []);

  return (
    <nav
      className={["site-nav", className].filter(Boolean).join(" ")}
      aria-label="Primary navigation"
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
      ref={navRef}
    >
      <Link href="/" onClick={close}>Home</Link>

      <div
        className={"nav-drawer wide" + (openMenu === "categories" ? " open" : "")}
        onPointerEnter={() => open("categories")}
        onPointerLeave={scheduleClose}
        onFocus={() => open("categories")}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleClose();
        }}
      >
        <button
          aria-controls="product-category-menu"
          aria-expanded={openMenu === "categories"}
          aria-haspopup="menu"
          className="nav-drawer-trigger"
          onClick={() => openMenu === "categories" ? close() : open("categories")}
          type="button"
        >
          Categories
        </button>
        <div aria-label="Product categories" className="nav-panel category-panel" id="product-category-menu" role="menu">
          {categoryGroups.map((group) => (
            <Link className="nav-category-group nav-category-card" href={group.href} key={group.title} onClick={close} role="menuitem">
              <span className="nav-category-title">{group.title}</span>
              <p>{group.text}</p>
            </Link>
          ))}
        </div>
      </div>

      <Link href="/products" onClick={close}>Products</Link>
      <Link href="/fitment-check" onClick={close}>Fitment Check</Link>
      <Link href="/news" onClick={close}>News</Link>
      <Link href="/blog" onClick={close}>Blog</Link>

      <div
        className={"nav-drawer company" + (openMenu === "company" ? " open" : "")}
        onPointerEnter={() => open("company")}
        onPointerLeave={scheduleClose}
        onFocus={() => open("company")}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleClose();
        }}
      >
        <button
          aria-controls="company-menu"
          aria-expanded={openMenu === "company"}
          aria-haspopup="menu"
          className="nav-drawer-trigger"
          onClick={() => openMenu === "company" ? close() : open("company")}
          type="button"
        >
          Company
        </button>
        <div aria-label="Company information" className="nav-panel company-panel" id="company-menu" role="menu">
          <Link className="nav-company-card" href="/about" onClick={close} role="menuitem">
            <span>About Us</span>
            <small>Our company, sourcing approach, and buyer support.</small>
          </Link>
          <Link className="nav-company-card" href="/contact" onClick={close} role="menuitem">
            <span>Contact Us</span>
            <small>Talk with the Cowinmotors parts and sourcing team.</small>
          </Link>
        </div>
      </div>
    </nav>
  );
}
