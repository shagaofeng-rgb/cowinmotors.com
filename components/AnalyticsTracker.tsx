"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getOrCreateId(key: string) {
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const value = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(key, value);
    return value;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function sessionId() {
  try {
    const key = "cowinmotors_session_id";
    const timeKey = "cowinmotors_session_at";
    const existing = window.sessionStorage.getItem(key);
    const touchedAt = Number(window.sessionStorage.getItem(timeKey) || 0);
    const expired = Date.now() - touchedAt > 30 * 60 * 1000;
    if (existing && !expired) {
      window.sessionStorage.setItem(timeKey, String(Date.now()));
      return existing;
    }
    const next = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.sessionStorage.setItem(key, next);
    window.sessionStorage.setItem(timeKey, String(Date.now()));
    return next;
  } catch {
    return "session";
  }
}

function utm() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") || "",
    medium: params.get("utm_medium") || "",
    campaign: params.get("utm_campaign") || "",
    term: params.get("utm_term") || "",
    content: params.get("utm_content") || "",
  };
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify({
    visitorId: getOrCreateId("cowinmotors_visitor_id"),
    sessionId: sessionId(),
    page: `${window.location.pathname}${window.location.search}`,
    pageTitle: document.title,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
    utm: utm(),
    ...payload,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/track", new Blob([body], { type: "application/json" }));
    return;
  }

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const startedAt = useRef(Date.now());
  const previousPage = useRef("");
  const maxScroll = useRef(0);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const currentPage = `${window.location.pathname}${window.location.search}`;
    send({ type: "page_view", previousPage: previousPage.current });
    previousPage.current = currentPage;
    startedAt.current = Date.now();
    maxScroll.current = 0;

    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height > 0) {
        maxScroll.current = Math.max(maxScroll.current, Math.round((window.scrollY / height) * 100));
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const isOutbound = href.startsWith("http") && !href.includes(window.location.hostname);
      const isConversion = /whatsapp|quote|mailto:|tel:/i.test(href);
      if (!isOutbound && !isConversion) return;
      send({
        type: "click",
        outboundUrl: href,
        targetText: link.textContent?.trim().slice(0, 120) || link.getAttribute("aria-label") || "",
        duration: Math.round((Date.now() - startedAt.current) / 1000),
        scrollDepth: maxScroll.current,
      });
    };

    const onPageHide = () => {
      send({
        type: "engagement",
        duration: Math.round((Date.now() - startedAt.current) / 1000),
        scrollDepth: maxScroll.current,
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [pathname]);

  return null;
}
