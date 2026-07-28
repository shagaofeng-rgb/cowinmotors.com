import { getSitemapDocument } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const xml = await getSitemapDocument(file);
  if (!xml) return new Response("Sitemap not found.", { status: 404 });
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
