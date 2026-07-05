import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { exchangeGoogleSearchConsoleCode } from "@/lib/googleSearchConsoleOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  const url = new URL(request.url);
  const redirectUrl = new URL("/admin/search-console", url.origin);

  if (!session) {
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("error", "session-expired");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const error = url.searchParams.get("error");
  if (error) {
    redirectUrl.searchParams.set("gsc", "oauth-error");
    redirectUrl.searchParams.set("message", error.slice(0, 160));
    return NextResponse.redirect(redirectUrl, 303);
  }

  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  if (!code || !state) {
    redirectUrl.searchParams.set("gsc", "oauth-error");
    redirectUrl.searchParams.set("message", "Google authorization did not return a valid code.");
    return NextResponse.redirect(redirectUrl, 303);
  }

  try {
    await exchangeGoogleSearchConsoleCode(request, code, state);
    redirectUrl.searchParams.set("gsc", "connected");
  } catch (exchangeError) {
    redirectUrl.searchParams.set("gsc", "oauth-error");
    redirectUrl.searchParams.set(
      "message",
      exchangeError instanceof Error ? exchangeError.message.slice(0, 160) : "Google OAuth connection failed.",
    );
  }

  return NextResponse.redirect(redirectUrl, 303);
}
