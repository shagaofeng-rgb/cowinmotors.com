import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for this one-time migration.");

const sql = neon(process.env.DATABASE_URL);
const result = await sql.query(
  "UPDATE blog_articles SET source = 'legacy-import', updated_at = NOW() WHERE source = 'plugin-webhook' RETURNING id",
  [],
);

console.log(JSON.stringify({ updatedLegacyArticles: result.length }, null, 2));
