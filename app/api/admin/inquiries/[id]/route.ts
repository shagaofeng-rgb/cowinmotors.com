import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { claimInquiryNotificationRetry, getInquiryDetail, recordAuditLog } from "@/lib/adminData";
import { deliverInquiryNotification } from "@/lib/inquiry-delivery";

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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (request.headers.get("sec-fetch-site") === "cross-site" || !request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (body?.action !== "retry-notification") return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { id } = await params;
  const record = await claimInquiryNotificationRetry(id);
  if (!record) return NextResponse.json({ error: "This notification cannot be retried." }, { status: 409 });
  const result = await deliverInquiryNotification(record);
  await recordAuditLog({
    actorEmail: session.email,
    action: "inquiry.notification.retry",
    resourceType: "inquiry",
    resourceId: id,
    ip: "",
    userAgent: "",
    metadata: { status: result.deliveryStatus, statusSaved: result.statusSaved },
  }).catch(() => undefined);
  return NextResponse.json(result);
}
