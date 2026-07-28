import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  InMemoryTaskLock,
  buildSitemapBundle,
  diffSitemapEntries,
  filterPublicIndexableRecords,
  normalizeLastmod,
  renderUrlset,
  submitSearchConsoleSitemap,
  validateSitemapXml,
  writeSitemapFileAtomic,
} from "../lib/sitemap-core.mjs";

const siteUrl = "https://www.cowinmotors.com";

test("generates a valid Sitemap and index", () => {
  const bundle = buildSitemapBundle([
    { loc: `${siteUrl}/`, lastmod: "2026-07-01", type: "pages" },
    { loc: `${siteUrl}/product/example`, lastmod: "2026-07-02", type: "products" },
  ], siteUrl);
  assert.equal(bundle.entries.length, 2);
  assert.ok(validateSitemapXml(bundle.indexXml, "sitemapindex"));
  assert.ok([...bundle.documents.values()].every((xml) => validateSitemapXml(xml, "urlset")));
});

test("escapes XML special characters", () => {
  const xml = renderUrlset([{ loc: `${siteUrl}/a&b`, lastmod: "2026-07-01", type: "pages" }]);
  assert.match(xml, /a&amp;b/);
  assert.ok(validateSitemapXml(xml, "urlset"));
});

test("excludes draft, noindex, non-200, non-canonical and private records", () => {
  const records = [
    { loc: `${siteUrl}/ok`, status: "published" },
    { loc: `${siteUrl}/draft`, status: "draft" },
    { loc: `${siteUrl}/noindex`, noindex: true },
    { loc: `${siteUrl}/gone`, httpStatus: 404 },
    { loc: `${siteUrl}/duplicate`, canonical: `${siteUrl}/ok` },
    { loc: `${siteUrl}/private`, published: false },
  ];
  assert.deepEqual(filterPublicIndexableRecords(records, siteUrl).map((item) => item.loc), [`${siteUrl}/ok`]);
});

test("reports removed content and changed lastmod", () => {
  const previous = [
    { loc: `${siteUrl}/old`, lastmod: "2026-07-01", type: "pages" },
    { loc: `${siteUrl}/kept`, lastmod: "2026-07-01", type: "pages" },
  ];
  const current = [
    { loc: `${siteUrl}/kept`, lastmod: "2026-07-02", type: "pages" },
    { loc: `${siteUrl}/new`, lastmod: "2026-07-02", type: "pages" },
  ];
  const diff = diffSitemapEntries(previous, current);
  assert.deepEqual(diff.removed, [`${siteUrl}/old`]);
  assert.deepEqual(diff.modified, [`${siteUrl}/kept`]);
  assert.deepEqual(diff.added, [`${siteUrl}/new`]);
});

test("uses the supplied real lastmod rather than the execution time", () => {
  assert.equal(normalizeLastmod("2024-02-03T12:30:00Z"), "2024-02-03");
});

test("splits before the configured URL limit", () => {
  const entries = Array.from({ length: 7 }, (_, index) => ({
    loc: `${siteUrl}/product/${index}`,
    lastmod: "2026-07-01",
    type: "products",
  }));
  const bundle = buildSitemapBundle(entries, siteUrl, { maxUrls: 3, maxBytes: 45_000_000 });
  assert.equal(bundle.indexItems.length, 3);
  assert.deepEqual(bundle.indexItems.map((item) => item.urlCount), [3, 3, 1]);
});

test("creates a Sitemap Index pointing to every generated chunk", () => {
  const bundle = buildSitemapBundle([
    { loc: `${siteUrl}/`, lastmod: "2026-07-01", type: "pages" },
    { loc: `${siteUrl}/news/test`, lastmod: "2026-07-02", type: "posts" },
  ], siteUrl);
  assert.match(bundle.indexXml, /\/sitemaps\/pages-1\.xml/);
  assert.match(bundle.indexXml, /\/sitemaps\/posts-1\.xml/);
});

test("prevents concurrent task execution and recovers after lock expiry", () => {
  const lock = new InMemoryTaskLock();
  assert.equal(lock.acquire("one", 1000, 100), true);
  assert.equal(lock.acquire("two", 1000, 200), false);
  assert.equal(lock.acquire("two", 1000, 1200), true);
  assert.equal(lock.release("one"), false);
  assert.equal(lock.release("two"), true);
});

test("keeps the previous Sitemap when atomic replacement fails", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "cowin-sitemap-test-"));
  const file = path.join(directory, "sitemap.xml");
  const previous = renderUrlset([{ loc: `${siteUrl}/old`, lastmod: "2026-07-01", type: "pages" }]);
  const next = renderUrlset([{ loc: `${siteUrl}/new`, lastmod: "2026-07-02", type: "pages" }]);
  await fs.writeFile(file, previous, "utf8");
  await assert.rejects(writeSitemapFileAtomic(file, next, async () => { throw new Error("simulated disk failure"); }));
  assert.equal(await fs.readFile(file, "utf8"), previous);
  await fs.rm(directory, { recursive: true, force: true });
});

test("submits a Sitemap with the Search Console Sitemaps API", async () => {
  const calls = [];
  const result = await submitSearchConsoleSitemap({
    enabled: true,
    siteUrl: `${siteUrl}/`,
    sitemapUrl: `${siteUrl}/sitemap.xml`,
    getAccessToken: async () => "test-token",
    retryDelayMs: 0,
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), method: options?.method });
      if (String(url).endsWith("/sitemap.xml")) return new Response("<xml />", { status: 200 });
      return new Response(null, { status: 204 });
    },
  });
  assert.equal(result.status, "success");
  assert.equal(calls[1].method, "PUT");
  assert.match(calls[1].url, /webmasters\/v3\/sites/);
});

test("records authentication failure without breaking Sitemap generation", async () => {
  const result = await submitSearchConsoleSitemap({
    enabled: true,
    siteUrl: `${siteUrl}/`,
    sitemapUrl: `${siteUrl}/sitemap.xml`,
    getAccessToken: async () => "bad-token",
    retries: 1,
    retryDelayMs: 0,
    fetchImpl: async (url) => String(url).endsWith("/sitemap.xml")
      ? new Response("<xml />", { status: 200 })
      : Response.json({ error: { message: "Invalid Credentials" } }, { status: 401 }),
  });
  assert.equal(result.status, "failed");
  assert.match(result.message, /Invalid Credentials/);
});

test("does not call Google when submission is disabled", async () => {
  let calls = 0;
  const result = await submitSearchConsoleSitemap({
    enabled: false,
    siteUrl: `${siteUrl}/`,
    sitemapUrl: `${siteUrl}/sitemap.xml`,
    getAccessToken: async () => "unused",
    fetchImpl: async () => { calls += 1; return new Response(null, { status: 204 }); },
  });
  assert.equal(result.status, "disabled");
  assert.equal(calls, 0);
});
