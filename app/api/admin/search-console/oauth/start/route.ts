import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { buildGoogleSearchConsoleAuthUrl } from "@/lib/googleSearchConsoleOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  try {
    return NextResponse.redirect(buildGoogleSearchConsoleAuthUrl(request), 303);
  } catch (error) {
    const url = new URL("/admin/search-console", request.url);
    url.searchParams.set("gsc", "oauth-config-missing");
    if (error instanceof Error) url.searchParams.set("message", error.message.slice(0, 160));
    return NextResponse.redirect(url, 303);
  }
}
