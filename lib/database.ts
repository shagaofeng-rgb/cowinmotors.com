import { neon } from "@neondatabase/serverless";

type SqlClient = ReturnType<typeof neon>;

let sqlClient: SqlClient | null = null;
let schemaReady: Promise<void> | null = null;

async function ignoreExistingRelation<T>(operation: Promise<T>) {
  try {
    return await operation;
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : "";
    if (code === "23505" || code === "42P07") return null;
    throw error;
  }
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

async function isCoreSchemaCurrent(sql: SqlClient) {
  const rows = await sql`
    SELECT
      (SELECT COUNT(*) FROM pg_class JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_namespace.nspname = 'public' AND pg_class.relname IN (
        'cowin_inquiries', 'cowin_analytics_events', 'cowin_admin_audit_logs',
        'cowin_system_settings', 'cowin_admin_users', 'cowin_product_categories',
        'cowin_media_assets', 'cowin_sync_jobs'
      )) AS relation_count,
      (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND (
        (table_name = 'cowin_inquiries' AND column_name IN (
          'phone', 'visitor_id', 'session_id', 'landing_page', 'referrer',
          'is_test', 'test_reason', 'delivery_status', 'delivery_provider', 'delivery_error'
        )) OR
        (table_name = 'cowin_analytics_events' AND column_name IN (
          'traffic_status', 'traffic_reason', 'ip_hash', 'dedupe_key'
        )))
      ) AS column_count,
      (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname IN (
        'cowin_analytics_events_timestamp_idx', 'cowin_analytics_events_type_idx',
        'cowin_analytics_events_visitor_session_timestamp_idx',
        'cowin_analytics_events_status_timestamp_idx',
        'cowin_analytics_events_country_timestamp_idx',
        'cowin_analytics_events_channel_timestamp_idx',
        'cowin_analytics_events_dedupe_key_idx',
        'cowin_inquiries_created_at_idx', 'cowin_inquiries_visitor_created_at_idx',
        'cowin_inquiries_test_created_at_idx', 'cowin_inquiries_delivery_status_created_at_idx',
        'cowin_admin_audit_logs_created_at_idx', 'cowin_admin_audit_logs_resource_idx',
        'cowin_media_assets_category_idx', 'cowin_sync_jobs_started_at_idx'
      )) AS index_count
  ` as unknown as Array<{ relation_count: string; column_count: string; index_count: string }>;
  const result = rows[0];

  return Number(result.relation_count) === 8 && Number(result.column_count) === 14 && Number(result.index_count) === 15;
}

export async function ensureCoreSchema() {
  const sql = getSql();
  if (!sql) return false;

  if (!schemaReady) {
    schemaReady = (async () => {
      if (await isCoreSchemaCurrent(sql)) return;

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
            requirement TEXT NOT NULL DEFAULT '',
            delivery_status TEXT NOT NULL DEFAULT 'pending',
            delivery_provider TEXT NOT NULL DEFAULT '',
            delivery_error TEXT NOT NULL DEFAULT ''
          )
        `;

        await sql`
          ALTER TABLE cowin_inquiries
          ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''
        `;

        await sql`
          ALTER TABLE cowin_inquiries
          ADD COLUMN IF NOT EXISTS visitor_id TEXT NOT NULL DEFAULT ''
        `;

        await sql`
          ALTER TABLE cowin_inquiries
          ADD COLUMN IF NOT EXISTS session_id TEXT NOT NULL DEFAULT ''
        `;

        await sql`
          ALTER TABLE cowin_inquiries
          ADD COLUMN IF NOT EXISTS landing_page TEXT NOT NULL DEFAULT ''
        `;

        await sql`
          ALTER TABLE cowin_inquiries
          ADD COLUMN IF NOT EXISTS referrer TEXT NOT NULL DEFAULT ''
        `;

        await sql`
          ALTER TABLE cowin_inquiries
          ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE
        `;

        await sql`
          ALTER TABLE cowin_inquiries
          ADD COLUMN IF NOT EXISTS test_reason TEXT NOT NULL DEFAULT ''
        `;

        await sql`
          ALTER TABLE cowin_inquiries
          ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'pending'
        `;

        await sql`
          ALTER TABLE cowin_inquiries
          ADD COLUMN IF NOT EXISTS delivery_provider TEXT NOT NULL DEFAULT ''
        `;

        await sql`
          ALTER TABLE cowin_inquiries
          ADD COLUMN IF NOT EXISTS delivery_error TEXT NOT NULL DEFAULT ''
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
            traffic_status TEXT NOT NULL DEFAULT 'real',
            traffic_reason TEXT NOT NULL DEFAULT '',
            ip_hash TEXT NOT NULL DEFAULT '',
            dedupe_key TEXT NOT NULL DEFAULT '',
            timestamp TIMESTAMPTZ NOT NULL,
            client_timestamp TEXT NOT NULL DEFAULT ''
          )
        `;

        await sql`
          ALTER TABLE cowin_analytics_events
          ADD COLUMN IF NOT EXISTS traffic_status TEXT NOT NULL DEFAULT 'real'
        `;
        await sql`
          ALTER TABLE cowin_analytics_events
          ADD COLUMN IF NOT EXISTS traffic_reason TEXT NOT NULL DEFAULT ''
        `;
        await sql`
          ALTER TABLE cowin_analytics_events
          ADD COLUMN IF NOT EXISTS ip_hash TEXT NOT NULL DEFAULT ''
        `;
        await sql`
          ALTER TABLE cowin_analytics_events
          ADD COLUMN IF NOT EXISTS dedupe_key TEXT NOT NULL DEFAULT ''
        `;

        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_analytics_events_timestamp_idx ON cowin_analytics_events (timestamp DESC)`);
        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_analytics_events_type_idx ON cowin_analytics_events (type)`);
        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_analytics_events_visitor_session_timestamp_idx ON cowin_analytics_events (visitor_id, session_id, timestamp ASC)`);
        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_analytics_events_status_timestamp_idx ON cowin_analytics_events (traffic_status, timestamp DESC)`);
        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_analytics_events_country_timestamp_idx ON cowin_analytics_events (country, timestamp DESC)`);
        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_analytics_events_channel_timestamp_idx ON cowin_analytics_events (channel, timestamp DESC)`);
        await ignoreExistingRelation(sql`CREATE UNIQUE INDEX IF NOT EXISTS cowin_analytics_events_dedupe_key_idx ON cowin_analytics_events (dedupe_key) WHERE dedupe_key <> ''`);
        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_inquiries_created_at_idx ON cowin_inquiries (created_at DESC)`);
        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_inquiries_visitor_created_at_idx ON cowin_inquiries (visitor_id, created_at DESC)`);
        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_inquiries_test_created_at_idx ON cowin_inquiries (is_test, created_at DESC)`);
        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_inquiries_delivery_status_created_at_idx ON cowin_inquiries (delivery_status, created_at DESC)`);

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

        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_admin_audit_logs_created_at_idx ON cowin_admin_audit_logs (created_at DESC)`);
        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_admin_audit_logs_resource_idx ON cowin_admin_audit_logs (resource_type, resource_id)`);
        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_media_assets_category_idx ON cowin_media_assets (category)`);
        await ignoreExistingRelation(sql`CREATE INDEX IF NOT EXISTS cowin_sync_jobs_started_at_idx ON cowin_sync_jobs (started_at DESC NULLS LAST)`);
    })();
  }

  try {
    await schemaReady;
  } catch (error) {
    schemaReady = null;
    throw error;
  }
  return true;
}
