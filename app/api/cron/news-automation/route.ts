import { NextResponse } from "next/server";
import { runNewsAutomation } from "@/lib/news";
import { markSitemapDirty, runSitemapMaintenance } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  try {
    const result = await runNewsAutomation({ dryRun });
    let sitemap = null;
    if (!dryRun) {
      await markSitemapDirty("daily news automation completed");
      sitemap = await runSitemapMaintenance({ trigger: "daily-cron", submit: true });
    }
    return NextResponse.json({ ok: true, result, sitemap });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "News automation failed." },
      { status: 500 },
    );
  }
}
