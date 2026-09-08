import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { ADMIN_REPORT_TIME_ZONE, resolveDateRange, type AdminDateRange } from "@/lib/adminDateRange";
import { ensureCoreSchema, getSql, isDatabaseConfigured } from "@/lib/database";
import {
  getGoogleSearchConsoleConnectionStatus,
  getGoogleSearchConsoleOAuthAccessToken,
  getSearchConsoleSiteUrl,
} from "@/lib/googleSearchConsoleOAuth";

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
  trafficStatus: "real" | "excluded" | "review";
  trafficReason: string;
  ipHash: string;
  dedupeKey: string;
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
  traffic_status: "real" | "excluded" | "review" | null;
  traffic_reason: string | null;
  ip_hash: string | null;
  dedupe_key: string | null;
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

function isOwnDomain(value = "") {
  const host = hostFromUrl(value);
  return host === "cowinmotors.com" || host.endsWith(".cowinmotors.com");
}

function detectChannel(event: Pick<AnalyticsEvent, "utm" | "referrer">) {
  const source = event.utm?.source || "";
  const referrer = event.referrer || "";
  if (source) return `Campaign: ${source}`;
  if (!referrer || isOwnDomain(referrer)) return "Direct";
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
  if (event.referrer && !isOwnDomain(event.referrer)) return hostFromUrl(event.referrer) || "Referral";
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
  return event.referrer && !isOwnDomain(event.referrer) ? hostFromUrl(event.referrer) || event.referrer : "Direct";
}

function hashIp(ip = "") {
  if (!ip) return "";
  const salt = process.env.ADMIN_JWT_SECRET || process.env.CRON_SECRET || "cowinmotors-analytics";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function normalizedDedupeKey(payload: Record<string, any>) {
  const value = String(payload.eventId || payload.dedupeKey || "").trim();
  return /^[a-zA-Z0-9_-]{12,160}$/.test(value) ? value : "";
}

export function classifyTraffic(event: Pick<AnalyticsEvent, "userAgent" | "utm" | "referrer" | "page" | "sourcePlatform" | "sourceDetail">, qualityHint = "") {
  const userAgent = event.userAgent.toLowerCase();
  const source = `${event.utm?.source || ""} ${event.sourcePlatform || ""} ${event.sourceDetail || ""}`.toLowerCase();
  const referrerHost = hostFromUrl(event.referrer);
  const hint = qualityHint.toLowerCase();

  if (hint === "test-inquiry" || /(^|[\s_-])(test|collect(?:s|ion)?|codex|internal)([\s_-]|$)/.test(source)) {
    return { status: "excluded" as const, reason: hint === "test-inquiry" ? "Test inquiry" : "Internal or collection source" };
  }
  if (/meta-externalagent|facebookexternalhit|facebot/.test(userAgent)) {
    return { status: "excluded" as const, reason: "Facebook link preview" };
  }
  if (/headless|playwright|puppeteer|lighthouse|selenium/.test(userAgent)) {
    return { status: "excluded" as const, reason: "Automated browser" };
  }
  if (/curl|wget|postmanruntime/.test(userAgent)) {
    return { status: "excluded" as const, reason: "HTTP test client" };
  }
  if (/bot|crawler|spider|slurp|preview/.test(userAgent)) {
    return { status: "excluded" as const, reason: "Crawler or preview bot" };
  }
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(referrerHost)) {
    return { status: "excluded" as const, reason: "Local development referrer" };
  }
  if (/\b(test|smoke-test|health-check)\b/i.test(event.page)) {
    return { status: "review" as const, reason: "Possible test route" };
  }
  return { status: "real" as const, reason: "" };
}

export function maskIp(ip = "") {
  if (!ip) return "-";
  if (ip.includes(".")) {
    const parts = ip.split(".");
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.xxx` : "masked";
  }
  const parts = ip.split(":").filter(Boolean);
  return parts.length ? `${parts.slice(0, 2).join(":")}::xxxx` : "masked";
}

export function getAnalyticsStorageMode() {
  if (isDatabaseConfigured()) return "postgres";
  return process.env.VERCEL ? "server-file-fallback" : "local-file";
}

export function normalizeAnalyticsEvent(payload: Record<string, any>, request: Request): AnalyticsEvent {
  const userAgent = getHeader(request, "user-agent");
  const id = normalizedDedupeKey(payload) || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ip = (getHeader(request, "x-forwarded-for").split(",")[0] || getHeader(request, "x-real-ip") || "").trim();
  const event: AnalyticsEvent = {
    id,
    type: (payload.type || "page_view") as AnalyticsEvent["type"],
    visitorId: String(payload.visitorId || "anonymous").slice(0, 80),
    sessionId: String(payload.sessionId || "session").slice(0, 80),
    page: cleanPagePath(payload.page || "/"),
    previousPage: payload.previousPage ? cleanPagePath(payload.previousPage) : "",
    pageTitle: String(payload.pageTitle || "").slice(0, 180),
    referrer: String(payload.referrer || "").slice(0, 240),
    outboundUrl: String(payload.outboundUrl || "").slice(0, 240),
    targetText: String(payload.targetText || "").slice(0, 120),
    scrollDepth: Math.min(100, Math.max(0, Number(payload.scrollDepth || 0))),
    duration: Math.min(86_400, Math.max(0, Number(payload.duration || 0))),
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
    ip,
    country: getHeader(request, "x-vercel-ip-country") || "Unknown",
    region: getHeader(request, "x-vercel-ip-country-region") || "",
    city: getHeader(request, "x-vercel-ip-city") || "",
    channel: "Direct",
    sourcePlatform: "Direct",
    sourceDetail: "Direct",
    trafficStatus: "real",
    trafficReason: "",
    ipHash: hashIp(ip),
    dedupeKey: normalizedDedupeKey(payload),
    timestamp: new Date().toISOString(),
    clientTimestamp: String(payload.timestamp || ""),
  };

  event.channel = detectChannel(event);
  event.sourcePlatform = detectSourcePlatform(event);
  event.sourceDetail = sourceDetail(event);
  const quality = classifyTraffic(event, String(payload.qualityHint || ""));
  event.trafficStatus = quality.status;
  event.trafficReason = quality.reason;
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
          channel, source_platform, source_detail, traffic_status, traffic_reason, ip_hash, dedupe_key, timestamp, client_timestamp
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
          ${event.trafficStatus},
          ${event.trafficReason},
          ${event.ipHash},
          ${event.dedupeKey},
          ${event.timestamp},
          ${event.clientTimestamp}
        )
        ON CONFLICT DO NOTHING
      `;
      return { ok: true, storageMode: getAnalyticsStorageMode() };
    } catch (error) {
      console.error("Analytics database write failed.", error);
      if (process.env.VERCEL) return { ok: false, storageMode: "database-error" };
    }
  }

  await fs.mkdir(dataDir, { recursive: true });
  await fs.appendFile(eventFile, `${JSON.stringify(event)}\n`, "utf8");
  return { ok: true, storageMode: getAnalyticsStorageMode() };
}

export async function readAnalyticsEvents(options: { startDate?: Date; endDate?: Date; limit?: number } = {}) {
  const sql = getSql();
  const limit = Math.min(50_000, Math.max(1, options.limit || 20_000));

  if (sql) {
    try {
      await ensureCoreSchema();
      let rows: AnalyticsEventRow[];
      if (options.startDate && options.endDate) {
        rows = await sql`
          SELECT
            id, type, visitor_id, session_id, page, previous_page, page_title, referrer, outbound_url, target_text,
            scroll_depth, duration, utm, browser, os, device, user_agent, ip, country, region, city,
            channel, source_platform, source_detail, traffic_status, traffic_reason, ip_hash, dedupe_key, timestamp, client_timestamp
          FROM cowin_analytics_events
          WHERE timestamp >= ${options.startDate.toISOString()} AND timestamp <= ${options.endDate.toISOString()}
          ORDER BY timestamp DESC
          LIMIT ${limit}
        ` as AnalyticsEventRow[];
      } else {
        rows = await sql`
          SELECT
            id, type, visitor_id, session_id, page, previous_page, page_title, referrer, outbound_url, target_text,
            scroll_depth, duration, utm, browser, os, device, user_agent, ip, country, region, city,
            channel, source_platform, source_detail, traffic_status, traffic_reason, ip_hash, dedupe_key, timestamp, client_timestamp
          FROM cowin_analytics_events
          ORDER BY timestamp DESC
          LIMIT ${limit}
        ` as AnalyticsEventRow[];
      }

      return rows.map((row) => {
        const base = {
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
        trafficStatus: row.traffic_status || "real",
        trafficReason: row.traffic_reason || "",
        ipHash: row.ip_hash || hashIp(row.ip || ""),
        dedupeKey: row.dedupe_key || "",
        timestamp: new Date(row.timestamp).toISOString(),
        clientTimestamp: row.client_timestamp || "",
        } as AnalyticsEvent;
        const quality = classifyTraffic(base);
        if (!row.traffic_status || (!row.traffic_reason && quality.status !== "real")) {
          base.trafficStatus = quality.status;
          base.trafficReason = quality.reason;
        }
        return base;
      });
    } catch (error) {
      console.error("Analytics database read failed.", error);
      if (process.env.VERCEL) return [];
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
    timeZone: ADMIN_REPORT_TIME_ZONE,
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

export async function getAnalyticsSnapshot(range: AdminDateRange = { days: 1, preset: "today" }) {
  const { startDate, endDate, rangeDays } = resolveDateRange(range);
  const allEvents = await readAnalyticsEvents({ startDate, endDate });
  const events = allEvents.filter((event) => inRange(event, startDate, endDate) && event.trafficStatus === "real");
  const excludedEvents = allEvents.filter((event) => inRange(event, startDate, endDate) && event.trafficStatus === "excluded");
  const reviewEvents = allEvents.filter((event) => inRange(event, startDate, endDate) && event.trafficStatus === "review");
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
      trackedEvents: allEvents.length,
      excludedEvents: excludedEvents.length,
      reviewEvents: reviewEvents.length,
    },
    traffic: {
      series: seriesByDay(events, startDate, endDate),
      channels: countBy(pageViews, "channel", 8),
      countries: countBy(pageViews, "country", 10),
      sourcePlatforms: countBy(pageViews, "sourcePlatform", 10),
      devices: countBy(pageViews, "device", 6),
      browsers: countBy(pageViews, "browser", 6),
      operatingSystems: countBy(pageViews, "os", 6),
      regions: countBy(pageViews, "region", 10),
    },
    visitors: pageViews.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 100),
    pages: pageStats(events),
    landingJourneys: pageViews.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 120),
    journeys: [...journeyMap.entries()].map(([route, value]) => ({ route, value })).sort((a, b) => b.value - a.value).slice(0, 100),
    events: events.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 200),
    dataQuality: {
      excludedByReason: countBy(excludedEvents, "trafficReason", 12),
      reviewByReason: countBy(reviewEvents, "trafficReason", 12),
    },
  };
}

export type VisitorDirectoryFilters = {
  query?: string;
  country?: string;
  channel?: string;
  source?: string;
  device?: string;
  label?: string;
  page?: number;
  pageSize?: number;
};

export type VisitorProfile = {
  visitorId: string;
  displayId: string;
  maskedIp: string;
  country: string;
  region: string;
  city: string;
  channel: string;
  source: string;
  device: string;
  firstSeen: string;
  lastSeen: string;
  visits: number;
  pages: number;
  pageViews: number;
  clicks: number;
  inquiries: number;
  labels: string[];
};

function profileLabels(events: AnalyticsEvent[], sessions: Set<string>) {
  const labels: string[] = [];
  if (events.some((event) => event.type === "form_submit")) labels.push("已询盘");
  if (sessions.size > 1) labels.push("回访客户");
  if (events.filter((event) => event.type === "page_view").length >= 5 || events.some((event) => event.type === "click")) labels.push("高意向");
  if (!labels.length) labels.push("新访客");
  return labels;
}

function profileFromEvents(visitorId: string, events: AnalyticsEvent[]): VisitorProfile {
  const ordered = events.slice().sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  const first = ordered[0];
  const last = ordered.at(-1) || first;
  const sessions = new Set(ordered.map((event) => event.sessionId).filter(Boolean));
  const pageViews = ordered.filter((event) => event.type === "page_view");
  return {
    visitorId,
    displayId: visitorId.slice(-10) || "anonymous",
    maskedIp: maskIp(last?.ip || first?.ip || ""),
    country: last?.country || first?.country || "Unknown",
    region: last?.region || first?.region || "",
    city: last?.city || first?.city || "",
    channel: last?.channel || first?.channel || "Direct",
    source: last?.sourcePlatform || first?.sourcePlatform || "Direct",
    device: last?.device || first?.device || "Unknown",
    firstSeen: first?.timestamp || "",
    lastSeen: last?.timestamp || "",
    visits: sessions.size,
    pages: new Set(pageViews.map((event) => event.page)).size,
    pageViews: pageViews.length,
    clicks: ordered.filter((event) => event.type === "click").length,
    inquiries: ordered.filter((event) => event.type === "form_submit").length,
    labels: profileLabels(ordered, sessions),
  };
}

function matchesVisitorFilter(profile: VisitorProfile, filters: VisitorDirectoryFilters) {
  const query = String(filters.query || "").trim().toLowerCase();
  if (query) {
    const haystack = [profile.displayId, profile.country, profile.region, profile.city, profile.source, profile.channel, profile.device, ...profile.labels].join(" ").toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (filters.country && profile.country !== filters.country) return false;
  if (filters.channel && profile.channel !== filters.channel) return false;
  if (filters.source && profile.source !== filters.source) return false;
  if (filters.device && profile.device !== filters.device) return false;
  if (filters.label && !profile.labels.includes(filters.label)) return false;
  return true;
}

export async function getVisitorDirectory(range: AdminDateRange, filters: VisitorDirectoryFilters = {}) {
  const { startDate, endDate } = resolveDateRange(range);
  const allEvents = await readAnalyticsEvents({ startDate, endDate });
  const grouped = new Map<string, AnalyticsEvent[]>();
  for (const event of allEvents.filter((item) => item.trafficStatus === "real")) {
    const events = grouped.get(event.visitorId) || [];
    events.push(event);
    grouped.set(event.visitorId, events);
  }
  const profiles = [...grouped.entries()]
    .map(([visitorId, events]) => profileFromEvents(visitorId, events))
    .filter((profile) => matchesVisitorFilter(profile, filters))
    .sort((left, right) => right.lastSeen.localeCompare(left.lastSeen));
  const pageSize = [25, 50, 100].includes(Number(filters.pageSize)) ? Number(filters.pageSize) : 25;
  const totalPages = Math.max(1, Math.ceil(profiles.length / pageSize));
  const currentPage = Math.min(Math.max(1, Number(filters.page) || 1), totalPages);
  const offset = (currentPage - 1) * pageSize;

  return {
    items: profiles.slice(offset, offset + pageSize),
    total: profiles.length,
    currentPage,
    totalPages,
    pageSize,
    options: {
      countries: countBy(allEvents.filter((event) => event.trafficStatus === "real" && event.type === "page_view"), "country", 100).map((row) => row.label),
      channels: countBy(allEvents.filter((event) => event.trafficStatus === "real" && event.type === "page_view"), "channel", 100).map((row) => row.label),
      sources: countBy(allEvents.filter((event) => event.trafficStatus === "real" && event.type === "page_view"), "sourcePlatform", 100).map((row) => row.label),
      devices: countBy(allEvents.filter((event) => event.trafficStatus === "real" && event.type === "page_view"), "device", 20).map((row) => row.label),
    },
  };
}

export async function getVisitorProfile(visitorId: string, range?: AdminDateRange) {
  const resolved = range ? resolveDateRange(range) : (() => {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 180);
    return { startDate, endDate };
  })();
  const { startDate, endDate } = resolved;
  const events = (await readAnalyticsEvents({ startDate, endDate }))
    .filter((event) => event.visitorId === visitorId && event.trafficStatus === "real")
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  if (!events.length) return null;
  return { profile: profileFromEvents(visitorId, events), events };
}

export async function getAnalyticsHealth() {
  const sql = getSql();
  if (!sql) return { configured: false, connected: false, storageMode: getAnalyticsStorageMode(), events: 0, lastEventAt: "", error: "DATABASE_URL is not configured." };
  try {
    await ensureCoreSchema();
    const rows = await sql`SELECT COUNT(*)::int AS events, MAX(timestamp) AS last_event_at FROM cowin_analytics_events` as { events: number; last_event_at: string | Date | null }[];
    return {
      configured: true,
      connected: true,
      storageMode: getAnalyticsStorageMode(),
      events: Number(rows[0]?.events || 0),
      lastEventAt: rows[0]?.last_event_at ? new Date(rows[0].last_event_at).toISOString() : "",
      error: "",
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      storageMode: "database-error",
      events: 0,
      lastEventAt: "",
      error: error instanceof Error ? error.message.slice(0, 160) : "Analytics database connection failed.",
    };
  }
}

export async function getTrafficQualityReport(range: AdminDateRange) {
  const { startDate, endDate } = resolveDateRange(range);
  const events = await readAnalyticsEvents({ startDate, endDate });
  const excluded = events.filter((event) => event.trafficStatus === "excluded");
  const review = events.filter((event) => event.trafficStatus === "review");
  return {
    totalEvents: events.length,
    realEvents: events.filter((event) => event.trafficStatus === "real").length,
    excludedEvents: excluded.length,
    reviewEvents: review.length,
    reasons: countBy(excluded, "trafficReason", 20),
    sources: countBy(excluded, "sourcePlatform", 20),
    recent: [...excluded, ...review].sort((left, right) => right.timestamp.localeCompare(left.timestamp)).slice(0, 100).map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      status: event.trafficStatus,
      reason: event.trafficReason || "待复核",
      source: event.sourcePlatform || "Direct",
      country: event.country || "Unknown",
      page: event.page,
      maskedIp: maskIp(event.ip),
    })),
  };
}

type SearchConsoleRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

let searchConsoleToken: { value: string; expiresAt: number } | null = null;

function cleanPrivateKey(value = "") {
  return value.trim().replace(/\\n/g, "\n");
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function gscDate(offsetDays: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - offsetDays);
  return date.toISOString().slice(0, 10);
}

async function getSearchConsoleAccessToken() {
  if (searchConsoleToken && searchConsoleToken.expiresAt > Date.now() + 60_000) {
    return searchConsoleToken.value;
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = cleanPrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  if (!clientEmail || !privateKey) {
    return getGoogleSearchConsoleOAuthAccessToken();
  }

  const now = Math.floor(Date.now() / 1000);
  const unsigned = [
    base64UrlJson({ alg: "RS256", typ: "JWT" }),
    base64UrlJson({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ].join(".");
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(privateKey, "base64url");
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || `Google OAuth failed: ${response.status}`);
  }

  searchConsoleToken = {
    value: payload.access_token,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
  };
  return searchConsoleToken.value;
}

async function searchConsoleQuery({
  siteUrl,
  startDate,
  endDate,
  dimensions = [],
  rowLimit = 10,
}: {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions?: string[];
  rowLimit?: number;
}) {
  const token = await getSearchConsoleAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions,
        rowLimit,
        searchType: "web",
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `Search Console API failed: ${response.status}`);
  }
  return (payload.rows || []) as SearchConsoleRow[];
}

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function dimensionRows(rows: SearchConsoleRow[], key: "query" | "page" | "country" | "device") {
  return rows.map((row) => ({
    [key]: row.keys?.[0] || "-",
    clicks: Math.round(row.clicks || 0),
    impressions: Math.round(row.impressions || 0),
    ctr: round((row.ctr || 0) * 100),
    position: round(row.position || 0),
  }));
}

export async function getSearchConsoleSnapshot(range?: AdminDateRange) {
  const oauthStatus = await getGoogleSearchConsoleConnectionStatus();
  const configured = Boolean(
    (process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) ||
      (oauthStatus.oauthConfigured && oauthStatus.connected)
  );
  const siteUrl = getSearchConsoleSiteUrl();
  const resolvedRange = range ? resolveDateRange(range) : null;
  const toGscDate = (value: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: ADMIN_REPORT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
  const endDate = resolvedRange ? toGscDate(resolvedRange.endDate) : gscDate(3);
  const startDate = resolvedRange ? toGscDate(resolvedRange.startDate) : gscDate(31);

  if (configured) {
    try {
      const [overviewRows, queryRows, pageRows, countryRows, deviceRows] = await Promise.all([
        searchConsoleQuery({ siteUrl, startDate, endDate, rowLimit: 1 }),
        searchConsoleQuery({ siteUrl, startDate, endDate, dimensions: ["query"], rowLimit: 20 }),
        searchConsoleQuery({ siteUrl, startDate, endDate, dimensions: ["page"], rowLimit: 20 }),
        searchConsoleQuery({ siteUrl, startDate, endDate, dimensions: ["country"], rowLimit: 12 }),
        searchConsoleQuery({ siteUrl, startDate, endDate, dimensions: ["device"], rowLimit: 8 }),
      ]);
      const overview = overviewRows[0] || {};

      return {
        configured,
        live: true,
        error: "",
        siteUrl,
        oauth: oauthStatus,
        dateRange: { startDate, endDate },
        overview: {
          clicks: Math.round(overview.clicks || 0),
          impressions: Math.round(overview.impressions || 0),
          ctr: round((overview.ctr || 0) * 100),
          position: round(overview.position || 0),
          indexedPages: 0,
          notIndexedPages: 0,
        },
        queries: dimensionRows(queryRows, "query"),
        pages: dimensionRows(pageRows, "page"),
        countries: dimensionRows(countryRows, "country"),
        devices: dimensionRows(deviceRows, "device"),
        indexingStatus: [],
      };
    } catch (error) {
      return {
        configured,
        live: false,
        error: error instanceof Error ? error.message : "Search Console API connection failed.",
        siteUrl,
        oauth: oauthStatus,
        dateRange: { startDate, endDate },
        overview: { clicks: 0, impressions: 0, ctr: 0, position: 0, indexedPages: 0, notIndexedPages: 0 },
        queries: [],
        pages: [],
        countries: [],
        devices: [],
        indexingStatus: [],
      };
    }
  }

  return {
    configured,
    live: false,
    error: oauthStatus.oauthConfigured
      ? "Google Search Console is not connected yet."
      : "Google OAuth client is not configured yet.",
    siteUrl,
    oauth: oauthStatus,
    dateRange: { startDate, endDate },
    overview: { clicks: 0, impressions: 0, ctr: 0, position: 0, indexedPages: 0, notIndexedPages: 0 },
    queries: [],
    pages: [],
    countries: [],
    devices: [],
    indexingStatus: [],
  };
}
