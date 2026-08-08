import crypto from "node:crypto";
import { ensureCoreSchema, getSql } from "@/lib/database";
import { getPublishedNews } from "@/lib/news";
import { getPublishedBlogPosts } from "@/lib/blog";
import { productCategoryOptions, productPath, products } from "@/lib/products";
import {
  buildSitemapBundle,
  diffSitemapEntries,
  filterPublicIndexableRecords,
  validateSitemapXml,
  type NormalizedSitemapEntry,
  type SitemapEntry,
} from "@/lib/sitemap-core.mjs";

const SITE_URL = "https://www.cowinmotors.com";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const CATALOG_UPDATED_AT = process.env.PRODUCT_CATALOG_UPDATED_AT || "2026-08-08T15:30:00+08:00";
const PUBLIC_PAGES_UPDATED_AT = process.env.PUBLIC_PAGES_UPDATED_AT || "2026-08-08T15:30:00+08:00";
const LOCK_TTL_SECONDS = 15 * 60;

type SitemapRunOptions = {
  trigger?: string;
  force?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
};

type SitemapState = {
  fingerprint: string;
  dirty: boolean;
  dirtyReason: string;
  lastGeneratedAt: string;
  lastSuccessAt: string;
  manifest: NormalizedSitemapEntry[];
  googleStatus: string;
  googleMessage: string;
};

let schemaReady: Promise<boolean> | null = null;
let fallbackState: SitemapState = {
  fingerprint: "",
  dirty: true,
  dirtyReason: "initial generation",
  lastGeneratedAt: "",
  lastSuccessAt: "",
  manifest: [],
  googleStatus: "disabled",
  googleMessage: "",
};
let fallbackLock: { owner: string; expiresAt: number } | null = null;

function stablePageEntries(): SitemapEntry[] {
  const paths = ["", "/products", "/headlights", "/tail-lights", "/exhaust", "/wheels", "/support", "/news", "/blog", "/about", "/contact", "/quality-control", "/packaging-shipping", "/fitment-check", "/wholesale-auto-parts-sourcing", "/returns-warranty", "/payment", "/privacy-policy", "/terms", "/track-your-order", "/installation-guidance", "/sourcing-bulk-orders", "/contact-support"];
  return paths.map((pathname) => ({ loc: `${SITE_URL}${pathname}`, lastmod: PUBLIC_PAGES_UPDATED_AT, type: "pages" }));
}

function categoryEntries(): SitemapEntry[] {
  return productCategoryOptions.map((category) => ({
    loc: `${SITE_URL}/${category.slug}`,
    lastmod: CATALOG_UPDATED_AT,
    type: "categories",
  }));
}

function productEntries(): SitemapEntry[] {
  const records = products
    .filter((product) => product.localImage)
    .map((product) => ({
      loc: `${SITE_URL}${productPath(product)}`,
      canonical: `${SITE_URL}${productPath(product)}`,
      lastmod: String(product.updatedAt || CATALOG_UPDATED_AT),
      type: "products" as const,
      status: String(product.status || ""),
      published: true,
      noindex: false,
      httpStatus: 200,
    }));
  return filterPublicIndexableRecords(records, SITE_URL).map(({ loc, lastmod, type }) => ({ loc, lastmod, type }));
}

export async function collectSitemapEntries(): Promise<SitemapEntry[]> {
  const [articles, blogArticles] = await Promise.all([getPublishedNews({ limit: 50_000, indexableOnly: true }), getPublishedBlogPosts({ limit: 50_000 })]);
  const postEntries: SitemapEntry[] = articles.map((article) => ({
    loc: `${SITE_URL}/news/${article.slug}`,
    lastmod: article.updatedAt || article.publishedAt,
    type: "posts",
  }));
  const blogEntries: SitemapEntry[] = blogArticles.map((article) => ({
    loc: `${SITE_URL}/blog/${article.slug}`,
    lastmod: article.updatedAt || article.publishedAt,
    type: "posts",
  }));
  return [...stablePageEntries(), ...categoryEntries(), ...productEntries(), ...postEntries, ...blogEntries];
}

export async function getSitemapBundle() {
  return buildSitemapBundle(await collectSitemapEntries(), SITE_URL);
}

export async function getSitemapDocument(file: string) {
  if (!/^(pages|categories|products|posts)-[1-9]\d*\.xml$/.test(file)) return null;
  const bundle = await getSitemapBundle();
  return bundle.documents.get(file) || null;
}

export async function ensureSitemapSchema() {
  const sql = getSql();
  if (!sql) return false;
  if (!schemaReady) {
    schemaReady = (async () => {
      await ensureCoreSchema();
      await sql`
        CREATE TABLE IF NOT EXISTS cowin_sitemap_state (
          id TEXT PRIMARY KEY,
          fingerprint TEXT NOT NULL DEFAULT '',
          dirty BOOLEAN NOT NULL DEFAULT TRUE,
          dirty_reason TEXT NOT NULL DEFAULT '',
          last_generated_at TIMESTAMPTZ,
          last_success_at TIMESTAMPTZ,
          manifest JSONB NOT NULL DEFAULT '[]'::jsonb,
          google_status TEXT NOT NULL DEFAULT 'disabled',
          google_message TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO cowin_sitemap_state (id, dirty, dirty_reason)
        VALUES ('primary', TRUE, 'initial generation')
        ON CONFLICT (id) DO NOTHING
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS cowin_sitemap_locks (
          id TEXT PRIMARY KEY,
          owner TEXT NOT NULL,
          acquired_at TIMESTAMPTZ NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS cowin_sitemap_runs (
          id TEXT PRIMARY KEY,
          trigger_type TEXT NOT NULL,
          status TEXT NOT NULL,
          started_at TIMESTAMPTZ NOT NULL,
          completed_at TIMESTAMPTZ,
          duration_ms INTEGER NOT NULL DEFAULT 0,
          force_run BOOLEAN NOT NULL DEFAULT FALSE,
          dry_run BOOLEAN NOT NULL DEFAULT FALSE,
          submit_requested BOOLEAN NOT NULL DEFAULT FALSE,
          total_urls INTEGER NOT NULL DEFAULT 0,
          success_count INTEGER NOT NULL DEFAULT 0,
          skipped_count INTEGER NOT NULL DEFAULT 0,
          error_count INTEGER NOT NULL DEFAULT 0,
          files JSONB NOT NULL DEFAULT '[]'::jsonb,
          added_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
          modified_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
          removed_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
          google_status TEXT NOT NULL DEFAULT 'disabled',
          google_message TEXT NOT NULL DEFAULT '',
          error_message TEXT NOT NULL DEFAULT ''
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS cowin_sitemap_runs_google_status_completed_at_idx
        ON cowin_sitemap_runs (google_status, completed_at DESC)
      `;
      return true;
    })();
  }
  return schemaReady;
}

async function readState(): Promise<SitemapState> {
  const sql = getSql();
  if (!sql) return fallbackState;
  await ensureSitemapSchema();
  const rows = await sql`
    SELECT fingerprint, dirty, dirty_reason, last_generated_at, last_success_at, manifest, google_status, google_message
    FROM cowin_sitemap_state WHERE id = 'primary' LIMIT 1
  ` as Array<{
    fingerprint: string; dirty: boolean; dirty_reason: string; last_generated_at: Date | string | null;
    last_success_at: Date | string | null; manifest: NormalizedSitemapEntry[] | string; google_status: string; google_message: string;
  }>;
  const row = rows[0];
  const manifest = typeof row?.manifest === "string" ? JSON.parse(row.manifest) : row?.manifest;
  return {
    fingerprint: row?.fingerprint || "",
    dirty: row?.dirty ?? true,
    dirtyReason: row?.dirty_reason || "",
    lastGeneratedAt: row?.last_generated_at ? new Date(row.last_generated_at).toISOString() : "",
    lastSuccessAt: row?.last_success_at ? new Date(row.last_success_at).toISOString() : "",
    manifest: Array.isArray(manifest) ? manifest : [],
    googleStatus: row?.google_status || "disabled",
    googleMessage: row?.google_message || "",
  };
}

export async function markSitemapDirty(reason = "content changed") {
  const sql = getSql();
  if (!sql) {
    fallbackState = { ...fallbackState, dirty: true, dirtyReason: reason };
    return;
  }
  await ensureSitemapSchema();
  await sql`
    UPDATE cowin_sitemap_state
    SET dirty = TRUE, dirty_reason = ${reason}, updated_at = NOW()
    WHERE id = 'primary'
  `;
}

async function acquireLock(owner: string) {
  const sql = getSql();
  if (!sql) {
    if (fallbackLock && fallbackLock.expiresAt > Date.now()) return false;
    fallbackLock = { owner, expiresAt: Date.now() + LOCK_TTL_SECONDS * 1000 };
    return true;
  }
  await ensureSitemapSchema();
  const rows = await sql`
    INSERT INTO cowin_sitemap_locks (id, owner, acquired_at, expires_at)
    VALUES ('primary', ${owner}, NOW(), NOW() + (${LOCK_TTL_SECONDS} * INTERVAL '1 second'))
    ON CONFLICT (id) DO UPDATE
      SET owner = EXCLUDED.owner, acquired_at = EXCLUDED.acquired_at, expires_at = EXCLUDED.expires_at
      WHERE cowin_sitemap_locks.expires_at < NOW()
    RETURNING owner
  ` as { owner: string }[];
  return rows[0]?.owner === owner;
}

async function releaseLock(owner: string) {
  const sql = getSql();
  if (!sql) {
    if (fallbackLock?.owner === owner) fallbackLock = null;
    return;
  }
  await sql`DELETE FROM cowin_sitemap_locks WHERE id = 'primary' AND owner = ${owner}`;
}

async function saveRun(run: Record<string, unknown>) {
  const sql = getSql();
  if (!sql) return;
  await ensureSitemapSchema();
  await sql`
    INSERT INTO cowin_sitemap_runs (
      id, trigger_type, status, started_at, completed_at, duration_ms, force_run, dry_run, submit_requested,
      total_urls, success_count, skipped_count, error_count, files, added_urls, modified_urls, removed_urls,
      google_status, google_message, error_message
    ) VALUES (
      ${run.id}, ${run.trigger}, ${run.status}, ${run.startedAt}, ${run.completedAt || null}, ${run.durationMs || 0},
      ${run.force || false}, ${run.dryRun || false}, ${run.submit || false}, ${run.totalUrls || 0}, ${run.successCount || 0},
      ${run.skippedCount || 0}, ${run.errorCount || 0}, ${JSON.stringify(run.files || [])}::jsonb,
      ${JSON.stringify(run.added || [])}::jsonb, ${JSON.stringify(run.modified || [])}::jsonb,
      ${JSON.stringify(run.removed || [])}::jsonb, ${run.googleStatus || "disabled"}, ${run.googleMessage || ""},
      ${run.errorMessage || ""}
    )
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status, completed_at = EXCLUDED.completed_at, duration_ms = EXCLUDED.duration_ms,
      total_urls = EXCLUDED.total_urls, success_count = EXCLUDED.success_count, skipped_count = EXCLUDED.skipped_count,
      error_count = EXCLUDED.error_count, files = EXCLUDED.files, added_urls = EXCLUDED.added_urls,
      modified_urls = EXCLUDED.modified_urls, removed_urls = EXCLUDED.removed_urls, google_status = EXCLUDED.google_status,
      google_message = EXCLUDED.google_message, error_message = EXCLUDED.error_message
  `;
  await sql`
    INSERT INTO cowin_sync_jobs (id, job_type, status, scheduled_at, started_at, completed_at, retry_count, error_message, metadata)
    VALUES (${run.id}, 'sitemap-maintenance', ${run.status === "success" || run.status === "unchanged" ? "正常" : run.status},
      ${run.startedAt}, ${run.startedAt}, ${run.completedAt || null}, 0, ${run.errorMessage || ""},
      ${JSON.stringify({ trigger: run.trigger, totalUrls: run.totalUrls, files: run.files, googleStatus: run.googleStatus })}::jsonb)
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, completed_at = EXCLUDED.completed_at,
      error_message = EXCLUDED.error_message, metadata = EXCLUDED.metadata
  `;
}

export async function runSitemapMaintenance(options: SitemapRunOptions = {}) {
  const started = Date.now();
  const owner = crypto.randomUUID();
  const run = {
    id: owner,
    trigger: options.trigger || "manual",
    status: "running",
    startedAt: new Date(started).toISOString(),
    completedAt: "",
    durationMs: 0,
    force: Boolean(options.force),
    dryRun: Boolean(options.dryRun),
    submit: false,
    totalUrls: 0,
    successCount: 0,
    skippedCount: 0,
    errorCount: 0,
    files: [] as Array<{ file: string; urlCount: number; bytes: number }>,
    added: [] as string[],
    modified: [] as string[],
    removed: [] as string[],
    googleStatus: "disabled",
    googleMessage: "",
    errorMessage: "",
  };
  if (!(await acquireLock(owner))) return { ok: false, locked: true, message: "Another Sitemap task is already running." };
  try {
    const state = await readState();
    const bundle = await getSitemapBundle();
    if (!validateSitemapXml(bundle.indexXml, "sitemapindex")) throw new Error("Generated Sitemap index XML is invalid.");
    for (const [file, xml] of bundle.documents) {
      if (!validateSitemapXml(xml, "urlset")) throw new Error(`Generated Sitemap XML is invalid: ${file}`);
    }
    const diff = diffSitemapEntries(state.manifest, bundle.entries);
    const changed = options.force || state.dirty || state.fingerprint !== bundle.fingerprint || !state.lastSuccessAt;
    run.totalUrls = bundle.entries.length;
    run.successCount = bundle.entries.length;
    run.skippedCount = bundle.errors.length;
    run.errorCount = bundle.errors.length;
    run.files = bundle.indexItems.map(({ file, urlCount, bytes }) => ({ file, urlCount, bytes }));
    run.added = diff.added;
    run.modified = diff.modified;
    run.removed = diff.removed;
    run.googleStatus = "disabled";
    run.googleMessage = "Automatic external indexing submission is disabled. Submit the canonical sitemap in Search Console directly.";
    run.status = changed ? (options.dryRun ? "dry-run" : "success") : "unchanged";
    run.completedAt = new Date().toISOString();
    run.durationMs = Date.now() - started;
    if (!options.dryRun) {
      const sql = getSql();
      if (sql) {
        await sql`
          UPDATE cowin_sitemap_state SET fingerprint = ${bundle.fingerprint}, dirty = FALSE, dirty_reason = '',
            last_generated_at = NOW(), last_success_at = NOW(), manifest = ${JSON.stringify(bundle.entries)}::jsonb,
            google_status = ${run.googleStatus}, google_message = ${run.googleMessage}, updated_at = NOW()
          WHERE id = 'primary'
        `;
      } else {
        fallbackState = {
          fingerprint: bundle.fingerprint, dirty: false, dirtyReason: "", lastGeneratedAt: run.completedAt,
          lastSuccessAt: run.completedAt, manifest: bundle.entries, googleStatus: run.googleStatus, googleMessage: run.googleMessage,
        };
      }
    }
    await saveRun(run);
    console.log(JSON.stringify({ level: "info", message: "Sitemap maintenance completed", ...run, added: run.added.length, modified: run.modified.length, removed: run.removed.length }));
    return {
      ok: true,
      locked: false,
      changed: Boolean(changed),
      ...run,
      addedCount: run.added.length,
      modifiedCount: run.modified.length,
      removedCount: run.removed.length,
      added: options.verbose ? run.added : run.added.slice(0, 20),
      modified: options.verbose ? run.modified : run.modified.slice(0, 20),
      removed: options.verbose ? run.removed : run.removed.slice(0, 20),
    };
  } catch (error) {
    run.status = "failed";
    run.errorMessage = error instanceof Error ? error.message : String(error);
    run.errorCount += 1;
    run.completedAt = new Date().toISOString();
    run.durationMs = Date.now() - started;
    await saveRun(run).catch(() => undefined);
    console.error(JSON.stringify({ level: "error", message: "Sitemap maintenance failed", runId: run.id, error: run.errorMessage, durationMs: run.durationMs }));
    throw error;
  } finally {
    await releaseLock(owner);
  }
}

export async function getSitemapStatus() {
  const state = await readState();
  const sql = getSql();
  if (!sql) return { state, runs: [], siteUrl: SITE_URL, sitemapUrl: SITEMAP_URL };
  await ensureSitemapSchema();
  const runs = await sql`
    SELECT id, trigger_type, status, started_at, completed_at, duration_ms, total_urls, success_count, skipped_count,
      error_count, files, added_urls, modified_urls, removed_urls, google_status, google_message, error_message
    FROM cowin_sitemap_runs ORDER BY started_at DESC LIMIT 30
  `;
  return { state, runs, siteUrl: SITE_URL, sitemapUrl: SITEMAP_URL };
}
