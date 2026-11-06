import { ensureCoreSchema, getSql } from "@/lib/database";
import { MONTHLY_EMAIL_JOB, SITEMAP_JOB, scheduledSyncStatus } from "@/lib/sync-health";

type JobRow = {
  id: string;
  job_type: string;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  retry_count: number;
  error_message: string;
  metadata: Record<string, unknown>;
};

const goodStatuses = ["正常", "completed", "published_success", "success", "unchanged", "sent"];

function syncRecord(row: JobRow) {
  const iso = (value: string | null) => value ? new Date(value).toISOString() : "";
  return {
    id: row.id,
    jobType: row.job_type,
    status: row.status,
    scheduledAt: iso(row.scheduled_at),
    startedAt: iso(row.started_at),
    completedAt: iso(row.completed_at),
    retryCount: row.retry_count,
    errorMessage: row.error_message,
    metadata: row.metadata || {},
    healthy: goodStatuses.includes(row.status) && !row.error_message,
  };
}

const sources = [
  { key: SITEMAP_JOB, label: "站点地图 / Google 提交", query: `SELECT * FROM cowin_sync_jobs WHERE job_type = '${SITEMAP_JOB}' AND status <> 'dry-run'` },
  { key: MONTHLY_EMAIL_JOB, label: "每月询价邮件自检", query: `
    SELECT id, '${MONTHLY_EMAIL_JOB}' AS job_type, delivery_status AS status, NULL::timestamptz AS scheduled_at,
      created_at AS started_at, CASE WHEN delivery_status <> 'pending' THEN created_at END AS completed_at,
      0 AS retry_count, delivery_error AS error_message, jsonb_build_object('provider', delivery_provider) AS metadata
    FROM cowin_inquiries WHERE is_test AND source = 'monthly-email-delivery-check'` },
  { key: "blog-webhook", label: "Blog 签名发布", query: `
    SELECT id, 'blog-webhook' AS job_type, status, NULL::timestamptz AS scheduled_at,
      created_at AS started_at, created_at AS completed_at, 0 AS retry_count,
      CASE WHEN status = 'failed' THEN detail ELSE '' END AS error_message,
      jsonb_build_object('eventType', event_type, 'articleId', article_id) AS metadata
    FROM blog_publication_events` },
  { key: "news-ingest", label: "News 来源采集", query: `
    SELECT id, 'news-ingest' AS job_type, status, NULL::timestamptz AS scheduled_at, started_at, completed_at,
      0 AS retry_count, error_message, jsonb_build_object('candidates', candidate_count, 'rejected', rejected_count) AS metadata
    FROM news_ingest_runs` },
  { key: "news-publish", label: "News 自动发布", query: `
    SELECT id, 'news-publish' AS job_type, status, NULL::timestamptz AS scheduled_at, started_at, completed_at,
      GREATEST(attempt_count - 1, 0) AS retry_count, error_message, jsonb_build_object('articleId', article_id) AS metadata
    FROM news_publication_runs` },
] as const;

const HISTORY_LIMIT = 250;
type HealthStatus = "healthy" | "failed" | "missing" | "unavailable" | "empty" | "paused";

export async function getSyncSnapshot({ startDate, endDate }: { startDate: Date; endDate: Date }, now = new Date()) {
  const sql = getSql();
  const ready = sql ? await ensureCoreSchema().catch(() => false) : false;
  const data = await Promise.all(sources.map(async ({ key, label, query }) => {
    const base = { key, label, latest: null, lastSuccessAt: "", rows: [] as ReturnType<typeof syncRecord>[], truncated: false };
    if (!ready || !sql) return { ...base, status: "unavailable" as const };
    try {
      const [result] = await sql.query(`
        WITH source AS NOT MATERIALIZED (${query})
        SELECT
          (SELECT row_to_json(latest) FROM (SELECT * FROM source ORDER BY started_at DESC NULLS LAST LIMIT 1) latest) AS latest,
          (SELECT MAX(COALESCE(completed_at, started_at)) FROM source WHERE status = ANY($4::text[]) AND COALESCE(error_message, '') = '') AS last_success,
          (SELECT json_agg(in_range) FROM (SELECT * FROM source WHERE started_at BETWEEN $1::timestamptz AND $2::timestamptz ORDER BY started_at DESC LIMIT $3) in_range) AS rows
      `, [startDate.toISOString(), endDate.toISOString(), HISTORY_LIMIT + 1, goodStatuses]) as { latest: JobRow | null; last_success: string | null; rows: JobRow[] | null }[];
      const latest = result.latest ? syncRecord(result.latest) : undefined;
      const status: HealthStatus = key === SITEMAP_JOB || key === MONTHLY_EMAIL_JOB ? scheduledSyncStatus(key, latest, now)
        : key === "blog-webhook" ? !latest ? "empty" : latest.healthy ? "healthy" : "failed" : "paused";
      return { key, label, status, latest: latest || null, lastSuccessAt: result.last_success ? new Date(result.last_success).toISOString() : "", rows: (result.rows || []).slice(0, HISTORY_LIMIT).map(syncRecord), truncated: (result.rows?.length || 0) > HISTORY_LIMIT };
    } catch (error) {
      const uninitialized = key !== SITEMAP_JOB && key !== MONTHLY_EMAIL_JOB && (error as { code?: string })?.code === "42P01";
      if (!uninitialized) console.error("Sync job read failed", { source: key, code: (error as { code?: string })?.code });
      return { ...base, status: uninitialized ? key === "blog-webhook" ? "empty" as const : "paused" as const : "unavailable" as const };
    }
  }));
  return {
    sources: data.map(({ rows: _rows, ...source }) => source),
    jobs: data.flatMap(({ rows }) => rows).sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    truncated: data.some((source) => source.truncated),
    readable: ready && data.some((source) => source.status !== "unavailable"),
  };
}
