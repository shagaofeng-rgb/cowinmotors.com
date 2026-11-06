import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { getSyncSnapshot } from "@/lib/admin-sync";
import { getAdminDateRange, resolveDateRange } from "@/lib/adminDateRange";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const params = new URL(request.url).searchParams;
  if (!params.size) params.set("range", "week");
  const snapshot = await getSyncSnapshot(resolveDateRange(getAdminDateRange(params)));
  return NextResponse.json(snapshot, { status: snapshot.readable ? 200 : 503 });
}
