import { appendAnalyticsEvent, normalizeAnalyticsEvent } from "@/lib/analyticsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedEventTypes = new Set(["page_view", "engagement", "click"]);
const noStorageReasons = new Set(["Facebook link preview", "Automated browser", "HTTP test client", "Crawler or preview bot", "Local or preview deployment traffic"]);

export async function POST(request: Request) {
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site" || Number(request.headers.get("content-length")) > 8192) {
      return Response.json({ ok: false, error: "Invalid analytics request." }, { status: 400 });
    }
    const payload = await request.json();
    if (!payload || typeof payload !== "object" || !allowedEventTypes.has(String(payload.type || ""))) {
      return Response.json({ ok: false, error: "Unsupported analytics event." }, { status: 400 });
    }
    const event = normalizeAnalyticsEvent(payload, request);
    if (event.trafficStatus === "excluded" && noStorageReasons.has(event.trafficReason)) {
      return Response.json({ ok: true, eventType: event.type, stored: false });
    }
    const result = await appendAnalyticsEvent(event);
    return Response.json(
      { ok: result.ok, eventType: event.type, storageMode: result.storageMode },
      { status: result.ok ? 200 : 503 },
    );
  } catch (error) {
    console.error("Analytics tracking failed", error);
    return Response.json({ ok: false }, { status: 400 });
  }
}
