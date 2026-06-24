import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE_NAME = "cowinmotors_admin_session";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_ADMIN_EMAIL = "admin@cowinmotors.com";

export function getConfiguredAdminEmail() {
  return (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

function sessionSecret() {
  return (
    process.env.ADMIN_JWT_SECRET ||
    process.env.ADMIN_PASSWORD_HASH ||
    process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_DEFAULT_PASSWORD ||
    "cowinmotors-local-admin-secret"
  );
}

function configuredPassword() {
  if (process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD || process.env.ADMIN_DEFAULT_PASSWORD) {
    return true;
  }

  return process.env.NODE_ENV !== "production";
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function hashAdminPassword(password: string) {
  return crypto.createHash("sha256").update(`${password}:${sessionSecret()}`).digest("hex");
}

export function isAdminAuthConfigured() {
  return configuredPassword();
}

export function verifyAdminCredentials(email: string, password: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const variants = [...new Set([password, password.replaceAll("!", "！"), password.replaceAll("！", "!")])];

  if (!normalizedEmail || normalizedEmail !== getConfiguredAdminEmail() || !password || !isAdminAuthConfigured()) {
    return false;
  }

  if (process.env.ADMIN_PASSWORD_HASH) {
    return variants.some((variant) => hashAdminPassword(variant) === process.env.ADMIN_PASSWORD_HASH);
  }

  if (process.env.ADMIN_PASSWORD) {
    return variants.includes(process.env.ADMIN_PASSWORD);
  }

  if (process.env.ADMIN_DEFAULT_PASSWORD) {
    return variants.includes(process.env.ADMIN_DEFAULT_PASSWORD);
  }

  return process.env.NODE_ENV !== "production" && variants.includes("cowinmotors-admin");
}

export function createAdminSession(email: string) {
  const payload = {
    email: String(email || getConfiguredAdminEmail()).trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAdminSession(token?: string) {
  if (!token || !token.includes(".")) return null;

  const [encodedPayload, signature] = token.split(".");
  const expectedSignature = sign(encodedPayload);

  if (!signature || signature.length !== expectedSignature.length) return null;

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as {
      email?: string;
      exp?: number;
    };

    if (!payload.email || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { email: payload.email };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.VERCEL === "1" || process.env.ADMIN_COOKIE_SECURE === "true",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
