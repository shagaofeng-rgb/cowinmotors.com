import { NextResponse } from "next/server";
import { InquiryPersistenceError, isNonProductionInquiry, saveInquiryWithSource, updateInquiryDelivery } from "@/lib/adminData";
import { appendAnalyticsEvent, normalizeAnalyticsEvent } from "@/lib/analyticsStore";
import { sendInquiryEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, maxLength = 2000) {
  return String(value || "").trim().slice(0, maxLength);
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

  const source = clean(body.source) || "website-rfq-form";
  const requirement = clean(body.requirement);
  const testInquiry = isNonProductionInquiry({
    name,
    email,
    source,
    product: clean(body.product),
    vehicleInfo: clean(body.vehicleInfo),
    requirement,
    visitorId: clean(body.visitorId, 80),
    sessionId: clean(body.sessionId, 80),
    isTest: false,
  });
  let inquiry;
  try {
    inquiry = await saveInquiryWithSource({
      source,
      name,
      email,
      phone,
      country: clean(body.country),
      productType: clean(body.productType),
      product: clean(body.product),
      vehicleInfo: clean(body.vehicleInfo),
      quantity: clean(body.quantity),
      requirement,
      visitorId: clean(body.visitorId, 80),
      sessionId: clean(body.sessionId, 80),
      landingPage: clean(body.landingPage, 240),
      referrer: clean(body.referrer, 240),
      isTest: testInquiry,
      testReason: testInquiry ? "Automated or explicitly marked test inquiry" : "",
    });
  } catch (error) {
    const message = error instanceof InquiryPersistenceError ? "We could not save your inquiry. Please try again shortly." : "Unable to submit your inquiry.";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const analyticsEvent = normalizeAnalyticsEvent({
    eventId: `form-${inquiry.id}`,
    type: "form_submit",
    page: inquiry.landingPage || "/quote",
    pageTitle: "RFQ form submission",
    referrer: inquiry.referrer,
    utm: body.utm || {},
    targetText: inquiry.product || inquiry.productType,
    visitorId: inquiry.visitorId || "anonymous",
    sessionId: inquiry.sessionId || "session",
    qualityHint: testInquiry ? "test-inquiry" : "",
  }, request);
  const analyticsResult = await appendAnalyticsEvent(analyticsEvent);

  const emailResult = testInquiry
    ? { sent: false, provider: "skipped", reason: "Marked test inquiry; customer notification was not sent." }
    : await sendInquiryEmail(inquiry, attachment || undefined).catch(() => ({
        sent: false,
        provider: "error",
        reason: "Email delivery failed. Please check SMTP credentials and provider settings.",
      }));

  const deliveryStatus = emailResult.sent ? "sent" : testInquiry ? "skipped" : "failed";
  await updateInquiryDelivery(inquiry.id, {
    deliveryStatus,
    deliveryProvider: emailResult.provider,
    deliveryError: emailResult.sent ? "" : emailResult.reason || "Email delivery failed.",
  });

  return NextResponse.json({
    ok: true,
    id: inquiry.id,
    emailSent: emailResult.sent,
    emailProvider: emailResult.provider,
    emailWarning: emailResult.sent ? "" : emailResult.reason,
    deliveryStatus,
    analyticsStored: analyticsResult.ok,
    testExcluded: testInquiry,
  });
}
