import { getPublishedNews } from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function xmlEscape(value = "") {
  return value.replace(/[<>&"']/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[char] || char);
}

export async function GET() {
  const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const articles = (await getPublishedNews({ limit: 1000, indexableOnly: true }))
    .filter((article) => new Date(article.publishedAt).getTime() >= cutoff);
  const urls = articles.map((article) => `
    <url>
      <loc>https://www.cowinmotors.com/news/${xmlEscape(article.slug)}</loc>
      <lastmod>${new Date(article.updatedAt || article.publishedAt).toISOString()}</lastmod>
      <news:news>
        <news:publication>
          <news:name>Cowinmotors</news:name>
          <news:language>${xmlEscape(article.language || "en")}</news:language>
        </news:publication>
        <news:publication_date>${new Date(article.publishedAt).toISOString()}</news:publication_date>
        <news:title>${xmlEscape(article.title)}</news:title>
      </news:news>
    </url>
  `).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
