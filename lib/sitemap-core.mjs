import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const SITEMAP_TYPES = ["pages", "categories", "products", "posts"];
export const DEFAULT_MAX_URLS = 45_000;
export const DEFAULT_MAX_BYTES = 45_000_000;

export function xmlEscape(value = "") {
  return String(value).replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

export function normalizeLastmod(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid lastmod: ${value}`);
  return date.toISOString().slice(0, 10);
}

export function normalizeSitemapEntry(entry, siteUrl) {
  const origin = new URL(siteUrl).origin;
  const parsed = new URL(entry.loc, origin);
  if (parsed.origin !== origin) throw new Error(`External URL is not allowed in Sitemap: ${parsed.toString()}`);
  if (parsed.protocol !== "https:") throw new Error(`Sitemap URL must use HTTPS: ${parsed.toString()}`);
  parsed.hash = "";
  parsed.search = "";
  return {
    loc: parsed.toString().replace(/\/$/, parsed.pathname === "/" ? "/" : ""),
    lastmod: normalizeLastmod(entry.lastmod),
    type: SITEMAP_TYPES.includes(entry.type) ? entry.type : "pages",
  };
}

export function dedupeSitemapEntries(entries, siteUrl) {
  const byLocation = new Map();
  const errors = [];
  for (const entry of entries) {
    try {
      const normalized = normalizeSitemapEntry(entry, siteUrl);
      const previous = byLocation.get(normalized.loc);
      if (!previous || previous.lastmod < normalized.lastmod) byLocation.set(normalized.loc, normalized);
    } catch (error) {
      errors.push({ entry, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  return { entries: [...byLocation.values()].sort((a, b) => a.loc.localeCompare(b.loc)), errors };
}

export function filterPublicIndexableRecords(records, siteUrl) {
  const origin = new URL(siteUrl).origin;
  const excluded = new Set(["draft", "private", "deleted", "archived", "unpublished", "offline"]);
  return records.filter((record) => {
    if (record.published === false || record.noindex === true || record.httpStatus && record.httpStatus !== 200) return false;
    if (excluded.has(String(record.status || "").toLowerCase())) return false;
    try {
      const location = new URL(record.loc, origin);
      const canonical = new URL(record.canonical || record.loc, origin);
      return location.origin === origin && location.toString() === canonical.toString();
    } catch {
      return false;
    }
  });
}

export function renderUrlset(entries) {
  const rows = entries.map((entry) => [
    "  <url>",
    `    <loc>${xmlEscape(entry.loc)}</loc>`,
    `    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>`,
    "  </url>",
  ].join("\n")).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}${rows ? "\n" : ""}</urlset>`;
}

export function renderSitemapIndex(items) {
  const rows = items.map((item) => [
    "  <sitemap>",
    `    <loc>${xmlEscape(item.loc)}</loc>`,
    `    <lastmod>${xmlEscape(normalizeLastmod(item.lastmod))}</lastmod>`,
    "  </sitemap>",
  ].join("\n")).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}${rows ? "\n" : ""}</sitemapindex>`;
}

export function splitSitemapEntries(entries, maxUrls = DEFAULT_MAX_URLS, maxBytes = DEFAULT_MAX_BYTES) {
  const chunks = [];
  let current = [];
  let estimatedBytes = 120;
  for (const entry of entries) {
    const rowBytes = Buffer.byteLength(renderUrlset([entry]), "utf8") - 120;
    if (current.length && (current.length >= maxUrls || estimatedBytes + rowBytes >= maxBytes)) {
      chunks.push(current);
      current = [];
      estimatedBytes = 120;
    }
    current.push(entry);
    estimatedBytes += rowBytes;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

export function buildSitemapBundle(rawEntries, siteUrl, options = {}) {
  const { entries, errors } = dedupeSitemapEntries(rawEntries, siteUrl);
  const documents = new Map();
  const indexItems = [];
  for (const type of SITEMAP_TYPES) {
    const typeEntries = entries.filter((entry) => entry.type === type);
    const chunks = splitSitemapEntries(typeEntries, options.maxUrls, options.maxBytes);
    chunks.forEach((chunk, index) => {
      const file = `${type}-${index + 1}.xml`;
      const xml = renderUrlset(chunk);
      documents.set(file, xml);
      indexItems.push({
        file,
        loc: `${new URL(siteUrl).origin}/sitemaps/${file}`,
        lastmod: chunk.reduce((latest, entry) => entry.lastmod > latest ? entry.lastmod : latest, chunk[0].lastmod),
        type,
        urlCount: chunk.length,
        bytes: Buffer.byteLength(xml, "utf8"),
      });
    });
  }
  const indexXml = renderSitemapIndex(indexItems);
  return {
    entries,
    errors,
    documents,
    indexItems,
    indexXml,
    fingerprint: crypto.createHash("sha256").update(JSON.stringify(entries)).digest("hex"),
  };
}

export function validateSitemapXml(xml, expectedRoot) {
  if (!xml.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")) return false;
  const root = expectedRoot || (xml.includes("<sitemapindex ") ? "sitemapindex" : "urlset");
  if (!xml.includes(`<${root} `) || !xml.endsWith(`</${root}>`)) return false;
  if (/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml)) return false;
  if (root === "urlset" && (xml.match(/<url>/g) || []).length !== (xml.match(/<\/url>/g) || []).length) return false;
  if (root === "sitemapindex" && (xml.match(/<sitemap>/g) || []).length !== (xml.match(/<\/sitemap>/g) || []).length) return false;
  return true;
}

export function diffSitemapEntries(previousEntries = [], currentEntries = []) {
  const previous = new Map(previousEntries.map((entry) => [entry.loc, entry]));
  const current = new Map(currentEntries.map((entry) => [entry.loc, entry]));
  return {
    added: currentEntries.filter((entry) => !previous.has(entry.loc)).map((entry) => entry.loc),
    modified: currentEntries.filter((entry) => previous.has(entry.loc) && previous.get(entry.loc).lastmod !== entry.lastmod).map((entry) => entry.loc),
    removed: previousEntries.filter((entry) => !current.has(entry.loc)).map((entry) => entry.loc),
  };
}

export async function submitSearchConsoleSitemap({
  enabled,
  siteUrl,
  sitemapUrl,
  fetchImpl = fetch,
  getAccessToken,
  retries = 3,
  timeoutMs = 15_000,
  retryDelayMs = 500,
}) {
  if (!enabled) return { attempted: false, status: "disabled", message: "Search Console Sitemap submission is disabled." };
  if (!siteUrl || !sitemapUrl) return { attempted: false, status: "skipped", message: "Search Console site or Sitemap URL is missing." };
  try {
    const preflight = await fetchImpl(sitemapUrl, { method: "GET", signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
    if (!preflight.ok) throw new Error(`Sitemap preflight returned HTTP ${preflight.status}.`);
    const accessToken = await getAccessToken();
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
    let lastError = "";
    let lastStatus;
    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        const response = await fetchImpl(endpoint, {
          method: "PUT",
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(timeoutMs),
        });
        lastStatus = response.status;
        if (response.ok) return { attempted: true, status: "success", message: "Search Console accepted the Sitemap submission.", httpStatus: response.status };
        const payload = await response.json().catch(() => ({}));
        lastError = payload.error?.message || `Search Console API returned HTTP ${response.status}.`;
        if (![429, 500, 502, 503, 504].includes(response.status)) break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
      if (attempt < retries && retryDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
    }
    return { attempted: true, status: "failed", message: lastError || "Search Console submission failed after retries.", httpStatus: lastStatus };
  } catch (error) {
    return { attempted: true, status: "failed", message: error instanceof Error ? error.message : String(error) };
  }
}

export async function writeSitemapFileAtomic(filePath, xml, beforeRename) {
  if (!validateSitemapXml(xml)) throw new Error(`Refusing to write invalid Sitemap XML: ${filePath}`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, xml, { encoding: "utf8", flag: "wx" });
    const verification = await fs.readFile(temporaryPath, "utf8");
    if (!validateSitemapXml(verification)) throw new Error(`Temporary Sitemap validation failed: ${filePath}`);
    if (beforeRename) await beforeRename(temporaryPath);
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

export class InMemoryTaskLock {
  constructor() {
    this.owner = "";
    this.expiresAt = 0;
  }

  acquire(owner, ttlMs, now = Date.now()) {
    if (this.owner && this.expiresAt > now) return false;
    this.owner = owner;
    this.expiresAt = now + ttlMs;
    return true;
  }

  release(owner) {
    if (this.owner !== owner) return false;
    this.owner = "";
    this.expiresAt = 0;
    return true;
  }
}
