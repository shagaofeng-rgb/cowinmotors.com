if (typeof process.loadEnvFile === "function") {
  try { process.loadEnvFile(".env.local"); } catch {}
}

const { neon } = await import("@neondatabase/serverless");

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for the one-time News editorial migration.");

const sql = neon(process.env.DATABASE_URL);

await sql.query("ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS indexable BOOLEAN NOT NULL DEFAULT TRUE", []);
await sql.query("ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS editorial_note TEXT NOT NULL DEFAULT ''", []);

const reviewed = await sql`
  UPDATE news_articles
  SET indexable = FALSE,
      editorial_note = CASE
        WHEN editorial_note = '' THEN ${"Legacy automated article retained for URL continuity. Editorial review is required before search indexing."}
        ELSE editorial_note
      END
  WHERE indexable = TRUE
  RETURNING id
`;

const related = await sql`DELETE FROM news_products RETURNING news_id`;
await sql.query("DROP TABLE IF EXISTS news_jobs", []);
await sql.query("DROP TABLE IF EXISTS news_publication_audits", []);
await sql.query("DROP TABLE IF EXISTS news_sources", []);

console.log(JSON.stringify({
  legacyArticlesMovedToManualReview: reviewed.length,
  automaticProductRelationsRemoved: related.length,
  droppedTables: ["news_jobs", "news_publication_audits", "news_sources"],
}, null, 2));
