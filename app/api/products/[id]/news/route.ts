import { NextResponse } from "next/server";
import { findProduct } from "@/lib/products";
import { getRelatedNewsForProduct, publicNewsArticle } from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const url = new URL(request.url);
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") || 3) || 3));
  const articles = await getRelatedNewsForProduct(product, limit);
  return NextResponse.json({ productId: id, articles: articles.map(publicNewsArticle) });
}
