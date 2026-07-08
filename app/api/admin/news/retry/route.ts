import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { runNewsAutomation } from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = await runNewsAutomation();
  return NextResponse.json({ ok: true, result });
}
