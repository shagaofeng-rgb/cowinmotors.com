import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { runNewsAutomation } from "@/lib/news";
import { markSitemapDirty, runSitemapMaintenance } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const result = await runNewsAutomation({ dryRun });
  let sitemap = null;
  if (!dryRun) {
    await markSitemapDirty("admin news publication completed");
    sitemap = await runSitemapMaintenance({ trigger: "content-change", submit: true });
  }
  return NextResponse.json({ ok: true, result, sitemap });
}
