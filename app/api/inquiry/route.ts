import { NextResponse } from "next/server";
import { saveInquiryOnce } from "@/lib/adminData";
import { appendAnalyticsEvent, normalizeAnalyticsEvent } from "@/lib/analyticsStore";
import { deliverInquiryNotification } from "@/lib/inquiry-delivery";
import { inquiryAttachment, inquirySubmissionId, inquiryText, isInquiryEmail, MAX_INQUIRY_BYTES } from "@/lib/inquiry-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reject(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return reject("Invalid request.", 403);
  if (Number(request.headers.get("content-length")) > MAX_INQUIRY_BYTES) return reject("Reference files must be 3 MB or smaller.", 413);
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return reject("Invalid quote request.");
  const raw = body as Record<string, unknown>;
  if (inquiryText(raw.website)) return reject("Invalid quote request.");

  const name = inquiryText(raw.name, 120);
  const email = inquiryText(raw.email, 255);
  if (!name || !isInquiryEmail(email)) return reject("Enter a name and a valid email address.");
  const key = inquiryText(raw.idempotencyKey, 64);
  const id = key ? inquirySubmissionId(key, email) : undefined;
  if (key && !id) return reject("Invalid submission key.");

  let attachment: ReturnType<typeof inquiryAttachment>;
  try {
    attachment = inquiryAttachment(raw.attachment);
  } catch (error) {
    return reject(error instanceof Error ? error.message : "Invalid reference file.");
  }

  let saved: Awaited<ReturnType<typeof saveInquiryOnce>>;
  try {
    saved = await saveInquiryOnce({
      source: raw.source === "homepage-missing-model" ? raw.source : "website-rfq-form",
      name,
      email,
      phone: inquiryText(raw.phone, 80),
      country: inquiryText(raw.country, 120),
      productType: inquiryText(raw.productType, 120),
      product: inquiryText(raw.product, 300),
      vehicleInfo: inquiryText(raw.vehicleInfo),
      quantity: inquiryText(raw.quantity, 120),
      requirement: inquiryText(raw.requirement),
      visitorId: inquiryText(raw.visitorId, 80),
      sessionId: inquiryText(raw.sessionId, 80),
      landingPage: inquiryText(raw.landingPage, 240),
      referrer: inquiryText(raw.referrer, 240),
    }, id || undefined);
  } catch {
    return reject("We could not save your inquiry. Please try again shortly.", 503);
  }

  const { record, created } = saved;
  const receipt = { ok: true, id: record.id, testExcluded: record.isTest };
  if (!created) {
    return NextResponse.json({ ...receipt, duplicate: true, emailSent: record.deliveryStatus === "sent", deliveryStatus: record.deliveryStatus });
  }

  // A stored inquiry is accepted even if analytics or the notification channel is down.
  const storeAttribution = async () => appendAnalyticsEvent(normalizeAnalyticsEvent({
    eventId: `form-${record.id}`,
    type: "form_submit",
    page: record.landingPage || "/quote",
    pageTitle: "RFQ form submission",
    referrer: record.referrer,
    utm: raw.utm || {},
    targetText: record.product || record.productType,
    visitorId: record.visitorId || "anonymous",
    sessionId: record.sessionId || "session",
    qualityHint: record.isTest ? "test-inquiry" : "",
  }, request));
  const [delivery, analytics] = await Promise.allSettled([deliverInquiryNotification(record, attachment), storeAttribution()]);
  const notification = delivery.status === "fulfilled" ? delivery.value : { emailSent: false, deliveryStatus: "pending" };
  return NextResponse.json({ ...receipt, ...notification, analyticsStored: analytics.status === "fulfilled" && analytics.value.ok });
}
