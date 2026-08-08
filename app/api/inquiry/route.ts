import { NextResponse } from "next/server";
import { saveInquiryWithSource } from "@/lib/adminData";
import { sendInquiryEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value || "").trim().slice(0, 2000);
}

function attachmentFrom(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const name = clean(raw.name).replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120);
  const type = clean(raw.type).slice(0, 80);
  const contentBase64 = String(raw.contentBase64 || "").replace(/\s/g, "");
  if (!name && !contentBase64) return null;
  if (!name || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(type) || !/^[A-Za-z0-9+/]*={0,2}$/.test(contentBase64)) {
    throw new Error("Invalid product reference attachment.");
  }
  if (Buffer.from(contentBase64, "base64").length > 5 * 1024 * 1024) throw new Error("Attachment must be smaller than 5 MB.");
  return { name, type, contentBase64 };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = clean(body.name);
  const email = clean(body.email);
  const phone = clean(body.phone);

  if (!name || !email || !email.includes("@") || !phone) {
    return NextResponse.json({ ok: false, error: "Name, email, and phone are required." }, { status: 400 });
  }

  let attachment: ReturnType<typeof attachmentFrom>;
  try {
    attachment = attachmentFrom(body.attachment);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid attachment." }, { status: 400 });
  }

  const inquiry = await saveInquiryWithSource({
    source: clean(body.source) || "website-rfq-form",
    name,
    email,
    phone,
    country: clean(body.country),
    productType: clean(body.productType),
    product: clean(body.product),
    vehicleInfo: clean(body.vehicleInfo),
    quantity: clean(body.quantity),
    requirement: clean(body.requirement),
  });

  const emailResult = await sendInquiryEmail(inquiry, attachment || undefined).catch(() => ({
    sent: false,
    provider: "error",
    reason: "Email delivery failed. Please check SMTP credentials and provider settings.",
  }));

  return NextResponse.json({
    ok: true,
    id: inquiry.id,
    emailSent: emailResult.sent,
    emailProvider: emailResult.provider,
    emailWarning: emailResult.sent ? "" : emailResult.reason,
  });
}
