"use client";

import { ArrowUpRight, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function MobileQuoteBar({ whatsapp }: { whatsapp: string }) {
  const [showInline, setShowInline] = useState(false);

  useEffect(() => {
    const inquiry = document.getElementById("product-inquiry");
    const actions = document.querySelector(".cm-pd-actions");
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && (entry.target === inquiry || entry.intersectionRatio >= .85)) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setShowInline(visible.size > 0);
    }, { rootMargin: "-62px 0px -62px", threshold: [0, .85] });
    if (inquiry) observer.observe(inquiry);
    if (actions) observer.observe(actions);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="cm-mobile-quote" hidden={showInline}>
      <a className="cm-btn cm-btn-primary" href="#product-inquiry">Request a quote <ArrowUpRight size={18} /></a>
      <a className="cm-icon-btn" href={whatsapp} aria-label="Ask on WhatsApp" title="Ask on WhatsApp" target="_blank" rel="noreferrer"><MessageCircle size={22} /></a>
    </div>
  );
}
