import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { getNewsAdminSnapshot } from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const snapshot = await getNewsAdminSnapshot();
  return NextResponse.json({ audits: snapshot.audits });
}
