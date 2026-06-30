import Link from "next/link";

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
        <nav className="main-nav" aria-label="Primary navigation">
          <Link href="/products">Shop by Vehicle</Link>
          <Link href="/headlights">Headlights</Link>
          <Link href="/tail-lights">Tail Lights</Link>
          <Link href="/exhaust">Exhaust</Link>
          <Link href="/body-kits">Body Kits</Link>
          <Link href="/support">Support</Link>
        </nav>
        <Link className="header-cta" href="/quote">
          {cta}
        </Link>
      </header>
    </>
  );
}
