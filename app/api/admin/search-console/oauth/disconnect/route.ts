import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { deleteGoogleSearchConsoleConnection } from "@/lib/googleSearchConsoleOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  await deleteGoogleSearchConsoleConnection();
  const url = new URL("/admin/search-console", request.url);
  url.searchParams.set("gsc", "disconnected");
  return NextResponse.redirect(url, 303);
}
