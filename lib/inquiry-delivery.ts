import { updateInquiryDelivery, type InquiryRecord } from "@/lib/adminData";
import { sendInquiryEmail, type InquiryAttachment } from "@/lib/email";

export async function deliverInquiryNotification(record: InquiryRecord, attachment?: InquiryAttachment, sendTestEmail = false) {
  let result: { sent: boolean; provider: string; reason?: string };
  try {
    result = record.isTest && !sendTestEmail
      ? { sent: false, provider: "skipped" }
      : await sendInquiryEmail(record, attachment);
  } catch (error) {
    const smtpStatus = error instanceof Error ? /failed with status (\d{3})/.exec(error.message)?.[1] : undefined;
    result = { sent: false, provider: "error", reason: smtpStatus ? `SMTP rejected the notification (${smtpStatus}).` : "Email transport did not confirm delivery." };
  }
  const deliveryStatus = result.sent ? "sent" : result.provider === "skipped" ? "skipped" : "failed";
  const statusSaved = await updateInquiryDelivery(record.id, {
    deliveryStatus,
    deliveryProvider: result.provider,
    deliveryError: result.reason || "",
  }).catch(() => false);
  if (!statusSaved) console.error("RFQ delivery status could not be saved", { id: record.id, deliveryStatus });
  return { emailSent: result.sent, emailProvider: result.provider, deliveryStatus, statusSaved };
}
