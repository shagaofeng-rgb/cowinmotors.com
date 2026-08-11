import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (host === "cowinmotors.com") {
    const destination = new URL(request.nextUrl.pathname, "https://www.cowinmotors.com");
    destination.search = request.nextUrl.search;
    return NextResponse.redirect(destination, 308);
  }
  if (request.method === "POST" && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/api/webhook/send_article", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
