import crypto from "node:crypto";
import fs from "node:fs";
import { ensureCoreSchema, getSql } from "@/lib/database";
import { getGoogleSearchConsoleOAuthAccessToken, getSearchConsoleSiteUrl } from "@/lib/googleSearchConsoleOAuth";
import { getPublishedNews } from "@/lib/news";
import { getPublishedBlogPosts } from "@/lib/blog";
import { productCategoryOptions, productPath, products } from "@/lib/products";
import {
  buildSitemapBundle,
  diffSitemapEntries,
  filterPublicIndexableRecords,
  submitSearchConsoleSitemap,
  validateSitemapXml,
  type NormalizedSitemapEntry,
  type SitemapEntry,
} from "@/lib/sitemap-core.mjs";

const SITE_URL = "https://www.cowinmotors.com";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const CATALOG_UPDATED_AT = process.env.PRODUCT_CATALOG_UPDATED_AT || "2026-07-06T15:54:15+08:00";
const PUBLIC_PAGES_UPDATED_AT = process.env.PUBLIC_PAGES_UPDATED_AT || "2026-07-08T21:17:48+08:00";
const LOCK_TTL_SECONDS = 15 * 60;
const GOOGLE_SUBMISSION_INTERVAL_DAYS = Math.max(3, Number.parseInt(process.env.GOOGLE_SEARCH_CONSOLE_SUBMIT_INTERVAL_DAYS || "3", 10) || 3);
const GOOGLE_SUBMISSION_INTERVAL_MS = GOOGLE_SUBMISSION_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

type SitemapRunOptions = {
  trigger?: string;
  force?: boolean;
  dryRun?: boolean;
  submit?: boolean;
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

type GoogleSubmissionResult = {
  attempted: boolean;
  status: "disabled" | "skipped" | "throttled" | "success" | "failed";
  message: string;
  httpStatus?: number;
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

function cleanPrivateKey(value = "") {
  return value.trim().replace(/\\n/g, "\n");
}

function stablePageEntries(): SitemapEntry[] {
  const paths = ["", "/products", "/quote", "/support", "/news", "/blog"];
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
  const [articles, blogArticles] = await Promise.all([getPublishedNews({ limit: 50_000 }), getPublishedBlogPosts({ limit: 50_000 })]);
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

async function serviceAccountCredentials() {
  const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH || "";
  if (credentialsPath) {
    const raw = await fs.promises.readFile(credentialsPath, "utf8");
    const credentials = JSON.parse(raw) as { client_email?: string; private_key?: string };
    return { clientEmail: credentials.client_email || "", privateKey: cleanPrivateKey(credentials.private_key) };
  }
  return {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL || "",
    privateKey: cleanPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
  };
}

async function sitemapAccessToken() {
  const credentials = await serviceAccountCredentials();
  if (!credentials.clientEmail || !credentials.privateKey) return getGoogleSearchConsoleOAuthAccessToken();
  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify({
    iss: credentials.clientEmail,
    scope: "https://www.googleapis.com/auth/webmasters",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(credentials.privateKey, "base64url");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || `Google OAuth failed: ${response.status}`);
  return payload.access_token as string;
}

async function submitSitemapToGoogle(): Promise<GoogleSubmissionResult> {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || getSearchConsoleSiteUrl();
  const sitemapUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITEMAP_URL || SITEMAP_URL;
  return submitSearchConsoleSitemap({
    enabled: process.env.GOOGLE_SEARCH_CONSOLE_ENABLED === "true",
    siteUrl,
    sitemapUrl,
    getAccessToken: sitemapAccessToken,
  });
}

async function getLastGoogleSubmissionAt() {
  const sql = getSql();
  if (!sql) return "";
  await ensureSitemapSchema();
  const rows = await sql`
    SELECT completed_at
    FROM cowin_sitemap_runs
    WHERE google_status IN ('success', 'failed')
      AND completed_at IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT 1
  ` as Array<{ completed_at: Date | string }>;
  return rows[0]?.completed_at ? new Date(rows[0].completed_at).toISOString() : "";
}

async function shouldSubmitSitemapToGoogle() {
  const lastSubmissionAt = await getLastGoogleSubmissionAt();
  if (!lastSubmissionAt) return { allowed: true, lastSubmissionAt: "", nextAllowedAt: "" };
  const nextAllowedAt = new Date(new Date(lastSubmissionAt).getTime() + GOOGLE_SUBMISSION_INTERVAL_MS).toISOString();
  return {
    allowed: Date.now() >= new Date(nextAllowedAt).getTime(),
    lastSubmissionAt,
    nextAllowedAt,
  };
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
    submit: Boolean(options.submit),
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
    let google: GoogleSubmissionResult = { attempted: false, status: "skipped", message: "No Sitemap changes detected." };
    if (options.submit && changed && !options.dryRun) {
      const schedule = await shouldSubmitSitemapToGoogle();
      google = schedule.allowed
        ? await submitSitemapToGoogle()
        : {
          attempted: false,
          status: "throttled",
          message: `Google Sitemap submission is limited to every ${GOOGLE_SUBMISSION_INTERVAL_DAYS} days. Last attempted at ${schedule.lastSubmissionAt}; next eligible at ${schedule.nextAllowedAt}.`,
        };
    }
    run.googleStatus = google.status;
    run.googleMessage = google.message;
    run.status = changed ? (options.dryRun ? "dry-run" : "success") : "unchanged";
    run.completedAt = new Date().toISOString();
    run.durationMs = Date.now() - started;
    if (!options.dryRun) {
      const sql = getSql();
      if (sql) {
        await sql`
          UPDATE cowin_sitemap_state SET fingerprint = ${bundle.fingerprint}, dirty = FALSE, dirty_reason = '',
            last_generated_at = NOW(), last_success_at = NOW(), manifest = ${JSON.stringify(bundle.entries)}::jsonb,
            google_status = ${google.status}, google_message = ${google.message}, updated_at = NOW()
          WHERE id = 'primary'
        `;
      } else {
        fallbackState = {
          fingerprint: bundle.fingerprint, dirty: false, dirtyReason: "", lastGeneratedAt: run.completedAt,
          lastSuccessAt: run.completedAt, manifest: bundle.entries, googleStatus: google.status, googleMessage: google.message,
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
