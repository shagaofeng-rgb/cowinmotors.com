export type SitemapType = "pages" | "categories" | "products" | "posts";
export type SitemapEntry = { loc: string; lastmod: string | Date; type: SitemapType };
export type NormalizedSitemapEntry = { loc: string; lastmod: string; type: SitemapType };
export type SitemapIndexItem = { file: string; loc: string; lastmod: string; type: SitemapType; urlCount: number; bytes: number };

export const SITEMAP_TYPES: SitemapType[];
export const DEFAULT_MAX_URLS: number;
export const DEFAULT_MAX_BYTES: number;
export function xmlEscape(value?: string): string;
export function normalizeLastmod(value: string | Date): string;
export function normalizeSitemapEntry(entry: SitemapEntry, siteUrl: string): NormalizedSitemapEntry;
export function dedupeSitemapEntries(entries: SitemapEntry[], siteUrl: string): { entries: NormalizedSitemapEntry[]; errors: Array<{ entry: SitemapEntry; reason: string }> };
export function filterPublicIndexableRecords<T extends { loc: string; canonical?: string; published?: boolean; noindex?: boolean; httpStatus?: number; status?: string }>(records: T[], siteUrl: string): T[];
export function renderUrlset(entries: NormalizedSitemapEntry[]): string;
export function renderSitemapIndex(items: Array<{ loc: string; lastmod: string | Date }>): string;
export function splitSitemapEntries(entries: NormalizedSitemapEntry[], maxUrls?: number, maxBytes?: number): NormalizedSitemapEntry[][];
export function buildSitemapBundle(entries: SitemapEntry[], siteUrl: string, options?: { maxUrls?: number; maxBytes?: number }): {
  entries: NormalizedSitemapEntry[];
  errors: Array<{ entry: SitemapEntry; reason: string }>;
  documents: Map<string, string>;
  indexItems: SitemapIndexItem[];
  indexXml: string;
  fingerprint: string;
};
export function validateSitemapXml(xml: string, expectedRoot?: "urlset" | "sitemapindex"): boolean;
export function diffSitemapEntries(previousEntries?: NormalizedSitemapEntry[], currentEntries?: NormalizedSitemapEntry[]): { added: string[]; modified: string[]; removed: string[] };
export function submitSearchConsoleSitemap(options: {
  enabled: boolean;
  siteUrl: string;
  sitemapUrl: string;
  fetchImpl?: typeof fetch;
  getAccessToken: () => Promise<string>;
  retries?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
}): Promise<{ attempted: boolean; status: "disabled" | "skipped" | "success" | "failed"; message: string; httpStatus?: number }>;
export function writeSitemapFileAtomic(filePath: string, xml: string, beforeRename?: (temporaryPath: string) => Promise<void>): Promise<void>;
export class InMemoryTaskLock {
  acquire(owner: string, ttlMs: number, now?: number): boolean;
  release(owner: string): boolean;
}
