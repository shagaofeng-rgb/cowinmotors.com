import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <strong>Cowinmotors</strong>
        <span>Automotive headlights, tail lights, exhaust systems, and custom exterior parts for international orders.</span>
      </div>
      <div className="footer-company">
        <span>Company</span>
        <strong>Quzhou Qiying Import & Export Co., Ltd.</strong>
        <small>Room 110, 1st Floor, Building 1, Qushidai Future Building, Kecheng District, Quzhou, Zhejiang Province, China</small>
      </div>
      <nav aria-label="Footer product navigation">
        <span>Products</span>
        <Link href="/headlights">Headlights</Link>
        <Link href="/tail-lights">Tail Lights</Link>
        <Link href="/exhaust">Exhaust Systems</Link>
        <Link href="/body-kits">Body Kit RFQ</Link>
      </nav>
      <nav aria-label="Footer contact navigation">
        <span>Contact</span>
        <a href="tel:+8617601255205">+86 176 0125 5205</a>
        <a href="mailto:davidsha@cowinmotors.com">davidsha@cowinmotors.com</a>
        <a href="mailto:racheljiang@cowinmotors.com">racheljiang@cowinmotors.com</a>
        <Link href="/quote">Request Quote</Link>
      </nav>
    </footer>
  );
}
