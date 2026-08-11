import fs from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

function csv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

async function main() {
  const envFile = await fs.readFile(".env.local", "utf8");
  const line = envFile.split(/\r?\n/).find((entry) => entry.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL is required in .env.local to generate the News triage report.");
  const databaseUrl = line.slice(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "");
  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT slug, title, source_url, source_published_at, published_at, content, indexable
    FROM news_articles
    ORDER BY published_at DESC NULLS LAST, created_at DESC
  `;
  const header = ["site_id", "url", "content_type", "published_at", "title", "source_url", "source_date", "word_count", "duplicate_cluster", "similarity_score", "index_status", "decision", "reason", "redirect_target", "rollback_method", "reviewer"];
  const lines = [header.map(csv).join(",")];
  for (const row of rows) {
    const indexable = row.indexable === true;
    const decision = indexable ? "update" : "noindex-follow";
    const reason = indexable
      ? "Requires source, rights and quality review before remaining indexable under the new News policy."
      : "Legacy external News retained for audit and editorial review; excluded from public lists and sitemap while noindex."
    lines.push([
      "cowinmotors",
      `https://www.cowinmotors.com/news/${row.slug}`,
      "news",
      row.published_at ? new Date(row.published_at).toISOString() : "",
      row.title,
      row.source_url,
      row.source_published_at ? new Date(row.source_published_at).toISOString() : "",
      String(row.content || "").trim().split(/\s+/).filter(Boolean).length,
      "",
      "",
      indexable ? "index" : "noindex,follow",
      decision,
      reason,
      "",
      "Restore indexable flag and public visibility after editorial review.",
      "system-audit",
    ].map(csv).join(","));
  }
  const output = path.join("docs", "news-automation-audit", "cowinmotors", "04-existing-content-triage.csv");
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${lines.join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, output, records: rows.length }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exit(1); });
