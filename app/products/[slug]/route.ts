import { NextResponse } from "next/server";
import { productPath, products } from "@/lib/products";

export const runtime = "nodejs";

function legacyProductPath(product: (typeof products)[number]) {
  try {
    return product.url ? new URL(product.url).pathname.replace(/\/$/, "") : "";
  } catch {
    return "";
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const requestedPath = `/products/${slug}`;
  const product = products.find((item) => legacyProductPath(item) === requestedPath || item.slug === slug);
  if (!product) {
    return new NextResponse("Gone", { status: 410, headers: { "cache-control": "public, max-age=86400" } });
  }
  return NextResponse.redirect(new URL(productPath(product), _request.url), 308);
}
