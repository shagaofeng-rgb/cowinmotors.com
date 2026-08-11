import crypto from "node:crypto";
import { ensureCoreSchema, getSql } from "@/lib/database";
import { getNewsSite, type NewsSiteConfig, type NewsSourceConfig, validateNewsSiteConfig } from "@/lib/news-site-config";
import { markSitemapDirty } from "@/lib/sitemap";

type CandidateStatus = "discovered" | "normalized" | "verified" | "scored" | "candidate" | "reserved_for_cycle" | "used" | "rejected" | "retry_pending";
type PublicationStatus = "scheduled" | "selecting" | "composing" | "preflight_validating" | "publishing" | "frontend_verifying" | "published_success" | "retry_pending" | "failed";

type Candidate = {
  id: string;
  siteId: string;
  sourceId: string;
  sourceDomain: string;
  title: string;
  summary: string;
  sourceUrl: string;
  normalizedUrl: string;
  sourcePublishedAt: string;
  sourceAuthor: string;
  language: string;
  score: number;
  status: CandidateStatus;
  rejectReason: string;
  copyrightStatus: string;
};

type ComposedArticle = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  editorialNote: string;
};

let schemaReady: Promise<boolean> | null = null;

function text(value: unknown, max = 20_000) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function slugify(value: string) {
  return text(value, 160).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 92) || "industry-update";
}

function normaliseUrl(value: string) {
  const url = new URL(value);
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach((key) => url.searchParams.delete(key));
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/$/, "") || "/";
  return url.toString();
}

function isAllowedUrl(value: string, source: NewsSourceConfig) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === source.domain || host.endsWith(`.${source.domain}`);
  } catch {
    return false;
  }
}

function parseDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function ageHours(iso: string, now: Date) {
  const timestamp = Date.parse(iso);
  return Number.isFinite(timestamp) ? (now.getTime() - timestamp) / 3_600_000 : Number.POSITIVE_INFINITY;
}

function stripMarkup(value: string) {
  return text(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]*>/g, " ").replace(/&(?:amp|nbsp|quot|#39);/gi, " "));
}

function decodeFeedItems(xml: string) {
  const items = xml.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi) || [];
  const field = (item: string, names: string[]) => {
    for (const name of names) {
      const match = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
      if (match?.[1]) return stripMarkup(match[1].replace(/^<!\[CDATA\[|\]\]>$/g, ""));
    }
    return "";
  };
  return items.map((item) => {
    const linkMatch = item.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
    return {
      title: field(item, ["title"]),
      summary: field(item, ["description", "summary", "content"]),
      url: linkMatch?.[1] || field(item, ["link", "guid"]),
      publishedAt: field(item, ["pubDate", "published", "updated", "dc:date"]),
      author: field(item, ["dc:creator", "author", "creator"]),
    };
  });
}

function scoreCandidate(site: NewsSiteConfig, source: NewsSourceConfig, candidate: Pick<Candidate, "title" | "summary" | "sourcePublishedAt">, now: Date) {
  const corpus = `${candidate.title} ${candidate.summary}`.toLowerCase();
  const relevantTerms = ["headlight", "tail light", "lighting", "exhaust", "wheel", "forged", "body", "fitment", "aftermarket", "automotive", "vehicle", "repair", "supply chain", "packaging", "safety", "standard", "regulation"];
  const impactTerms = ["recall", "regulation", "standard", "safety", "supply", "technology", "launch", "repair", "compliance", "logistics"];
  const relevance = Math.min(30, relevantTerms.filter((term) => corpus.includes(term)).length * 5);
  const impact = Math.min(20, impactTerms.filter((term) => corpus.includes(term)).length * 4);
  const freshness = ageHours(candidate.sourcePublishedAt, now) <= 24 ? 15 : ageHours(candidate.sourcePublishedAt, now) <= 72 ? 10 : 0;
  const verification = Math.min(15, Math.round(source.sourceTrustScore / 6));
  const theme = activeTheme(site, now);
  const productContext = theme && corpus.includes(theme.productName.split(" ")[0].toLowerCase()) ? 15 : 5;
  return Math.min(100, relevance + impact + freshness + verification + productContext + 5);
}

function activeTheme(site: NewsSiteConfig, now: Date) {
  const at = now.getTime();
  return site.productThemePlan.find((theme) => theme.status === "active" && Date.parse(theme.startAt) <= at && at <= Date.parse(theme.endAt));
}

function countWords(value: string) {
  return text(value, 200_000).split(/\s+/).filter(Boolean).length;
}

function containsSalesCta(value: string) {
  return /\b(request (?:a )?quote|contact us|whatsapp|buy now|add to cart|order now|moq|special offer)\b/i.test(value);
}

export function validateComposedNews(site: NewsSiteConfig, article: ComposedArticle) {
  const failures: string[] = [];
  const words = countWords(article.content);
  if (words < site.news.desiredWordCount.min || words > site.news.desiredWordCount.max) failures.push(`word count ${words} is outside the configured range`);
  if (!text(article.title, 180) || !text(article.excerpt, 360) || !text(article.content, 100_000)) failures.push("title, excerpt or content is missing");
  if (containsSalesCta(`${article.title} ${article.excerpt} ${article.content}`)) failures.push("sales CTA detected in News content");
  return { ok: failures.length === 0, failures, words };
}

export async function ensureNewsAutomationSchema() {
  const sql = getSql();
  if (!sql) return false;
  if (!schemaReady) {
    schemaReady = (async () => {
      await ensureCoreSchema();
      await sql`SELECT pg_advisory_lock(61601248)`;
      try {
        await sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'cowinmotors'`;
        await sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS source_fingerprint TEXT NOT NULL DEFAULT ''`;
        await sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS event_fingerprint TEXT NOT NULL DEFAULT ''`;
        await sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS content_hash TEXT NOT NULL DEFAULT ''`;
        await sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS relevance_score INTEGER NOT NULL DEFAULT 0`;
        await sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS credibility_score INTEGER NOT NULL DEFAULT 0`;
        await sql`CREATE INDEX IF NOT EXISTS news_articles_site_public_idx ON news_articles (site_id, status, indexable, published_at DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS news_articles_site_source_fingerprint_idx ON news_articles (site_id, source_fingerprint)`;
        await sql`
          CREATE TABLE IF NOT EXISTS news_ingest_runs (
            id TEXT PRIMARY KEY, site_id TEXT NOT NULL, cycle_key TEXT NOT NULL, status TEXT NOT NULL,
            started_at TIMESTAMPTZ NOT NULL, completed_at TIMESTAMPTZ, discovered_count INTEGER NOT NULL DEFAULT 0,
            candidate_count INTEGER NOT NULL DEFAULT 0, rejected_count INTEGER NOT NULL DEFAULT 0,
            source_health JSONB NOT NULL DEFAULT '{}'::jsonb, error_message TEXT NOT NULL DEFAULT '',
            UNIQUE(site_id, cycle_key)
          )
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS news_candidates (
            id TEXT PRIMARY KEY, site_id TEXT NOT NULL, source_id TEXT NOT NULL, source_domain TEXT NOT NULL,
            title TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '', source_url TEXT NOT NULL, normalized_url TEXT NOT NULL,
            normalized_url_hash TEXT NOT NULL, title_hash TEXT NOT NULL, content_fingerprint TEXT NOT NULL,
            source_published_at TIMESTAMPTZ NOT NULL, source_author TEXT NOT NULL DEFAULT '', language TEXT NOT NULL,
            industry_tags JSONB NOT NULL DEFAULT '[]'::jsonb, score INTEGER NOT NULL DEFAULT 0,
            copyright_status TEXT NOT NULL DEFAULT 'owned-neutral-image', status TEXT NOT NULL, reject_reason TEXT NOT NULL DEFAULT '',
            reserved_cycle_key TEXT NOT NULL DEFAULT '', used_article_id TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(site_id, normalized_url_hash)
          )
        `;
        await sql`CREATE INDEX IF NOT EXISTS news_candidates_site_status_score_idx ON news_candidates (site_id, status, score DESC, source_published_at DESC)`;
        await sql`
          CREATE TABLE IF NOT EXISTS news_candidate_fingerprints (
            site_id TEXT NOT NULL, fingerprint TEXT NOT NULL, candidate_id TEXT NOT NULL, fingerprint_type TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (site_id, fingerprint, fingerprint_type)
          )
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS news_product_theme_windows (
            site_id TEXT NOT NULL, theme_id TEXT NOT NULL, product_url TEXT NOT NULL, product_name TEXT NOT NULL,
            start_at TIMESTAMPTZ NOT NULL, end_at TIMESTAMPTZ NOT NULL, status TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (site_id, theme_id, start_at)
          )
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS news_publication_runs (
            id TEXT PRIMARY KEY, site_id TEXT NOT NULL, cycle_key TEXT NOT NULL, status TEXT NOT NULL,
            candidate_id TEXT NOT NULL DEFAULT '', article_id TEXT NOT NULL DEFAULT '', content_fingerprint TEXT NOT NULL DEFAULT '',
            attempt_count INTEGER NOT NULL DEFAULT 0, started_at TIMESTAMPTZ NOT NULL, completed_at TIMESTAMPTZ,
            error_message TEXT NOT NULL DEFAULT '', correlation_id TEXT NOT NULL DEFAULT '', UNIQUE(site_id, cycle_key)
          )
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS news_delivery_checks (
            id TEXT PRIMARY KEY, site_id TEXT NOT NULL, publication_run_id TEXT NOT NULL, article_id TEXT NOT NULL,
            list_url TEXT NOT NULL, detail_url TEXT NOT NULL, list_status INTEGER NOT NULL, detail_status INTEGER NOT NULL,
            sitemap_status INTEGER NOT NULL, rss_status INTEGER NOT NULL, passed BOOLEAN NOT NULL, evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
            checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS news_audit_events (
            id TEXT PRIMARY KEY, site_id TEXT NOT NULL, event_type TEXT NOT NULL, severity TEXT NOT NULL,
            correlation_id TEXT NOT NULL DEFAULT '', detail TEXT NOT NULL, metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS news_task_locks (
            lock_key TEXT PRIMARY KEY, site_id TEXT NOT NULL, task_name TEXT NOT NULL, owner_id TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL, heartbeat_at TIMESTAMPTZ NOT NULL
          )
        `;
      } finally {
        await sql`SELECT pg_advisory_unlock(61601248)`;
      }
      return true;
    })().catch((error) => { schemaReady = null; throw error; });
  }
  return schemaReady;
}

async function audit(siteId: string, eventType: string, severity: "info" | "warning" | "critical", detail: string, metadata: Record<string, unknown> = {}, correlationId = "") {
  const sql = getSql();
  if (!sql) return;
  await sql`INSERT INTO news_audit_events (id, site_id, event_type, severity, correlation_id, detail, metadata) VALUES (${crypto.randomUUID()}, ${siteId}, ${eventType}, ${severity}, ${correlationId}, ${detail.slice(0, 1_000)}, ${JSON.stringify(metadata)}::jsonb)`;
}

async function acquireLock(siteId: string, taskName: string, cycleKey: string, ownerId: string, ttlMinutes = 20) {
  const sql = getSql();
  if (!sql) return false;
  const lockKey = `news:${taskName}:${siteId}:${cycleKey}`;
  const rows = await sql`
    INSERT INTO news_task_locks (lock_key, site_id, task_name, owner_id, expires_at, heartbeat_at)
    VALUES (${lockKey}, ${siteId}, ${taskName}, ${ownerId}, NOW() + (${ttlMinutes} * INTERVAL '1 minute'), NOW())
    ON CONFLICT (lock_key) DO UPDATE SET owner_id = EXCLUDED.owner_id, expires_at = EXCLUDED.expires_at, heartbeat_at = NOW()
    WHERE news_task_locks.expires_at < NOW()
    RETURNING owner_id
  ` as Array<{ owner_id: string }>;
  return rows[0]?.owner_id === ownerId;
}

async function releaseLock(siteId: string, taskName: string, cycleKey: string, ownerId: string) {
  const sql = getSql();
  if (!sql) return;
  await sql`DELETE FROM news_task_locks WHERE lock_key = ${`news:${taskName}:${siteId}:${cycleKey}`} AND owner_id = ${ownerId}`;
}

function cycleKey(date: Date, intervalHours: number) {
  const bucket = Math.floor(date.getTime() / (intervalHours * 3_600_000));
  return `${intervalHours}h-${bucket}`;
}

async function upsertThemePlan(site: NewsSiteConfig) {
  const sql = getSql();
  if (!sql) return;
  for (const theme of site.productThemePlan) {
    await sql`
      INSERT INTO news_product_theme_windows (site_id, theme_id, product_url, product_name, start_at, end_at, status)
      VALUES (${site.siteId}, ${theme.themeId}, ${theme.productUrl}, ${theme.productName}, ${theme.startAt}, ${theme.endAt}, ${theme.status})
      ON CONFLICT (site_id, theme_id, start_at) DO UPDATE SET product_url = EXCLUDED.product_url, product_name = EXCLUDED.product_name, end_at = EXCLUDED.end_at, status = EXCLUDED.status, updated_at = NOW()
    `;
  }
}

export async function runNewsIngest(siteId = "cowinmotors", now = new Date(), sourceGroup: "primary" | "fallback" = "primary") {
  const site = getNewsSite(siteId);
  const validation = validateNewsSiteConfig(site);
  if (!validation.ok) throw new Error(`Invalid News site config: ${validation.failures.join("; ")}`);
  if (!site.enabled || !site.news.enabled) return { ok: true, skipped: true, reason: "News is disabled for this site." };
  if (!site.publishing.productionEnabled) return { ok: true, skipped: true, reason: "Production News automation is disabled by configuration." };
  if (!getSql()) throw new Error("News ingest requires a configured database.");
  await ensureNewsAutomationSchema();
  await upsertThemePlan(site);
  const cycle = `${sourceGroup}-${cycleKey(now, site.news.ingestIntervalHours)}`;
  const owner = crypto.randomUUID();
  if (!(await acquireLock(siteId, "ingest", cycle, owner))) return { ok: false, locked: true };
  const sql = getSql()!;
  const runId = crypto.randomUUID();
  let discovered = 0;
  let candidates = 0;
  let rejected = 0;
  const health: Record<string, string> = {};
  try {
    await sql`INSERT INTO news_ingest_runs (id, site_id, cycle_key, status, started_at) VALUES (${runId}, ${siteId}, ${cycle}, 'running', NOW()) ON CONFLICT (site_id, cycle_key) DO UPDATE SET status = 'running', started_at = NOW(), completed_at = NULL`;
    const sources = sourceGroup === "primary" ? site.sources.primaryWhitelist : site.sources.fallbackWhitelist;
    for (const source of sources) {
      try {
        const response = await fetch(source.rssOrApiUrl, { headers: { "user-agent": "CowinmotorsNewsIngest/1.0 (+https://www.cowinmotors.com/news)" }, signal: AbortSignal.timeout(12_000) });
        if (!response.ok) throw new Error(`source HTTP ${response.status}`);
        const feed = await response.text();
        const items = decodeFeedItems(feed).slice(0, 30);
        health[source.id] = `ok:${items.length}`;
        for (const item of items) {
          discovered += 1;
          const title = text(item.title, 240);
          const sourceUrl = text(item.url, 2_000);
          const sourcePublishedAt = parseDate(item.publishedAt);
          let rejectReason = "";
          let normalizedUrl = "";
          if (!title || !sourceUrl || !sourcePublishedAt) rejectReason = "missing title, URL or trustworthy publication date";
          else if (!isAllowedUrl(sourceUrl, source)) rejectReason = "source URL is outside the configured whitelist domain";
          else if (ageHours(sourcePublishedAt, now) < -2 || ageHours(sourcePublishedAt, now) > site.news.candidateMaxAgeHours) rejectReason = "source is outside the 72-hour candidate window";
          else normalizedUrl = normaliseUrl(sourceUrl);
          const summary = text(stripMarkup(item.summary), 2_000);
          const draft: Candidate = { id: crypto.randomUUID(), siteId, sourceId: source.id, sourceDomain: source.domain, title, summary, sourceUrl, normalizedUrl, sourcePublishedAt, sourceAuthor: text(item.author, 160), language: site.publicationLanguage, score: 0, status: "rejected", rejectReason, copyrightStatus: "owned-neutral-image" };
          if (!rejectReason) {
            draft.score = scoreCandidate(site, source, draft, now);
            if (draft.score < site.news.minScore) draft.rejectReason = `score ${draft.score} is below ${site.news.minScore}`;
            else draft.status = "candidate";
          }
          const urlHash = hash(draft.normalizedUrl || `${source.id}:${title}`);
          const titleHash = hash(title.toLowerCase());
          const contentFingerprint = hash(`${title.toLowerCase()}\n${summary.toLowerCase().slice(0, 600)}`);
          const existing = await sql`SELECT id FROM news_candidates WHERE site_id = ${siteId} AND (normalized_url_hash = ${urlHash} OR title_hash = ${titleHash} OR content_fingerprint = ${contentFingerprint}) LIMIT 1` as Array<{ id: string }>;
          if (existing[0]) continue;
          await sql`
            INSERT INTO news_candidates (id, site_id, source_id, source_domain, title, summary, source_url, normalized_url, normalized_url_hash, title_hash, content_fingerprint, source_published_at, source_author, language, industry_tags, score, copyright_status, status, reject_reason)
            VALUES (${draft.id}, ${siteId}, ${source.id}, ${source.domain}, ${title}, ${summary}, ${sourceUrl}, ${draft.normalizedUrl || sourceUrl}, ${urlHash}, ${titleHash}, ${contentFingerprint}, ${sourcePublishedAt || now.toISOString()}, ${draft.sourceAuthor}, ${site.publicationLanguage}, ${JSON.stringify(source.allowedTopics)}::jsonb, ${draft.score}, ${draft.copyrightStatus}, ${draft.status}, ${draft.rejectReason})
          `;
          await sql`INSERT INTO news_candidate_fingerprints (site_id, fingerprint, candidate_id, fingerprint_type) VALUES (${siteId}, ${urlHash}, ${draft.id}, 'url'), (${siteId}, ${titleHash}, ${draft.id}, 'title'), (${siteId}, ${contentFingerprint}, ${draft.id}, 'content') ON CONFLICT DO NOTHING`;
          if (draft.status === "candidate") candidates += 1; else rejected += 1;
        }
      } catch (error) {
        health[source.id] = `error:${error instanceof Error ? error.message.slice(0, 180) : "unknown"}`;
      }
    }
    await sql`UPDATE news_ingest_runs SET status = 'completed', completed_at = NOW(), discovered_count = ${discovered}, candidate_count = ${candidates}, rejected_count = ${rejected}, source_health = ${JSON.stringify(health)}::jsonb WHERE id = ${runId}`;
    await audit(siteId, "news_ingest_completed", "info", "Ingest completed without composing or publishing content.", { cycle, discovered, candidates, rejected, health }, runId);
    return { ok: true, runId, cycle, discovered, candidates, rejected, health };
  } catch (error) {
    const message = error instanceof Error ? error.message : "News ingest failed.";
    await sql`UPDATE news_ingest_runs SET status = 'failed', completed_at = NOW(), error_message = ${message.slice(0, 1_000)} WHERE id = ${runId}`.catch(() => undefined);
    await audit(siteId, "news_ingest_failed", "critical", message, { cycle }, runId).catch(() => undefined);
    throw error;
  } finally {
    await releaseLock(siteId, "ingest", cycle, owner);
  }
}

async function composeWithAdapter(site: NewsSiteConfig, candidate: Candidate, theme: NonNullable<ReturnType<typeof activeTheme>>) {
  const endpoint = process.env.NEWS_COMPOSER_URL;
  const token = process.env.NEWS_COMPOSER_TOKEN;
  if (!endpoint || !token) throw new Error("News composer is not configured. Set NEWS_COMPOSER_URL and NEWS_COMPOSER_TOKEN before enabling production automation.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ site, candidate: { title: candidate.title, summary: candidate.summary, sourceUrl: candidate.sourceUrl, sourcePublishedAt: candidate.sourcePublishedAt, sourceAuthor: candidate.sourceAuthor, sourceDomain: candidate.sourceDomain }, theme: { themeId: theme.themeId, productUrl: theme.productUrl, productName: theme.productName }, requirements: { wordCount: site.news.desiredWordCount, externalSourceOnly: true, maxInternalProductLinks: site.news.maxInternalProductLinks, forbidSalesCta: true } }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`News composer HTTP ${response.status}`);
  const payload = await response.json() as Partial<ComposedArticle>;
  return {
    title: text(payload.title, 180), excerpt: text(payload.excerpt, 360), content: text(payload.content, 100_000), category: text(payload.category, 120) || "Automotive Parts Insights", tags: Array.isArray(payload.tags) ? payload.tags.map((tag) => text(tag, 80)).filter(Boolean).slice(0, 8) : [], seoTitle: text(payload.seoTitle, 180), seoDescription: text(payload.seoDescription, 320), editorialNote: text(payload.editorialNote, 1_200),
  };
}

async function verifyFrontend(site: NewsSiteConfig, article: { id: string; slug: string; title: string; sourceUrl: string }, runId: string) {
  const listUrl = new URL(site.news.listRoute, site.siteUrl).toString();
  const detailUrl = new URL(site.news.detailRoutePattern.replace("[slug]", article.slug), site.siteUrl).toString();
  const sitemapUrl = new URL(site.news.sitemapRoute, site.siteUrl).toString();
  const rssUrl = new URL(site.news.rssRoute, site.siteUrl).toString();
  const [list, detail, sitemap, rss] = await Promise.all([fetch(listUrl), fetch(detailUrl), fetch(sitemapUrl), fetch(rssUrl)]);
  const [listBody, detailBody, sitemapBody, rssBody] = await Promise.all([list.text(), detail.text(), sitemap.text(), rss.text()]);
  const passed = list.ok && detail.ok && sitemap.ok && rss.ok && listBody.includes(article.title) && detailBody.includes(article.title) && detailBody.includes(article.sourceUrl) && sitemapBody.includes(`/news/${article.slug}`) && rssBody.includes(`/news/${article.slug}`);
  const sql = getSql();
  if (sql) await sql`INSERT INTO news_delivery_checks (id, site_id, publication_run_id, article_id, list_url, detail_url, list_status, detail_status, sitemap_status, rss_status, passed, evidence) VALUES (${crypto.randomUUID()}, ${site.siteId}, ${runId}, ${article.id}, ${listUrl}, ${detailUrl}, ${list.status}, ${detail.status}, ${sitemap.status}, ${rss.status}, ${passed}, ${JSON.stringify({ listHasTitle: listBody.includes(article.title), detailHasTitle: detailBody.includes(article.title), detailHasSource: detailBody.includes(article.sourceUrl), sitemapHasUrl: sitemapBody.includes(`/news/${article.slug}`), rssHasUrl: rssBody.includes(`/news/${article.slug}`) })}::jsonb)`;
  return { passed, listUrl, detailUrl, statuses: { list: list.status, detail: detail.status, sitemap: sitemap.status, rss: rss.status } };
}

export async function runNewsPublish(siteId = "cowinmotors", now = new Date()) {
  const site = getNewsSite(siteId);
  const validation = validateNewsSiteConfig(site);
  if (!validation.ok) throw new Error(`Invalid News site config: ${validation.failures.join("; ")}`);
  if (!site.publishing.productionEnabled) return { ok: true, skipped: true, reason: "Production News automation is disabled by configuration." };
  if (!getSql()) throw new Error("News publishing requires a configured database.");
  await ensureNewsAutomationSchema();
  const sql = getSql()!;
  const latest = await sql`SELECT completed_at FROM news_publication_runs WHERE site_id = ${siteId} AND status = 'published_success' ORDER BY completed_at DESC LIMIT 1` as Array<{ completed_at: Date | string }>;
  if (latest[0] && now.getTime() - new Date(latest[0].completed_at).getTime() < site.news.publishIntervalHours * 3_600_000) return { ok: true, skipped: true, reason: "A verified News article was published within the active 48-hour window." };
  const cycle = cycleKey(now, site.news.publishIntervalHours);
  const owner = crypto.randomUUID();
  if (!(await acquireLock(siteId, "publish", cycle, owner, 45))) return { ok: false, locked: true };
  const runId = crypto.randomUUID();
  try {
    await sql`INSERT INTO news_publication_runs (id, site_id, cycle_key, status, started_at, correlation_id) VALUES (${runId}, ${siteId}, ${cycle}, 'selecting', NOW(), ${runId}) ON CONFLICT (site_id, cycle_key) DO UPDATE SET status = 'selecting', started_at = NOW(), completed_at = NULL, attempt_count = news_publication_runs.attempt_count + 1, error_message = ''`;
    let candidateRows = await sql`SELECT * FROM news_candidates WHERE site_id = ${siteId} AND status = 'candidate' AND source_published_at >= ${new Date(now.getTime() - site.news.candidateMaxAgeHours * 3_600_000).toISOString()} ORDER BY score DESC, source_published_at DESC LIMIT 1` as Array<Record<string, unknown>>;
    if (!candidateRows[0]) {
      await runNewsIngest(siteId, now, "fallback");
      candidateRows = await sql`SELECT * FROM news_candidates WHERE site_id = ${siteId} AND status = 'candidate' AND source_published_at >= ${new Date(now.getTime() - site.news.fallbackCandidateMaxAgeDays * 86_400_000).toISOString()} ORDER BY score DESC, source_published_at DESC LIMIT 1` as Array<Record<string, unknown>>;
    }
    if (!candidateRows[0]) throw new Error("No verified candidate is available after primary and fallback ingest.");
    const row = candidateRows[0];
    const candidate: Candidate = { id: text(row.id, 100), siteId, sourceId: text(row.source_id, 100), sourceDomain: text(row.source_domain, 240), title: text(row.title, 240), summary: text(row.summary, 2_000), sourceUrl: text(row.source_url, 2_000), normalizedUrl: text(row.normalized_url, 2_000), sourcePublishedAt: new Date(String(row.source_published_at)).toISOString(), sourceAuthor: text(row.source_author, 160), language: text(row.language, 20), score: Number(row.score) || 0, status: "candidate", rejectReason: "", copyrightStatus: text(row.copyright_status, 120) };
    const theme = activeTheme(site, now);
    if (!theme) throw new Error("No active product theme is configured for this publication window.");
    await sql`UPDATE news_candidates SET status = 'reserved_for_cycle', reserved_cycle_key = ${cycle}, updated_at = NOW() WHERE id = ${candidate.id} AND site_id = ${siteId}`;
    await sql`UPDATE news_publication_runs SET status = 'composing', candidate_id = ${candidate.id} WHERE id = ${runId}`;
    const composed = await composeWithAdapter(site, candidate, theme);
    const preflight = validateComposedNews(site, composed);
    if (!preflight.ok) throw new Error(`News preflight rejected: ${preflight.failures.join("; ")}`);
    const fingerprint = hash(`${siteId}\n${cycle}\n${composed.title.toLowerCase()}\n${candidate.normalizedUrl}`);
    await sql`UPDATE news_publication_runs SET status = 'publishing', content_fingerprint = ${fingerprint} WHERE id = ${runId}`;
    const existing = await sql`SELECT id, slug FROM news_articles WHERE site_id = ${siteId} AND source_fingerprint = ${hash(candidate.normalizedUrl)} LIMIT 1` as Array<{ id: string; slug: string }>;
    if (existing[0]) throw new Error("Candidate source already has a News article for this site.");
    const articleId = crypto.randomUUID();
    const slug = `${slugify(composed.title)}-${fingerprint.slice(0, 8)}`;
    const canonicalUrl = `${site.siteUrl}/news/${slug}`;
    const authorName = `${site.brandName} Editorial Team`;
    const inserted = await sql`
      INSERT INTO news_articles (id, site_id, title, slug, excerpt, content, status, indexable, language, category, tags, cover_image_url, cover_image_source_url, cover_image_page_url, cover_image_alt, author_name, published_at, updated_at, seo_title, seo_description, canonical_url, source_title, source_author, source_publisher, source_url, canonical_source_url, source_published_at, source_fetched_at, source_fingerprint, event_fingerprint, content_hash, relevance_score, credibility_score, editorial_note)
      VALUES (${articleId}, ${siteId}, ${composed.title}, ${slug}, ${composed.excerpt}, ${composed.content}, 'published', TRUE, ${site.publicationLanguage}, ${composed.category}, ${JSON.stringify(composed.tags)}::jsonb, ${site.ownedNeutralImage.url}, ${site.ownedNeutralImage.url}, '', ${site.ownedNeutralImage.alt}, ${authorName}, NOW(), NOW(), ${composed.seoTitle || composed.title}, ${composed.seoDescription || composed.excerpt}, ${canonicalUrl}, ${candidate.title}, ${candidate.sourceAuthor}, ${candidate.sourceDomain}, ${candidate.sourceUrl}, ${candidate.normalizedUrl}, ${candidate.sourcePublishedAt}, NOW(), ${hash(candidate.normalizedUrl)}, ${fingerprint}, ${hash(composed.content)}, ${candidate.score}, 0, ${composed.editorialNote || 'Independent editorial summary and analysis based on the linked original source.'})
      RETURNING id, slug, title, source_url
    ` as Array<{ id: string; slug: string; title: string; source_url: string }>;
    await markSitemapDirty("automated News article published after source and frontend verification");
    await sql`UPDATE news_publication_runs SET status = 'frontend_verifying', article_id = ${articleId} WHERE id = ${runId}`;
    const verification = await verifyFrontend(site, { ...inserted[0], sourceUrl: inserted[0].source_url }, runId);
    if (!verification.passed) throw new Error(`Frontend verification failed: ${JSON.stringify(verification.statuses)}`);
    await sql`UPDATE news_candidates SET status = 'used', used_article_id = ${articleId}, updated_at = NOW() WHERE id = ${candidate.id}`;
    await sql`UPDATE news_publication_runs SET status = 'published_success', completed_at = NOW() WHERE id = ${runId}`;
    await audit(siteId, "news_publish_verified", "info", "News article passed frontend list, detail, sitemap and RSS checks.", { articleId, slug, verification }, runId);
    return { ok: true, runId, articleId, slug, verification };
  } catch (error) {
    const message = error instanceof Error ? error.message : "News publishing failed.";
    await sql`UPDATE news_publication_runs SET status = 'retry_pending', completed_at = NOW(), error_message = ${message.slice(0, 1_000)} WHERE id = ${runId}`.catch(() => undefined);
    await audit(siteId, "news_publish_failed", "critical", message, { cycle }, runId).catch(() => undefined);
    throw error;
  } finally {
    await releaseLock(siteId, "publish", cycle, owner);
  }
}

export async function getNewsAutomationStatus(siteId = "cowinmotors") {
  const site = getNewsSite(siteId);
  const sql = getSql();
  if (!sql) return { site, configured: false, latestIngest: null, latestPublication: null, candidates: [] };
  await ensureNewsAutomationSchema();
  const [ingest, publication, candidates] = await Promise.all([
    sql`SELECT * FROM news_ingest_runs WHERE site_id = ${siteId} ORDER BY started_at DESC LIMIT 1`,
    sql`SELECT * FROM news_publication_runs WHERE site_id = ${siteId} ORDER BY started_at DESC LIMIT 1`,
    sql`SELECT id, title, score, status, source_domain, source_published_at FROM news_candidates WHERE site_id = ${siteId} ORDER BY score DESC, source_published_at DESC LIMIT 20`,
  ]);
  const ingestRows = ingest as unknown as Array<Record<string, unknown>>;
  const publicationRows = publication as unknown as Array<Record<string, unknown>>;
  const candidateRows = candidates as unknown as Array<Record<string, unknown>>;
  return { site, configured: validateNewsSiteConfig(site), latestIngest: ingestRows[0] || null, latestPublication: publicationRows[0] || null, candidates: candidateRows };
}
