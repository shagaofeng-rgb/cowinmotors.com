import { getAnalyticsStorageMode, readAnalyticsEvents } from "@/lib/analyticsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const events = await readAnalyticsEvents();
  return Response.json({ ok: true, storageMode: getAnalyticsStorageMode(), events: events.length });
}
