import { NextResponse } from "next/server";
import { getAdminOverview } from "@/lib/adminData";
import { getAdminSession } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(getAdminOverview());
}
