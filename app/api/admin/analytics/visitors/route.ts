import { getAdminDateRange } from "@/lib/adminDateRange";
import { requireAdminApi } from "@/lib/adminApi";
import { getVisitorDirectory } from "@/lib/analyticsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const params = new URL(request.url).searchParams;
  return Response.json(await getVisitorDirectory(getAdminDateRange(params), {
    query: params.get("q") || "",
    country: params.get("country") || "",
    channel: params.get("channel") || "",
    source: params.get("source") || "",
    device: params.get("device") || "",
    label: params.get("label") || "",
    page: Number(params.get("page") || 1),
    pageSize: Number(params.get("pageSize") || 25),
  }));
}
