import { createHash } from "node:crypto";

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
export const MAX_INQUIRY_BYTES = 4 * 1024 * 1024 + 32 * 1024;

export function inquiryText(value: unknown, limit = 2000) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export function isInquiryEmail(email: string) {
  return email.length <= 254 && /^[^\s@<>,;:\x00-\x1f\x7f]+@[^\s@<>,;:\x00-\x1f\x7f]+\.[^\s@<>,;:\x00-\x1f\x7f]+$/.test(email);
}

export function isNonProductionInquiry({ email, isTest }: { email: string; isTest: boolean }) {
  return isTest || /@example\.(com|net|org)$/i.test(email);
}

export function inquirySubmissionId(key: string, email: string) {
  if (!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(key)) return "";
  return `rfq-${createHash("sha256").update(`${key.toLowerCase()}\0${email.toLowerCase()}`).digest("base64url")}`;
}

export function inquiryAttachment(value: unknown) {
  if (value == null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid reference file.");
  const raw = value as Record<string, unknown>;
  const name = inquiryText(raw.name, 120).replace(/[^a-zA-Z0-9._ -]/g, "_");
  const type = inquiryText(raw.type, 80);
  const contentBase64 = typeof raw.contentBase64 === "string" ? raw.contentBase64 : "";
  if (contentBase64.length > MAX_ATTACHMENT_BYTES * 4 / 3) throw new Error("Reference files must be 3 MB or smaller.");
  if (!name || !contentBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(contentBase64)) throw new Error("Invalid reference file.");
  const data = Buffer.from(contentBase64, "base64");
  if (data.length > MAX_ATTACHMENT_BYTES || data.toString("base64") !== contentBase64) throw new Error("Invalid reference file.");
  const matchesType = type === "image/jpeg" ? data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    : type === "image/png" ? data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : type === "image/webp" ? data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP"
    : type === "application/pdf" && data.toString("ascii", 0, 5) === "%PDF-";
  if (!matchesType) throw new Error("Use a valid JPG, PNG, WebP or PDF reference file.");
  return { name, type, contentBase64 };
}
