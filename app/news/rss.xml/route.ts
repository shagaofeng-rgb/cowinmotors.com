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
  const articles = await getPublishedNews({ limit: 50 });
  const items = articles.map((article) => `
    <item>
      <title>${xmlEscape(article.title)}</title>
      <link>https://www.cowinmotors.com/news/${xmlEscape(article.slug)}</link>
      <guid>https://www.cowinmotors.com/news/${xmlEscape(article.slug)}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <description>${xmlEscape(article.excerpt)}</description>
      <category>${xmlEscape(article.category)}</category>
      <source url="${xmlEscape(article.canonicalSourceUrl)}">${xmlEscape(article.sourcePublisher)}</source>
    </item>
  `).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Cowinmotors Automotive Parts News</title>
    <link>https://www.cowinmotors.com/news</link>
    <description>Source-backed automotive sourcing news and product fitment analysis.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
