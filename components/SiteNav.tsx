import Link from "next/link";

const categoryGroups = [
  {
    title: "Headlights",
    href: "/headlights",
    text: "LED, DRL, projector and OE-style fitment.",
  },
  {
    title: "Tail Lights",
    href: "/tail-lights",
    text: "Rear lamps, side, connector and signal checks.",
  },
  {
    title: "Exhaust Systems",
    href: "/exhaust",
    text: "Cat-back, axle-back, downpipe and exhaust tips.",
  },
  {
    title: "Wheels",
    href: "/wheels",
    text: "Forged automotive wheels for verified fitment.",
  },
  {
    title: "Body Kits",
    href: "/body-kits",
    text: "Full kits, lips, diffusers, side skirts and spoilers.",
  },
];

export function SiteNav({ className = "" }: { className?: string }) {
  return (
    <nav className={`site-nav ${className}`.trim()} aria-label="Primary navigation">
      <Link href="/">Home</Link>

      <div className="nav-drawer wide">
        <Link className="nav-drawer-trigger" href="/products">Categories</Link>
        <div className="nav-panel category-panel">
          {categoryGroups.map((group) => (
            <Link className="nav-category-group nav-category-card" href={group.href} key={group.title}>
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
