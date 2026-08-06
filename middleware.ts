import { NextResponse, type NextRequest } from "next/server";

// The custom-framework plugin verifies against the site root. Preserve every normal GET route and forward only root POSTs.
export function middleware(request: NextRequest) {
  if (request.method === "POST" && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/api/webhook/send_article", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
