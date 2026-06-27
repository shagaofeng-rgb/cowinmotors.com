import { neon } from "@neondatabase/serverless";

type SqlClient = ReturnType<typeof neon>;

let sqlClient: SqlClient | null = null;
let schemaReady: Promise<void> | null = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export async function ensureCoreSchema() {
  const sql = getSql();
  if (!sql) return false;

  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS cowin_inquiries (
          id TEXT PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL,
          source TEXT NOT NULL DEFAULT 'website-rfq-form',
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          country TEXT NOT NULL DEFAULT '',
          product_type TEXT NOT NULL DEFAULT '',
          product TEXT NOT NULL DEFAULT '',
          vehicle_info TEXT NOT NULL DEFAULT '',
          quantity TEXT NOT NULL DEFAULT '',
          requirement TEXT NOT NULL DEFAULT ''
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS cowin_analytics_events (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          visitor_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          page TEXT NOT NULL,
          previous_page TEXT NOT NULL DEFAULT '',
          page_title TEXT NOT NULL DEFAULT '',
          referrer TEXT NOT NULL DEFAULT '',
          outbound_url TEXT NOT NULL DEFAULT '',
          target_text TEXT NOT NULL DEFAULT '',
          scroll_depth INTEGER NOT NULL DEFAULT 0,
          duration INTEGER NOT NULL DEFAULT 0,
          utm JSONB NOT NULL DEFAULT '{}'::jsonb,
          browser TEXT NOT NULL DEFAULT '',
          os TEXT NOT NULL DEFAULT '',
          device TEXT NOT NULL DEFAULT '',
          user_agent TEXT NOT NULL DEFAULT '',
          ip TEXT NOT NULL DEFAULT '',
          country TEXT NOT NULL DEFAULT '',
          region TEXT NOT NULL DEFAULT '',
          city TEXT NOT NULL DEFAULT '',
          channel TEXT NOT NULL DEFAULT '',
          source_platform TEXT NOT NULL DEFAULT '',
          source_detail TEXT NOT NULL DEFAULT '',
          timestamp TIMESTAMPTZ NOT NULL,
          client_timestamp TEXT NOT NULL DEFAULT ''
        )
      `;

      await sql`CREATE INDEX IF NOT EXISTS cowin_analytics_events_timestamp_idx ON cowin_analytics_events (timestamp DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS cowin_analytics_events_type_idx ON cowin_analytics_events (type)`;
      await sql`CREATE INDEX IF NOT EXISTS cowin_inquiries_created_at_idx ON cowin_inquiries (created_at DESC)`;
    })();
  }

  await schemaReady;
  return true;
}
