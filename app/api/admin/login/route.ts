import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createAdminSession,
  isAdminAuthConfigured,
  verifyAdminCredentials,
} from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function clientKey(request: Request, email: string) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${ip}:${String(email || "").trim().toLowerCase()}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  return Boolean(entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS);
}

function recordFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  attempts.set(key, entry && entry.resetAt > now ? { ...entry, count: entry.count + 1 } : { count: 1, resetAt: now + WINDOW_MS });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const url = new URL(request.url);
  const key = clientKey(request, email);

  if (isRateLimited(key)) {
    return NextResponse.redirect(new URL("/admin/login?error=rate-limited", url), 303);
  }

  if (!isAdminAuthConfigured()) {
    return NextResponse.redirect(new URL("/admin/login?error=not-configured", url), 303);
  }

  if (!verifyAdminCredentials(email, password)) {
    recordFailure(key);
    return NextResponse.redirect(new URL("/admin/login?error=invalid", url), 303);
  }

  attempts.delete(key);
  const response = NextResponse.redirect(new URL("/admin", url), 303);
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSession(email), adminCookieOptions());
  return response;
}
