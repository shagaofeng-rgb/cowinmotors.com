import { NextResponse } from "next/server";
import { runNewsIngest } from "@/lib/news-automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const siteId = new URL(request.url).searchParams.get("site_id") || "cowinmotors";
    const result = await runNewsIngest(siteId);
    return NextResponse.json(result, { status: result.ok ? 200 : "locked" in result && result.locked ? 409 : 503 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "News ingest failed." }, { status: 500 });
  }
}
