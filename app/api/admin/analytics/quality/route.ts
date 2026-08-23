import { getAdminDateRange } from "@/lib/adminDateRange";
import { requireAdminApi } from "@/lib/adminApi";
import { getTrafficQualityReport } from "@/lib/analyticsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return Response.json(await getTrafficQualityReport(getAdminDateRange(new URL(request.url).searchParams)));
}
