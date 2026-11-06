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

export function SiteNav({ className = "", includeSupport = false }: { className?: string; includeSupport?: boolean }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerType = useRef("");
  const categoryTrigger = useRef<HTMLButtonElement>(null);
  const companyTrigger = useRef<HTMLButtonElement>(null);
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

  const activate = (menu: MenuName, clickDetail: number) => {
    if (openMenu === menu && (clickDetail === 0 || pointerType.current !== "mouse")) close();
    else open(menu);
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
      onPointerDown={(event) => { pointerType.current = event.pointerType; }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && openMenu) {
          event.preventDefault();
          const trigger = openMenu === "categories" ? categoryTrigger : companyTrigger;
          close();
          trigger.current?.focus();
        }
      }}
      ref={navRef}
    >
      <Link href="/" onClick={close}>Home</Link>

      <div
        className={"nav-drawer wide" + (openMenu === "categories" ? " open" : "")}
        onPointerEnter={(event) => { if (event.pointerType === "mouse") open("categories"); }}
        onPointerLeave={(event) => { if (event.pointerType === "mouse") scheduleClose(); }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleClose();
        }}
      >
        <button
          aria-controls="product-category-menu"
          aria-expanded={openMenu === "categories"}
          className="nav-drawer-trigger"
          onClick={(event) => activate("categories", event.detail)}
          ref={categoryTrigger}
          type="button"
        >
          Categories
        </button>
        <div aria-label="Product categories" className="nav-panel category-panel" id="product-category-menu" role="group">
          {categoryGroups.map((group) => (
            <Link className="nav-category-group nav-category-card" href={group.href} key={group.title} onClick={close}>
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
        onPointerEnter={(event) => { if (event.pointerType === "mouse") open("company"); }}
        onPointerLeave={(event) => { if (event.pointerType === "mouse") scheduleClose(); }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleClose();
        }}
      >
        <button
          aria-controls="company-menu"
          aria-expanded={openMenu === "company"}
          className="nav-drawer-trigger"
          onClick={(event) => activate("company", event.detail)}
          ref={companyTrigger}
          type="button"
        >
          Company
        </button>
        <div aria-label="Company information" className="nav-panel company-panel" id="company-menu" role="group">
          <Link className="nav-company-card" href="/about" onClick={close}>
            <span>About Us</span>
            <small>Our company, sourcing approach, and buyer support.</small>
          </Link>
          <Link className="nav-company-card" href="/contact" onClick={close}>
            <span>Contact Us</span>
            <small>Talk with the Cowinmotors parts and sourcing team.</small>
          </Link>
          {includeSupport && <Link className="nav-company-card" href="/support" onClick={close}><span>Buyer Support</span><small>Fitment, shipping and order help.</small></Link>}
        </div>
      </div>
    </nav>
  );
}
