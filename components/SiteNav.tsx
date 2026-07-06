import Link from "next/link";

const vehicleLinks = [
  ["BMW", "/products?make=BMW"],
  ["Mercedes-Benz", "/products?make=Mercedes-Benz"],
  ["Audi", "/products?make=Audi"],
  ["Porsche", "/products?make=Porsche"],
  ["Volkswagen", "/products?make=Volkswagen"],
  ["Tesla", "/products?make=Tesla"],
  ["Toyota", "/products?make=Toyota"],
  ["Honda", "/products?make=Honda"],
];

const categoryGroups = [
  {
    title: "Headlights",
    href: "/headlights",
    text: "LED, DRL, projector and OE-style fitment.",
    children: [
      ["BMW Headlights", "/headlights?make=BMW"],
      ["Audi Headlights", "/headlights?make=Audi"],
      ["Mercedes-Benz Headlights", "/headlights?make=Mercedes-Benz"],
      ["Porsche Headlights", "/headlights?make=Porsche"],
    ],
  },
  {
    title: "Tail Lights",
    href: "/tail-lights",
    text: "Rear lamps, side, connector and signal checks.",
    children: [
      ["BMW Tail Lights", "/tail-lights?make=BMW"],
      ["Audi Tail Lights", "/tail-lights?make=Audi"],
      ["Mercedes-Benz Tail Lights", "/tail-lights?make=Mercedes-Benz"],
      ["Volkswagen Tail Lights", "/tail-lights?make=Volkswagen"],
    ],
  },
  {
    title: "Exhaust Systems",
    href: "/exhaust",
    text: "Cat-back, axle-back, downpipe and exhaust tips.",
    children: [
      ["Audi Exhaust", "/exhaust?make=Audi"],
      ["BMW Exhaust", "/exhaust?make=BMW"],
      ["Cat-Back Systems", "/exhaust?q=catback"],
      ["Downpipes", "/exhaust?q=downpipe"],
    ],
  },
  {
    title: "Wheels",
    href: "/wheels",
    text: "Forged, flow-formed, off-road and performance wheels.",
    children: [
      ["PDW Group", "/wheels?make=PDW%20Group"],
      ["Vossen Wheels", "/wheels?make=Vossen%20Wheels"],
      ["BBS USA", "/wheels?make=BBS%20USA"],
      ["HRE Wheels", "/wheels?make=HRE%20Wheels"],
    ],
  },
  {
    title: "Body Kits",
    href: "/body-kits",
    text: "Full kits, lips, diffusers, side skirts and spoilers.",
    children: [
      ["Full Body Kits", "/quote?product=Full%20Body%20Kits"],
      ["Front Lips", "/quote?product=Front%20Lips"],
      ["Rear Diffusers", "/quote?product=Rear%20Diffusers"],
      ["Side Skirts", "/quote?product=Side%20Skirts"],
    ],
  },
];

export function SiteNav({ className = "" }: { className?: string }) {
  return (
    <nav className={`site-nav ${className}`.trim()} aria-label="Primary navigation">
      <details className="nav-drawer">
        <summary>Shop by Vehicle</summary>
        <div className="nav-panel vehicle-panel">
          <div className="nav-panel-head">
            <strong>Shop by vehicle make</strong>
            <span>Filter real catalog products by brand, model keywords, and category.</span>
          </div>
          <div className="nav-link-grid compact">
            {vehicleLinks.map(([label, href]) => (
              <Link href={href} key={label}>{label}</Link>
            ))}
          </div>
          <Link className="nav-feature-link" href="/products">Open full catalog</Link>
        </div>
      </details>

      <details className="nav-drawer wide">
        <summary>Categories</summary>
        <div className="nav-panel category-panel">
          {categoryGroups.map((group) => (
            <section className="nav-category-group" key={group.title}>
              <Link className="nav-category-title" href={group.href}>{group.title}</Link>
              <p>{group.text}</p>
              <div>
                {group.children.map(([label, href]) => (
                  <Link href={href} key={label}>{label}</Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </details>

      <Link href="/products">New Arrivals</Link>
      <Link href="/products?status=popular">Best Sellers</Link>
      <Link href="/support">About</Link>
      <Link href="/quote">Contact</Link>
    </nav>
  );
}
