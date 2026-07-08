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
      await sql`SELECT pg_advisory_lock(76652025)`;

      try {
        await sql`
          CREATE TABLE IF NOT EXISTS cowin_inquiries (
            id TEXT PRIMARY KEY,
            created_at TIMESTAMPTZ NOT NULL,
            source TEXT NOT NULL DEFAULT 'website-rfq-form',
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL DEFAULT '',
            country TEXT NOT NULL DEFAULT '',
            product_type TEXT NOT NULL DEFAULT '',
            product TEXT NOT NULL DEFAULT '',
            vehicle_info TEXT NOT NULL DEFAULT '',
            quantity TEXT NOT NULL DEFAULT '',
            requirement TEXT NOT NULL DEFAULT ''
          )
        `;

        await sql`
          ALTER TABLE cowin_inquiries
          ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''
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

        await sql`
          CREATE TABLE IF NOT EXISTS cowin_admin_audit_logs (
            id TEXT PRIMARY KEY,
            created_at TIMESTAMPTZ NOT NULL,
            actor_email TEXT NOT NULL DEFAULT '',
            action TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            resource_id TEXT NOT NULL DEFAULT '',
            ip TEXT NOT NULL DEFAULT '',
            user_agent TEXT NOT NULL DEFAULT '',
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb
          )
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS cowin_system_settings (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL,
            updated_by TEXT NOT NULL DEFAULT ''
          )
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS cowin_admin_users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            display_name TEXT NOT NULL DEFAULT '',
            last_login_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL
          )
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS cowin_product_categories (
            slug TEXT PRIMARY KEY,
            name_en TEXT NOT NULL,
            name_zh TEXT NOT NULL DEFAULT '',
            parent_slug TEXT NOT NULL DEFAULT '',
            enabled BOOLEAN NOT NULL DEFAULT TRUE,
            show_in_nav BOOLEAN NOT NULL DEFAULT TRUE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            seo_title TEXT NOT NULL DEFAULT '',
            seo_description TEXT NOT NULL DEFAULT '',
            updated_at TIMESTAMPTZ NOT NULL
          )
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS cowin_media_assets (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            alt TEXT NOT NULL DEFAULT '',
            asset_type TEXT NOT NULL DEFAULT 'image',
            source TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT '',
            used_by TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL
          )
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS cowin_sync_jobs (
            id TEXT PRIMARY KEY,
            job_type TEXT NOT NULL,
            status TEXT NOT NULL,
            scheduled_at TIMESTAMPTZ,
            started_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ,
            retry_count INTEGER NOT NULL DEFAULT 0,
            error_message TEXT NOT NULL DEFAULT '',
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb
          )
        `;

        await sql`CREATE INDEX IF NOT EXISTS cowin_admin_audit_logs_created_at_idx ON cowin_admin_audit_logs (created_at DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS cowin_admin_audit_logs_resource_idx ON cowin_admin_audit_logs (resource_type, resource_id)`;
        await sql`CREATE INDEX IF NOT EXISTS cowin_media_assets_category_idx ON cowin_media_assets (category)`;
        await sql`CREATE INDEX IF NOT EXISTS cowin_sync_jobs_started_at_idx ON cowin_sync_jobs (started_at DESC NULLS LAST)`;
      } finally {
        await sql`SELECT pg_advisory_unlock(76652025)`;
      }
    })();
  }

  await schemaReady;
  return true;
}
