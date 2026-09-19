import Link from "next/link";
import { UI_ASSETS } from "@/lib/ui-assets";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img src={UI_ASSETS.logo} alt="Cowinmotors logo" />
        <strong>Cowinmotors Automotive Parts</strong>
        <span>China-Based Automotive Parts Sourcing & Export Partner for fitment-led international inquiries.</span>
      </div>
      <div className="footer-company">
        <span>Company</span>
        <strong>Quzhou Qiying Import & Export Co., Ltd.</strong>
        <a className="footer-address" href="https://maps.app.goo.gl/P1YyVHoCdGBd9ef37" target="_blank" rel="noopener noreferrer">Room 110, 1st Floor, Building 1, Qushidai Future Building, Kecheng District, Quzhou, Zhejiang Province, China</a>
      </div>
      <nav aria-label="Footer product navigation">
        <span>Products</span>
        <Link href="/headlights">Headlights</Link>
        <Link href="/tail-lights">Tail Lights</Link>
        <Link href="/exhaust">Exhaust Systems</Link>
        <Link href="/wheels">Wheels</Link>
        <Link href="/body-kits">Body Kit RFQ</Link>
        <Link href="/news">News & Insights</Link>
        <Link href="/blog">Buyer Guides</Link>
      </nav>
      <nav aria-label="Footer contact navigation">
        <span>Contact</span>
        <a href="https://wa.me/8617601255205" target="_blank" rel="noopener noreferrer">+86 176 0125 5205</a>
        <a href="mailto:davidsha@cowinmotors.com">davidsha@cowinmotors.com</a>
        <a href="mailto:racheljiang@cowinmotors.com">racheljiang@cowinmotors.com</a>
        <Link href="/quote">Request Quote</Link>
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/terms">Terms of Use</Link>
      </nav>
    </footer>
  );
}
