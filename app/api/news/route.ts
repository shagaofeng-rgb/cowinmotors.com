import { NextResponse } from "next/server";
import { getPublishedNews, publicNewsArticle } from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 12) || 12));
  const category = url.searchParams.get("category") || "";
  const tag = url.searchParams.get("tag") || "";
  const articles = await getPublishedNews({ page, limit, category, tag });
  return NextResponse.json({
    page,
    limit,
    category,
    tag,
    articles: articles.map(publicNewsArticle),
  });
}
