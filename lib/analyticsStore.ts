import fs from "node:fs/promises";
import path from "node:path";
import { resolveDateRange, type AdminDateRange } from "@/lib/adminDateRange";
import { ensureCoreSchema, getSql, isDatabaseConfigured } from "@/lib/database";

export type AnalyticsEvent = {
  id: string;
  type: "page_view" | "engagement" | "click" | "form_submit";
  visitorId: string;
  sessionId: string;
  page: string;
  previousPage: string;
  pageTitle: string;
  referrer: string;
  outboundUrl: string;
  targetText: string;
  scrollDepth: number;
  duration: number;
  utm: Record<string, string>;
  browser: string;
  os: string;
  device: string;
  userAgent: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  channel: string;
  sourcePlatform: string;
  sourceDetail: string;
  timestamp: string;
  clientTimestamp: string;
};

type AnalyticsEventRow = {
  id: string;
  type: AnalyticsEvent["type"];
  visitor_id: string;
  session_id: string;
  page: string;
  previous_page: string | null;
  page_title: string | null;
  referrer: string | null;
  outbound_url: string | null;
  target_text: string | null;
  scroll_depth: number | null;
  duration: number | null;
  utm: Record<string, string> | string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  user_agent: string | null;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  channel: string | null;
  source_platform: string | null;
  source_detail: string | null;
  timestamp: string | Date;
  client_timestamp: string | null;
};

const dataDir = process.env.VERCEL ? path.join("/tmp", "cowinmotors-analytics") : path.join(process.cwd(), ".data");
const eventFile = path.join(dataDir, "analytics-events.jsonl");

function safeJson(line: string) {
  try {
    return JSON.parse(line) as AnalyticsEvent;
  } catch {
    return null;
  }
}

function getHeader(request: Request, key: string) {
  return request.headers.get(key) || "";
}

function cleanPagePath(value = "/") {
  const raw = String(value || "/").slice(0, 300);
  try {
    const url = raw.startsWith("http") ? new URL(raw) : new URL(raw, "https://www.cowinmotors.com");
    ["fbclid", "gclid", "gbraid", "wbraid", "msclkid"].forEach((key) => url.searchParams.delete(key));
    [...url.searchParams.keys()].forEach((key) => {
      if (key.startsWith("utm_")) url.searchParams.delete(key);
    });
    const query = url.searchParams.toString();
    return `${url.pathname}${query ? `?${query}` : ""}`.slice(0, 240) || "/";
  } catch {
    return raw.split("?")[0] || "/";
  }
}

function detectDevice(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "Tablet";
  if (/mobile|iphone|android/.test(ua)) return "Mobile";
  return "Desktop";
}

function detectBrowser(userAgent = "") {
  if (/edg/i.test(userAgent)) return "Edge";
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return "Safari";
  if (/firefox/i.test(userAgent)) return "Firefox";
  return "Other";
}

function detectOs(userAgent = "") {
  if (/windows/i.test(userAgent)) return "Windows";
  if (/iphone|ipad|ios/i.test(userAgent)) return "iOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/mac os|macintosh/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Other";
}

function hostFromUrl(value = "") {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function detectChannel(event: Pick<AnalyticsEvent, "utm" | "referrer">) {
  const source = event.utm?.source || "";
  const referrer = event.referrer || "";
  if (source) return `Campaign: ${source}`;
  if (!referrer) return "Direct";
  if (/google|bing|yahoo|duckduckgo|yandex|baidu/i.test(referrer)) return "Organic Search";
  if (/facebook|instagram|linkedin|youtube|tiktok|twitter|x\.com/i.test(referrer)) return "Social";
  return "Referral";
}

function detectSourcePlatform(event: Pick<AnalyticsEvent, "utm" | "referrer">) {
  const combined = `${event.utm?.source || ""} ${event.referrer || ""}`.toLowerCase();
  if (/google/.test(combined)) return "Google";
  if (/facebook|fb\.com/.test(combined)) return "Facebook";
  if (/instagram/.test(combined)) return "Instagram";
  if (/linkedin/.test(combined)) return "LinkedIn";
  if (/tiktok/.test(combined)) return "TikTok";
  if (/youtube|youtu\.be/.test(combined)) return "YouTube";
  if (/bing/.test(combined)) return "Bing";
  if (event.utm?.source) return event.utm.source;
  if (event.referrer) return hostFromUrl(event.referrer) || "Referral";
  return "Direct";
}

function sourceDetail(event: Pick<AnalyticsEvent, "utm" | "referrer">) {
  if (event.utm?.source) {
    return [
      `utm_source=${event.utm.source}`,
      event.utm.medium ? `utm_medium=${event.utm.medium}` : "",
      event.utm.campaign ? `utm_campaign=${event.utm.campaign}` : "",
    ].filter(Boolean).join(" / ");
  }
  return event.referrer ? hostFromUrl(event.referrer) || event.referrer : "Direct";
}

export function getAnalyticsStorageMode() {
  if (isDatabaseConfigured()) return "postgres";
  return process.env.VERCEL ? "server-file-fallback" : "local-file";
}

export function normalizeAnalyticsEvent(payload: Record<string, any>, request: Request): AnalyticsEvent {
  const userAgent = getHeader(request, "user-agent");
  const event = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: (payload.type || "page_view") as AnalyticsEvent["type"],
    visitorId: String(payload.visitorId || "anonymous").slice(0, 80),
    sessionId: String(payload.sessionId || "session").slice(0, 80),
    page: cleanPagePath(payload.page || "/"),
    previousPage: payload.previousPage ? cleanPagePath(payload.previousPage) : "",
    pageTitle: String(payload.pageTitle || "").slice(0, 180),
    referrer: String(payload.referrer || "").slice(0, 240),
    outboundUrl: String(payload.outboundUrl || "").slice(0, 240),
    targetText: String(payload.targetText || "").slice(0, 120),
    scrollDepth: Number(payload.scrollDepth || 0),
    duration: Number(payload.duration || 0),
    utm: {
      source: String(payload.utm?.source || "").slice(0, 80),
      medium: String(payload.utm?.medium || "").slice(0, 80),
      campaign: String(payload.utm?.campaign || "").slice(0, 120),
      term: String(payload.utm?.term || "").slice(0, 120),
      content: String(payload.utm?.content || "").slice(0, 120),
    },
    browser: detectBrowser(userAgent),
    os: detectOs(userAgent),
    device: payload.device || detectDevice(userAgent),
    userAgent: userAgent.slice(0, 360),
    ip: (getHeader(request, "x-forwarded-for").split(",")[0] || getHeader(request, "x-real-ip") || "").trim(),
    country: getHeader(request, "x-vercel-ip-country") || "Unknown",
    region: getHeader(request, "x-vercel-ip-country-region") || "",
    city: getHeader(request, "x-vercel-ip-city") || "",
    channel: "Direct",
    sourcePlatform: "Direct",
    sourceDetail: "Direct",
    timestamp: new Date().toISOString(),
    clientTimestamp: String(payload.timestamp || ""),
  };

  event.channel = detectChannel(event);
  event.sourcePlatform = detectSourcePlatform(event);
  event.sourceDetail = sourceDetail(event);
  return event;
}

export async function appendAnalyticsEvent(event: AnalyticsEvent) {
  const sql = getSql();

  if (sql) {
    try {
      await ensureCoreSchema();
      await sql`
        INSERT INTO cowin_analytics_events (
          id, type, visitor_id, session_id, page, previous_page, page_title, referrer, outbound_url, target_text,
          scroll_depth, duration, utm, browser, os, device, user_agent, ip, country, region, city,
          channel, source_platform, source_detail, timestamp, client_timestamp
        ) VALUES (
          ${event.id},
          ${event.type},
          ${event.visitorId},
          ${event.sessionId},
          ${event.page},
          ${event.previousPage},
          ${event.pageTitle},
          ${event.referrer},
          ${event.outboundUrl},
          ${event.targetText},
          ${event.scrollDepth},
          ${event.duration},
          ${JSON.stringify(event.utm)}::jsonb,
          ${event.browser},
          ${event.os},
          ${event.device},
          ${event.userAgent},
          ${event.ip},
          ${event.country},
          ${event.region},
          ${event.city},
          ${event.channel},
          ${event.sourcePlatform},
          ${event.sourceDetail},
          ${event.timestamp},
          ${event.clientTimestamp}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      return { ok: true, storageMode: getAnalyticsStorageMode() };
    } catch (error) {
      console.error("Analytics database write failed; using file fallback.", error);
    }
  }

  await fs.mkdir(dataDir, { recursive: true });
  await fs.appendFile(eventFile, `${JSON.stringify(event)}\n`, "utf8");
  return { ok: true, storageMode: getAnalyticsStorageMode() };
}

export async function readAnalyticsEvents() {
  const sql = getSql();

  if (sql) {
    try {
      await ensureCoreSchema();
      const rows = await sql`
        SELECT
          id, type, visitor_id, session_id, page, previous_page, page_title, referrer, outbound_url, target_text,
          scroll_depth, duration, utm, browser, os, device, user_agent, ip, country, region, city,
          channel, source_platform, source_detail, timestamp, client_timestamp
        FROM cowin_analytics_events
        ORDER BY timestamp DESC
        LIMIT 10000
      ` as AnalyticsEventRow[];

      return rows.map((row) => ({
        id: row.id,
        type: row.type,
        visitorId: row.visitor_id,
        sessionId: row.session_id,
        page: row.page,
        previousPage: row.previous_page || "",
        pageTitle: row.page_title || "",
        referrer: row.referrer || "",
        outboundUrl: row.outbound_url || "",
        targetText: row.target_text || "",
        scrollDepth: Number(row.scroll_depth || 0),
        duration: Number(row.duration || 0),
        utm: typeof row.utm === "string" ? JSON.parse(row.utm || "{}") : row.utm || {},
        browser: row.browser || "",
        os: row.os || "",
        device: row.device || "",
        userAgent: row.user_agent || "",
        ip: row.ip || "",
        country: row.country || "",
        region: row.region || "",
        city: row.city || "",
        channel: row.channel || "",
        sourcePlatform: row.source_platform || "",
        sourceDetail: row.source_detail || "",
        timestamp: new Date(row.timestamp).toISOString(),
        clientTimestamp: row.client_timestamp || "",
      })) as AnalyticsEvent[];
    } catch (error) {
      console.error("Analytics database read failed; using file fallback.", error);
    }
  }

  try {
    const text = await fs.readFile(eventFile, "utf8");
    return text.split(/\r?\n/).map(safeJson).filter(Boolean) as AnalyticsEvent[];
  } catch {
    return [];
  }
}

function inRange(event: AnalyticsEvent, startDate: Date, endDate: Date) {
  const time = new Date(event.timestamp).getTime();
  return time >= startDate.getTime() && time <= endDate.getTime();
}

function unique(events: AnalyticsEvent[], key: keyof AnalyticsEvent) {
  return new Set(events.map((event) => String(event[key] || "")).filter(Boolean)).size;
}

function dayKey(timestamp: string | Date) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function countBy(events: AnalyticsEvent[], key: keyof AnalyticsEvent, limit = 12) {
  const map = new Map<string, number>();
  for (const event of events) {
    const value = String(event[key] || "Unknown");
    map.set(value, (map.get(value) || 0) + 1);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, limit);
}

function seriesByDay(events: AnalyticsEvent[], startDate: Date, endDate: Date) {
  const dayMap = new Map<string, { date: string; pv: number; uv: Set<string>; inquiries: number }>();
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const date = dayKey(cursor);
    dayMap.set(date, { date, pv: 0, uv: new Set(), inquiries: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const event of events) {
    const date = dayKey(event.timestamp);
    const item = dayMap.get(date);
    if (!item) continue;
    if (event.type === "page_view") {
      item.pv += 1;
      item.uv.add(event.visitorId);
    }
    if (event.type === "form_submit") item.inquiries += 1;
  }

  return [...dayMap.values()].map((item) => ({ date: item.date, pv: item.pv, uv: item.uv.size, inquiries: item.inquiries }));
}

function pageStats(events: AnalyticsEvent[]) {
  const map = new Map<string, any>();
  for (const event of events.filter((item) => item.type === "page_view")) {
    const item = map.get(event.page) || {
      page: event.page,
      title: event.pageTitle || event.page,
      views: 0,
      visitors: new Set<string>(),
      durationTotal: 0,
      inquiries: 0,
      clicks: 0,
    };
    item.views += 1;
    item.visitors.add(event.visitorId);
    item.durationTotal += Number(event.duration || 0);
    map.set(event.page, item);
  }

  for (const event of events) {
    const item = map.get(event.page);
    if (!item) continue;
    if (event.type === "form_submit") item.inquiries += 1;
    if (event.type === "click") item.clicks += 1;
  }

  return [...map.values()].map((item) => ({
    page: item.page,
    title: item.title,
    views: item.views,
    visitors: item.visitors.size,
    avgDuration: item.views ? Math.round(item.durationTotal / item.views) : 0,
    inquiries: item.inquiries,
    clicks: item.clicks,
    conversionRate: item.views ? Number(((item.inquiries / item.views) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.views - a.views);
}

export async function getAnalyticsSnapshot(range: AdminDateRange = { days: 14 }) {
  const { startDate, endDate, rangeDays } = resolveDateRange(range);
  const allEvents = await readAnalyticsEvents();
  const events = allEvents.filter((event) => inRange(event, startDate, endDate));
  const pageViews = events.filter((event) => event.type === "page_view");
  const forms = events.filter((event) => event.type === "form_submit");
  const clicks = events.filter((event) => event.type === "click");
  const sessionPageViews = new Map<string, number>();
  for (const event of pageViews) {
    sessionPageViews.set(event.sessionId, (sessionPageViews.get(event.sessionId) || 0) + 1);
  }

  const journeyMap = new Map<string, number>();
  for (const event of pageViews) {
    if (!event.previousPage) continue;
    const key = `${event.previousPage} -> ${event.page}`;
    journeyMap.set(key, (journeyMap.get(key) || 0) + 1);
  }

  return {
    rangeDays,
    rangeStart: startDate.toISOString(),
    rangeEnd: endDate.toISOString(),
    storageMode: getAnalyticsStorageMode(),
    trackingConfigured: true,
    generatedAt: new Date().toISOString(),
    overview: {
      pageViews: pageViews.length,
      uniqueVisitors: unique(pageViews, "visitorId"),
      sessions: unique(pageViews, "sessionId"),
      inquiries: forms.length,
      clicks: clicks.length,
      avgDuration: pageViews.length ? Math.round(pageViews.reduce((sum, event) => sum + Number(event.duration || 0), 0) / pageViews.length) : 0,
      bounceRate: sessionPageViews.size
        ? Math.round(([...sessionPageViews.values()].filter((views) => views <= 1).length / sessionPageViews.size) * 100)
        : 0,
    },
    traffic: {
      series: seriesByDay(events, startDate, endDate),
      channels: countBy(pageViews, "channel", 8),
      countries: countBy(pageViews, "country", 10),
      sourcePlatforms: countBy(pageViews, "sourcePlatform", 10),
      devices: countBy(pageViews, "device", 6),
      browsers: countBy(pageViews, "browser", 6),
      operatingSystems: countBy(pageViews, "os", 6),
    },
    visitors: pageViews.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 100),
    pages: pageStats(events),
    landingJourneys: pageViews.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 120),
    journeys: [...journeyMap.entries()].map(([route, value]) => ({ route, value })).sort((a, b) => b.value - a.value).slice(0, 100),
    events: events.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 200),
  };
}

export function getSearchConsoleSnapshot() {
  const configured = Boolean(
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
  );

  return {
    configured,
    live: false,
    siteUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || "https://www.cowinmotors.com/",
    overview: { clicks: 0, impressions: 0, ctr: 0, position: 0, indexedPages: 0, notIndexedPages: 0 },
    queries: [],
    pages: [],
    countries: [],
    devices: [],
    indexingStatus: [],
  };
}
