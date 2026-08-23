import { getAnalyticsHealth } from "@/lib/analyticsStore";
import { requireAdminApi } from "@/lib/adminApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const health = await getAnalyticsHealth();
  return Response.json({ ok: health.connected, ...health }, { status: health.connected ? 200 : 503 });
}
