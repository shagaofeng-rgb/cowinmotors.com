import { appendAnalyticsEvent, normalizeAnalyticsEvent } from "@/lib/analyticsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const event = normalizeAnalyticsEvent(payload, request);
    const result = await appendAnalyticsEvent(event);
    return Response.json({ ok: result.ok, eventType: event.type, storageMode: result.storageMode });
  } catch (error) {
    console.error("Analytics tracking failed", error);
    return Response.json({ ok: false }, { status: 400 });
  }
}
