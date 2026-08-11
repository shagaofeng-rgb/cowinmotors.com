import { NextResponse } from "next/server";
import { runNewsPublish } from "@/lib/news-automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const siteId = new URL(request.url).searchParams.get("site_id") || "cowinmotors";
    return NextResponse.json(await runNewsPublish(siteId));
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "News publish failed." }, { status: 500 });
  }
}
