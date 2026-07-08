import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { runNewsAutomation } from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const result = await runNewsAutomation({ dryRun });
  return NextResponse.json({ ok: true, result });
}
