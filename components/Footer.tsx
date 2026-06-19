import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Cowinmotors</strong>
        <span>Automotive headlights, exhaust pipes, and body kits for global buyers.</span>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/products">Shop by Vehicle</Link>
        <Link href="/products">Products</Link>
        <Link href="/quote">Request Quote</Link>
        <a href="mailto:racheljiang@cowinmotors.com">racheljiang@cowinmotors.com</a>
      </nav>
    </footer>
  );
}
