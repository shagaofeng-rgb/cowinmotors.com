import { NextResponse } from "next/server";
import { saveInquiryOnce } from "@/lib/adminData";
import { deliverInquiryNotification } from "@/lib/inquiry-delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const { record, created } = await saveInquiryOnce({
    source: "monthly-email-delivery-check",
    name: "Cowinmotors Monthly Form Test",
    email: process.env.INQUIRY_TO_EMAIL || "info@cowinmotors.com",
    phone: "+86 176 0125 5205",
    country: "Automated Monitoring",
    productType: "Website Form Delivery Test",
    product: "Monthly SMTP health check",
    vehicleInfo: "Automated test triggered by Vercel Cron",
    quantity: "1",
    requirement: `Automated monthly test submitted at ${now.toISOString()} to verify that website form emails can still reach the Cowinmotors inbox.`,
    isTest: true,
    testReason: "Monthly automated inquiry email delivery check",
  }, `smtp-check-${now.toISOString().slice(0, 7)}`);

  const result = created ? await deliverInquiryNotification(record, undefined, true) : {
    emailSent: record.deliveryStatus === "sent",
    emailProvider: record.deliveryProvider,
    deliveryStatus: record.deliveryStatus,
    statusSaved: true,
  };
  const ok = result.emailSent && result.statusSaved;
  return NextResponse.json({ ok, id: record.id, duplicate: !created, ...result, checkedAt: now.toISOString() }, { status: ok ? 200 : 503 });
}
