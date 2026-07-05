import { NextResponse } from "next/server";
import { saveInquiryWithSource } from "@/lib/adminData";
import { sendInquiryEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const inquiry = await saveInquiryWithSource({
    source: "monthly-email-delivery-check",
    name: "Cowinmotors Monthly Form Test",
    email: process.env.INQUIRY_TO_EMAIL || "davidsha@cowinmotors.com",
    phone: "+86 176 0125 5205",
    country: "Automated Monitoring",
    productType: "Website Form Delivery Test",
    product: "Monthly SMTP health check",
    vehicleInfo: "Automated test triggered by Vercel Cron",
    quantity: "1",
    requirement: `Automated monthly test submitted at ${now.toISOString()} to verify that website form emails can still reach the Cowinmotors inbox.`,
  });

  const emailResult = await sendInquiryEmail(inquiry).catch((error: Error) => ({
    sent: false,
    provider: "error",
    reason: error.message || "Email delivery failed.",
  }));

  if (!emailResult.sent) {
    return NextResponse.json(
      {
        ok: false,
        id: inquiry.id,
        emailSent: false,
        emailProvider: emailResult.provider,
        error: emailResult.reason,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    id: inquiry.id,
    emailSent: true,
    emailProvider: emailResult.provider,
    checkedAt: now.toISOString(),
  });
}
