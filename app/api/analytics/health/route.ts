import { getAnalyticsStorageMode, readAnalyticsEvents } from "@/lib/analyticsStore";
import { isDatabaseConfigured } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const events = await readAnalyticsEvents();
  return Response.json({
    ok: true,
    storageMode: getAnalyticsStorageMode(),
    databaseConfigured: isDatabaseConfigured(),
    events: events.length,
  });
}
