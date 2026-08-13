import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (host === "cowinmotors.com") {
    const destination = new URL(request.nextUrl.pathname, "https://www.cowinmotors.com");
    destination.search = request.nextUrl.search;
    return NextResponse.redirect(destination, 308);
  }
  const pathname = request.nextUrl.pathname;
  if (pathname === "/collections" || pathname.startsWith("/collections/")) {
    return NextResponse.redirect(new URL("/products", request.url), 308);
  }
  if (pathname === "/search") {
    return NextResponse.redirect(new URL("/products", request.url), 308);
  }
  if (pathname === "/pages/order_tracking") {
    return NextResponse.redirect(new URL("/track-your-order", request.url), 308);
  }
  if (pathname === "/cart/discount-code/remove") {
    return new NextResponse(null, { status: 410, headers: { "cache-control": "public, max-age=86400" } });
  }
  if (request.method === "POST" && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/api/webhook/send_article", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
