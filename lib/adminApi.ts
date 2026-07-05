import { getAdminSession } from "@/lib/adminAuth";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getAnalyticsSnapshot, getSearchConsoleSnapshot } from "@/lib/analyticsStore";

export async function requireAdminApi() {
  const session = await getAdminSession();
  if (!session) return Response.json({ message: "Unauthorized" }, { status: 401 });
  return null;
}

export async function analyticsResponse(selector: ((snapshot: Awaited<ReturnType<typeof getAnalyticsSnapshot>>) => unknown) | null, request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const range = getAdminDateRange(new URL(request.url).searchParams);
  const snapshot = await getAnalyticsSnapshot(range);
  return Response.json(selector ? selector(snapshot) : snapshot);
}

export async function searchConsoleResponse() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return Response.json(await getSearchConsoleSnapshot());
}
