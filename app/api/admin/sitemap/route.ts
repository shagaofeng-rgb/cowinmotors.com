import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { getSitemapStatus, runSitemapMaintenance } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return NextResponse.json(await getSitemapStatus());
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const payload = await request.json().catch(() => ({})) as { force?: boolean; dryRun?: boolean; submit?: boolean; verbose?: boolean };
  const result = await runSitemapMaintenance({ trigger: "admin", ...payload });
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
