import { NextResponse, type NextRequest } from "next/server";
import { normalizedPage } from "@/lib/category-url";

const retiredProductSlugs = new Set([
  "work-wheels-usa-emotion-sticker-work",
  "pdw-group-oem-customized-aluminum-passenger-car-wheels-pdw",
  "pdw-group-aluminium-alloy-lightweight-unique-style-car-wheels-pdw",
]);

function legacyDestination(pathname: string, search: string) {
  if (pathname === "/collections" || pathname.startsWith("/collections/")) {
    const params = new URLSearchParams(search);
    const legacyPage = normalizedPage(params.get("page_num") || undefined);
    params.delete("page_num");
    if (legacyPage > 1 && !params.has("page")) params.set("page", String(legacyPage));
    if (pathname === "/collections/maserati" && !params.has("make")) params.set("make", "Maserati");
    return `/products${params.size ? `?${params}` : ""}`;
  }
  if (pathname === "/search") return `/products${search}`;
  if (pathname === "/pages/order_tracking") return `/track-your-order${search}`;
  return `${pathname}${search}`;
}

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  if (host === "cowinmotors.com") {
    return NextResponse.redirect(new URL(legacyDestination(pathname, search), "https://www.cowinmotors.com"), 308);
  }
  if (retiredProductSlugs.has(pathname.slice("/product/".length)) && pathname.startsWith("/product/")) {
    return new NextResponse(null, { status: 410, headers: { "cache-control": "public, max-age=86400" } });
  }
  const destination = legacyDestination(pathname, search);
  if (destination !== `${pathname}${search}`) {
    return NextResponse.redirect(new URL(destination, request.url), 308);
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
