import { NextResponse } from "next/server";
import { runSitemapMaintenance } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  try {
    const result = await runSitemapMaintenance({
      trigger: url.searchParams.get("trigger") || "manual-command",
      force: url.searchParams.get("force") === "1",
      dryRun: url.searchParams.get("dryRun") === "1",
      submit: url.searchParams.get("submit") === "1",
      verbose: url.searchParams.get("verbose") === "1",
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Sitemap maintenance failed." }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
