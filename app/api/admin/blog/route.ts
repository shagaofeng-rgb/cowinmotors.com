import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { getBlogAdminSnapshot } from "@/lib/blog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return NextResponse.json(await getBlogAdminSnapshot());
}
