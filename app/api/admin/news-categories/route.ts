import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { getNewsCategoryRecords } from "@/lib/adminData";
import { getNewsAdminSnapshot } from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const snapshot = await getNewsAdminSnapshot();
  const articleCounts = new Map<string, number>();
  for (const article of snapshot.articles) {
    const key = article.tags[0] || article.category || "automotive-lighting";
    articleCounts.set(key, (articleCounts.get(key) || 0) + 1);
  }
  return NextResponse.json({
    categories: getNewsCategoryRecords().map((category) => ({
      ...category,
      articleCount: articleCounts.get(category.slug) || 0,
    })),
  });
}
