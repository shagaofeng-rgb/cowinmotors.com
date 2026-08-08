import { NextResponse } from "next/server";
import { publishNextScheduledBuyerGuide } from "@/lib/blog";
import { markSitemapDirty } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await publishNextScheduledBuyerGuide();
    if (result.created) await markSitemapDirty("Scheduled Buyer Guide published");
    return NextResponse.json({ ok: true, ...result, checkedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Scheduled publication failed." }, { status: 500 });
  }
}
