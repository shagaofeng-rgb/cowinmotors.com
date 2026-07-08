import { NextResponse } from "next/server";
import { getNewsCategories } from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ categories: await getNewsCategories() });
}
