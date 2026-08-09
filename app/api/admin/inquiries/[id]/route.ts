import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { getInquiryDetail } from "@/lib/adminData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const detail = await getInquiryDetail(id);
  if (!detail) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
  return NextResponse.json(detail);
}
