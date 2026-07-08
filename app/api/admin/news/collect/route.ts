import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { discoverNewsCandidates } from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const candidates = await discoverNewsCandidates();
  return NextResponse.json({
    count: candidates.length,
    candidates: candidates.slice(0, 30).map((candidate) => ({
      title: candidate.title,
      sourcePublisher: candidate.source.publisherName,
      canonicalSourceUrl: candidate.canonicalSourceUrl,
      publishedAt: candidate.publishedAt,
      hasImage: Boolean(candidate.imageUrl),
    })),
  });
}
