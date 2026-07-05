import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ensureCoreSchema, getSql } from "@/lib/database";
import { categorySlug, productPath, products, type Product } from "@/lib/products";

const SITE_URL = "https://www.cowinmotors.com";
const NEWS_FILE = path.join(os.tmpdir(), "cowinmotors-news.json");
const DEFAULT_TIMEZONE = "Asia/Shanghai";
const PROMPT_VERSION = "cowin-news-v1";
const DEFAULT_DAILY_TARGET = 4;
const DEFAULT_LOOKBACK_HOURS = 72;
const DEFAULT_DEDUP_DAYS = 7;
const DEFAULT_RELEVANCE_THRESHOLD = 3;

type NewsStatus =
  | "discovered"
  | "fetched"
  | "rejected"
  | "duplicate"
  | "analyzing"
  | "draft"
  | "review_required"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "archived";

export type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: NewsStatus;
  language: string;
  category: string;
  tags: string[];
  coverImageUrl: string;
  coverImageSourceUrl: string;
  coverImagePageUrl: string;
  coverImageAlt: string;
  coverImageWidth: number;
  coverImageHeight: number;
  coverImageStatus: string;
  authorName: string;
  publishedAt: string;
  updatedAt: string;
  scheduledAt: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  geoSummary: string;
  keyTakeaways: string[];
  sourceTitle: string;
  sourceAuthor: string;
  sourcePublisher: string;
  sourceUrl: string;
  canonicalSourceUrl: string;
  sourceLanguage: string;
  sourcePublishedAt: string;
  sourceFetchedAt: string;
  sourceTimezone: string;
  sourceFingerprint: string;
  eventFingerprint: string;
  contentHash: string;
  relevanceScore: number;
  credibilityScore: number;
  generationModel: string;
  generationPromptVersion: string;
  createdAt: string;
  products: NewsProductRelation[];
};

export type NewsProductRelation = {
  productId: string;
  title: string;
  url: string;
  image: string;
  category: string;
  relevanceScore: number;
  relationshipReason: string;
  displayOrder: number;
};

type NewsSource = {
  id: string;
  domain: string;
  publisherName: string;
  sourceType: string;
  rssUrl: string;
  language: string;
  country: string;
  credibilityScore: number;
  enabled: boolean;
  allowedForAutoPublish: boolean;
};

type Candidate = {
  source: NewsSource;
  title: string;
  description: string;
  sourceUrl: string;
  canonicalSourceUrl: string;
  author: string;
  publishedAt: string;
  fetchedAt: string;
  imageUrl: string;
  imageSourceUrl: string;
  normalizedTitle: string;
};

type NewsJobRecord = {
  id: string;
  jobType: string;
  status: string;
  scheduledAt: string;
  startedAt: string;
  completedAt: string;
  retryCount: number;
  errorMessage: string;
  metadata: Record<string, unknown>;
};

type NewsAuditRecord = {
  id: string;
  date: string;
  timezone: string;
  targetCount: number;
  publishedCount: number;
  missingCount: number;
  status: string;
  checkedAt: string;
};

type NewsRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  status: NewsStatus;
  language: string | null;
  category: string | null;
  tags: string[] | string | null;
  cover_image_url: string | null;
  cover_image_source_url: string | null;
  cover_image_page_url: string | null;
  cover_image_alt: string | null;
  cover_image_width: number | null;
  cover_image_height: number | null;
  cover_image_status: string | null;
  author_name: string | null;
  published_at: string | Date | null;
  updated_at: string | Date | null;
  scheduled_at: string | Date | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[] | string | null;
  geo_summary: string | null;
  key_takeaways: string[] | string | null;
  source_title: string | null;
  source_author: string | null;
  source_publisher: string | null;
  source_url: string | null;
  canonical_source_url: string | null;
  source_language: string | null;
  source_published_at: string | Date | null;
  source_fetched_at: string | Date | null;
  source_timezone: string | null;
  source_fingerprint: string | null;
  event_fingerprint: string | null;
  content_hash: string | null;
  relevance_score: number | null;
  credibility_score: number | null;
  generation_model: string | null;
  generation_prompt_version: string | null;
  created_at: string | Date | null;
};

type RelationRow = {
  news_id: string;
  product_id: string;
  relevance_score: number | null;
  relationship_reason: string | null;
  display_order: number | null;
};

const defaultSources: NewsSource[] = [
  {
    id: "motor1-news",
    domain: "motor1.com",
    publisherName: "Motor1",
    sourceType: "rss",
    rssUrl: "https://www.motor1.com/rss/news/all/",
    language: "en",
    country: "Global",
    credibilityScore: 82,
    enabled: true,
    allowedForAutoPublish: true,
  },
  {
    id: "autocar-news",
    domain: "autocar.co.uk",
    publisherName: "Autocar",
    sourceType: "rss",
    rssUrl: "https://www.autocar.co.uk/rss",
    language: "en",
    country: "United Kingdom",
    credibilityScore: 80,
    enabled: true,
    allowedForAutoPublish: true,
  },
];

const fallbackImages = [
  {
    url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
    page: "https://unsplash.com/photos/1503376780353-7e6692767b70",
    alt: "Automotive lighting and performance parts industry update",
  },
  {
    url: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80",
    page: "https://unsplash.com/photos/1492144534655-ae79c964c9d7",
    alt: "Global automotive supply and vehicle fitment news",
  },
  {
    url: "https://images.unsplash.com/photo-1532974297617-c0f05fe48bff?auto=format&fit=crop&w=1400&q=80",
    page: "https://unsplash.com/photos/1532974297617-c0f05fe48bff",
    alt: "Automotive performance parts and aftermarket trend",
  },
  {
    url: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=80",
    page: "https://unsplash.com/photos/1511919884226-fd3cad34687c",
    alt: "Vehicle exterior parts and global automotive market news",
  },
];

function envNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function safeJson<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (Array.isArray(value)) return value as T;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function stripHtml(value = "") {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function htmlEscape(value = "") {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char] || char);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 74);
}

function normalizeTitle(value: string) {
  return stripHtml(decodeEntities(value)).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function canonicalizeUrl(raw: string, base?: string) {
  const parsed = new URL(raw, base);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported URL protocol.");
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "gbraid", "wbraid"].forEach((key) =>
    parsed.searchParams.delete(key),
  );
  parsed.hash = "";
  return parsed.toString();
}

function isAllowedExternalUrl(raw: string, allowedDomains?: string[]) {
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (hostname === "localhost" || hostname.endsWith(".local")) return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname)) return false;
    if (allowedDomains?.length) {
      return allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchText(url: string, allowedDomains?: string[], maxBytes = 1_000_000) {
  if (!isAllowedExternalUrl(url, allowedDomains)) throw new Error(`External URL is not allowed: ${url}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "CowinmotorsNewsBot/1.0 (+https://www.cowinmotors.com/news)",
        accept: "application/rss+xml, application/xml, text/xml, text/html;q=0.8",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Fetch failed ${response.status}`);
    const reader = response.body?.getReader();
    if (!reader) return await response.text();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.length;
        if (total > maxBytes) throw new Error("Response too large.");
        chunks.push(value);
      }
    }
    return Buffer.concat(chunks).toString("utf8");
  } finally {
    clearTimeout(timer);
  }
}

function tagValue(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return stripHtml(decodeEntities(match?.[1] || ""));
}

function attrValue(fragment: string, tag: string, attr: string) {
  const match = fragment.match(new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, "i"));
  return decodeEntities(match?.[1] || "");
}

function extractRssItems(xml: string, source: NewsSource): Candidate[] {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  const entries = items.length ? items : [...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)].map((match) => match[0]);
  const fetchedAt = new Date().toISOString();

  return entries.flatMap((item) => {
    try {
      const title = tagValue(item, "title");
      const link = tagValue(item, "link") || attrValue(item, "link", "href");
      const description = tagValue(item, "description") || tagValue(item, "summary") || tagValue(item, "content:encoded");
      const author = tagValue(item, "author") || tagValue(item, "dc:creator");
      const pubDate = tagValue(item, "pubDate") || tagValue(item, "published") || tagValue(item, "updated");
      const publishedAt = new Date(pubDate).toISOString();
      if (!title || !link || Number.isNaN(new Date(publishedAt).getTime())) return [];
      const canonicalSourceUrl = canonicalizeUrl(link, source.rssUrl);
      const enclosure = attrValue(item, "enclosure", "url") || attrValue(item, "media:content", "url") || attrValue(item, "media:thumbnail", "url");
      return [{
        source,
        title,
        description,
        sourceUrl: canonicalSourceUrl,
        canonicalSourceUrl,
        author,
        publishedAt,
        fetchedAt,
        imageUrl: enclosure,
        imageSourceUrl: enclosure ? source.rssUrl : "",
        normalizedTitle: normalizeTitle(title),
      }];
    } catch {
      return [];
    }
  });
}

async function extractPageImage(candidate: Candidate) {
  if (candidate.imageUrl && isAllowedExternalUrl(candidate.imageUrl)) return candidate;
  try {
    const html = await fetchText(candidate.canonicalSourceUrl, [candidate.source.domain], 750_000);
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
      || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
    if (ogImage) {
      const imageUrl = canonicalizeUrl(decodeEntities(ogImage), candidate.canonicalSourceUrl);
      if (isAllowedExternalUrl(imageUrl)) {
        return { ...candidate, imageUrl, imageSourceUrl: candidate.canonicalSourceUrl };
      }
    }
  } catch {
    return candidate;
  }
  return candidate;
}

function fallbackImageFor(candidate: Candidate, relations: NewsProductRelation[]) {
  const seed = Math.abs(hash(`${candidate.normalizedTitle}:${relations[0]?.category || ""}`).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0));
  return fallbackImages[seed % fallbackImages.length];
}

function productKeywords(product: Product) {
  return [
    product.title,
    product.category,
    product.brand,
    product.model,
    product.yearRange,
    product.productType,
    product.description,
    ...(product.features || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 3);
}

function scoreCandidate(candidate: Candidate) {
  const text = `${candidate.title} ${candidate.description}`.toLowerCase();
  const categoryBoosts = [
    ["headlight", "lighting", "led", "lamp", "driving light", "tail light"],
    ["exhaust", "downpipe", "catback", "muffler", "emissions"],
    ["body kit", "bumper", "spoiler", "aero", "exterior"],
    ["bmw", "mercedes", "audi", "porsche", "volkswagen", "tesla"],
    ["aftermarket", "parts", "repair", "supplier", "supply chain", "custom"],
  ];
  const broadScore = categoryBoosts.flat().reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
  const scored = products.map((product) => {
    const terms = [...new Set(productKeywords(product))].slice(0, 45);
    const score = terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), broadScore);
    return { product, score };
  }).sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(({ product, score }, index) => ({
    productId: String(product.slug || product.__id),
    title: product.title,
    url: productPath(product),
    image: product.localImage,
    category: product.category,
    relevanceScore: score,
    relationshipReason: `${product.category} fitment and sourcing context is related to this automotive market update.`,
    displayOrder: index + 1,
  }));
}

function buildContent(candidate: Candidate, relations: NewsProductRelation[]) {
  const productLinks = relations
    .map((item) => `<a href="${htmlEscape(item.url)}">${htmlEscape(item.title)}</a>`)
    .join(", ");
  const sourceSummary = candidate.description || `${candidate.source.publisherName} reported this automotive update.`;
  const productsText = relations.map((item) => item.title).join(", ");
  const takeawayProducts = relations.length
    ? `Relevant Cowinmotors catalog areas include ${relations.map((item) => item.category).join(", ")}.`
    : "Relevant product fitment should be confirmed before sourcing.";

  const sections = [
    ["Core Conclusion", `${candidate.source.publisherName} published a recent automotive update: ${candidate.title}. For global buyers, the important question is how this affects fitment planning, parts availability, and sourcing decisions.`],
    ["Original News Facts", `The source report identifies the following core fact pattern: ${sourceSummary} This section is a concise summary of publicly available source information, not a republication of the original article.`],
    ["Why It Matters To Buyers", "Automotive model changes, supply-chain shifts, regulation, and vehicle technology updates can influence replacement parts demand, lighting compatibility, exhaust fitment, and exterior upgrade planning. Buyers should verify year, model, trim, region specification, and order quantity before confirming procurement."],
    ["Cowinmotors View", "Our view is that international buyers should treat industry news as an early signal for sourcing checks rather than a final purchasing specification. When a model, technology, or market requirement changes, the safer buying path is to confirm connector type, side, material, packaging method, MOQ, and lead time before payment."],
    ["How Cowinmotors Can Help", `Cowinmotors can help buyers compare available fitment options, confirm product photos, and request quotation support for related products such as ${productLinks || "automotive lighting, tail lights, exhaust systems, and exterior parts"}. ${takeawayProducts}`],
  ];

  return sections
    .map(([heading, body]) => `<h2>${htmlEscape(heading)}</h2><p>${body}</p>`)
    .join("\n");
}

function buildArticle(candidate: Candidate, relations: NewsProductRelation[]): NewsArticle {
  const now = new Date().toISOString();
  const content = buildContent(candidate, relations);
  const contentHash = hash(`${candidate.title}:${candidate.description}:${relations.map((item) => item.productId).join(",")}`);
  const shortHash = contentHash.slice(0, 8);
  const slug = `${slugify(candidate.title)}-${shortHash}`;
  const image = candidate.imageUrl ? { url: candidate.imageUrl, page: candidate.imageSourceUrl || candidate.canonicalSourceUrl, alt: `${candidate.title} - automotive news image` } : fallbackImageFor(candidate, relations);
  const categories = [...new Set(relations.map((item) => item.category))];
  const primaryKeyword = categories[0] || "automotive parts sourcing";
  const relatedProductNames = relations.map((item) => item.title).join(", ");

  return {
    id: crypto.randomUUID(),
    title: `${candidate.title} - sourcing impact for aftermarket parts buyers`.slice(0, 120),
    slug,
    excerpt: `${candidate.source.publisherName} reported a recent automotive update. Cowinmotors explains why it matters for fitment, sourcing, and quotation planning.`.slice(0, 260),
    content,
    status: "published",
    language: candidate.source.language,
    category: categories[0] || "Automotive Industry",
    tags: [...new Set([primaryKeyword, "automotive sourcing", "fitment check", ...categories])].slice(0, 8),
    coverImageUrl: image.url,
    coverImageSourceUrl: image.url,
    coverImagePageUrl: image.page,
    coverImageAlt: image.alt,
    coverImageWidth: 1400,
    coverImageHeight: 900,
    coverImageStatus: "verified",
    authorName: "Cowinmotors Editorial Team",
    publishedAt: now,
    updatedAt: now,
    scheduledAt: now,
    seoTitle: `${candidate.title} | Automotive Parts Sourcing News`.slice(0, 68),
    seoDescription: `Source-backed automotive news analysis from Cowinmotors with related product fitment and sourcing links for global buyers.`.slice(0, 155),
    canonicalUrl: `${SITE_URL}/news/${slug}`,
    primaryKeyword,
    secondaryKeywords: ["automotive parts", "headlights", "tail lights", "exhaust systems", "vehicle fitment"],
    geoSummary: `${candidate.source.publisherName} reported ${candidate.title}. Cowinmotors connects the update to ${relatedProductNames || "automotive parts"} sourcing, fitment confirmation, and buyer RFQ decisions.`,
    keyTakeaways: [
      `Source: ${candidate.source.publisherName}; original publication date: ${candidate.publishedAt.slice(0, 10)}.`,
      "The article summarizes public facts and separates Cowinmotors analysis from source reporting.",
      "Buyers should confirm fitment, MOQ, packaging, and shipping before ordering related parts.",
    ],
    sourceTitle: candidate.title,
    sourceAuthor: candidate.author,
    sourcePublisher: candidate.source.publisherName,
    sourceUrl: candidate.sourceUrl,
    canonicalSourceUrl: candidate.canonicalSourceUrl,
    sourceLanguage: candidate.source.language,
    sourcePublishedAt: candidate.publishedAt,
    sourceFetchedAt: candidate.fetchedAt,
    sourceTimezone: "UTC",
    sourceFingerprint: hash(candidate.canonicalSourceUrl),
    eventFingerprint: hash(`${candidate.source.publisherName}:${candidate.normalizedTitle}:${candidate.publishedAt.slice(0, 10)}`),
    contentHash,
    relevanceScore: Math.max(...relations.map((item) => item.relevanceScore), 0),
    credibilityScore: candidate.source.credibilityScore,
    generationModel: "deterministic-source-summary",
    generationPromptVersion: PROMPT_VERSION,
    createdAt: now,
    products: relations,
  };
}

export async function ensureNewsSchema() {
  const sql = getSql();
  if (!sql) return false;
  await ensureCoreSchema();
  await sql`
    CREATE TABLE IF NOT EXISTS news_articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      language TEXT NOT NULL DEFAULT 'en',
      category TEXT NOT NULL DEFAULT '',
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      cover_image_url TEXT NOT NULL DEFAULT '',
      cover_image_source_url TEXT NOT NULL DEFAULT '',
      cover_image_page_url TEXT NOT NULL DEFAULT '',
      cover_image_alt TEXT NOT NULL DEFAULT '',
      cover_image_width INTEGER NOT NULL DEFAULT 0,
      cover_image_height INTEGER NOT NULL DEFAULT 0,
      cover_image_status TEXT NOT NULL DEFAULT '',
      author_name TEXT NOT NULL DEFAULT 'Cowinmotors Editorial Team',
      published_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ,
      scheduled_at TIMESTAMPTZ,
      seo_title TEXT NOT NULL DEFAULT '',
      seo_description TEXT NOT NULL DEFAULT '',
      canonical_url TEXT NOT NULL DEFAULT '',
      primary_keyword TEXT NOT NULL DEFAULT '',
      secondary_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
      geo_summary TEXT NOT NULL DEFAULT '',
      key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
      source_title TEXT NOT NULL DEFAULT '',
      source_author TEXT NOT NULL DEFAULT '',
      source_publisher TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      canonical_source_url TEXT NOT NULL DEFAULT '',
      source_language TEXT NOT NULL DEFAULT '',
      source_published_at TIMESTAMPTZ,
      source_fetched_at TIMESTAMPTZ,
      source_timezone TEXT NOT NULL DEFAULT '',
      source_fingerprint TEXT NOT NULL DEFAULT '',
      event_fingerprint TEXT NOT NULL DEFAULT '',
      content_hash TEXT NOT NULL DEFAULT '',
      relevance_score INTEGER NOT NULL DEFAULT 0,
      credibility_score INTEGER NOT NULL DEFAULT 0,
      generation_model TEXT NOT NULL DEFAULT '',
      generation_prompt_version TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS news_products (
      news_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      relevance_score INTEGER NOT NULL DEFAULT 0,
      relationship_reason TEXT NOT NULL DEFAULT '',
      display_order INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (news_id, product_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS news_sources (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      publisher_name TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'rss',
      rss_url TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      country TEXT NOT NULL DEFAULT '',
      credibility_score INTEGER NOT NULL DEFAULT 60,
      enabled BOOLEAN NOT NULL DEFAULT true,
      allowed_for_auto_publish BOOLEAN NOT NULL DEFAULT true,
      last_fetched_at TIMESTAMPTZ,
      failure_count INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS news_jobs (
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
  await sql`
    CREATE TABLE IF NOT EXISTS news_publication_audits (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      timezone TEXT NOT NULL,
      target_count INTEGER NOT NULL,
      published_count INTEGER NOT NULL,
      missing_count INTEGER NOT NULL,
      status TEXT NOT NULL,
      checked_at TIMESTAMPTZ NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS news_articles_status_idx ON news_articles (status)`;
  await sql`CREATE INDEX IF NOT EXISTS news_articles_published_at_idx ON news_articles (published_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS news_articles_source_published_at_idx ON news_articles (source_published_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS news_articles_canonical_source_url_idx ON news_articles (canonical_source_url)`;
  await sql`CREATE INDEX IF NOT EXISTS news_articles_source_fingerprint_idx ON news_articles (source_fingerprint)`;
  await sql`CREATE INDEX IF NOT EXISTS news_articles_event_fingerprint_idx ON news_articles (event_fingerprint)`;
  await sql`CREATE INDEX IF NOT EXISTS news_articles_slug_idx ON news_articles (slug)`;

  for (const source of getConfiguredSources()) {
    await sql`
      INSERT INTO news_sources (
        id, domain, publisher_name, source_type, rss_url, language, country, credibility_score, enabled, allowed_for_auto_publish
      ) VALUES (
        ${source.id}, ${source.domain}, ${source.publisherName}, ${source.sourceType}, ${source.rssUrl}, ${source.language},
        ${source.country}, ${source.credibilityScore}, ${source.enabled}, ${source.allowedForAutoPublish}
      )
      ON CONFLICT (id) DO UPDATE SET
        domain = EXCLUDED.domain,
        publisher_name = EXCLUDED.publisher_name,
        rss_url = EXCLUDED.rss_url,
        credibility_score = EXCLUDED.credibility_score,
        enabled = EXCLUDED.enabled,
        allowed_for_auto_publish = EXCLUDED.allowed_for_auto_publish
    `;
  }
  return true;
}

function getConfiguredSources() {
  const whitelist = String(process.env.NEWS_SOURCE_WHITELIST || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (!whitelist.length) return defaultSources;
  return whitelist.flatMap((rssUrl, index) => {
    try {
      const url = new URL(rssUrl);
      return [{
        id: `custom-${index}-${url.hostname.replace(/[^a-z0-9]+/gi, "-")}`,
        domain: url.hostname.replace(/^www\./, ""),
        publisherName: url.hostname.replace(/^www\./, ""),
        sourceType: "rss",
        rssUrl,
        language: "en",
        country: "Global",
        credibilityScore: 65,
        enabled: true,
        allowedForAutoPublish: true,
      } satisfies NewsSource];
    } catch {
      return [];
    }
  });
}

function rowToArticle(row: NewsRow, relations: NewsProductRelation[] = []): NewsArticle {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || "",
    content: row.content || "",
    status: row.status,
    language: row.language || "en",
    category: row.category || "",
    tags: safeJson<string[]>(row.tags, []),
    coverImageUrl: row.cover_image_url || "",
    coverImageSourceUrl: row.cover_image_source_url || "",
    coverImagePageUrl: row.cover_image_page_url || "",
    coverImageAlt: row.cover_image_alt || "",
    coverImageWidth: Number(row.cover_image_width || 0),
    coverImageHeight: Number(row.cover_image_height || 0),
    coverImageStatus: row.cover_image_status || "",
    authorName: row.author_name || "Cowinmotors Editorial Team",
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "",
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).toISOString() : "",
    seoTitle: row.seo_title || row.title,
    seoDescription: row.seo_description || row.excerpt || "",
    canonicalUrl: row.canonical_url || `${SITE_URL}/news/${row.slug}`,
    primaryKeyword: row.primary_keyword || "",
    secondaryKeywords: safeJson<string[]>(row.secondary_keywords, []),
    geoSummary: row.geo_summary || "",
    keyTakeaways: safeJson<string[]>(row.key_takeaways, []),
    sourceTitle: row.source_title || "",
    sourceAuthor: row.source_author || "",
    sourcePublisher: row.source_publisher || "",
    sourceUrl: row.source_url || "",
    canonicalSourceUrl: row.canonical_source_url || "",
    sourceLanguage: row.source_language || "",
    sourcePublishedAt: row.source_published_at ? new Date(row.source_published_at).toISOString() : "",
    sourceFetchedAt: row.source_fetched_at ? new Date(row.source_fetched_at).toISOString() : "",
    sourceTimezone: row.source_timezone || "",
    sourceFingerprint: row.source_fingerprint || "",
    eventFingerprint: row.event_fingerprint || "",
    contentHash: row.content_hash || "",
    relevanceScore: Number(row.relevance_score || 0),
    credibilityScore: Number(row.credibility_score || 0),
    generationModel: row.generation_model || "",
    generationPromptVersion: row.generation_prompt_version || "",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    products: relations,
  };
}

function relationFromProductId(row: RelationRow): NewsProductRelation | null {
  const product = products.find((item) => String(item.slug || item.__id) === row.product_id);
  if (!product) return null;
  return {
    productId: row.product_id,
    title: product.title,
    url: productPath(product),
    image: product.localImage,
    category: product.category,
    relevanceScore: Number(row.relevance_score || 0),
    relationshipReason: row.relationship_reason || "",
    displayOrder: Number(row.display_order || 1),
  };
}

export async function getPublishedNews({ limit = 12, page = 1, category = "", tag = "" } = {}) {
  const sql = getSql();
  const offset = Math.max(0, page - 1) * limit;
  if (sql) {
    await ensureNewsSchema();
    const rows = await sql`
      SELECT *
      FROM news_articles
      WHERE status = 'published'
        AND (${category || ""} = '' OR category = ${category || ""})
      ORDER BY published_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    ` as NewsRow[];
    const ids = rows.map((row) => row.id);
    const relationRows = ids.length
      ? await sql`
          SELECT * FROM news_products
          WHERE news_id = ANY(${ids}::text[])
          ORDER BY display_order ASC
        ` as RelationRow[]
      : [];
    const relationMap = new Map<string, NewsProductRelation[]>();
    for (const row of relationRows) {
      const relation = relationFromProductId(row);
      if (!relation) continue;
      relationMap.set(row.news_id, [...(relationMap.get(row.news_id) || []), relation]);
    }
    return rows.map((row) => rowToArticle(row, relationMap.get(row.id) || [])).filter((article) => !tag || article.tags.includes(tag));
  }
  return readFileNews().filter((article) => article.status === "published").slice(offset, offset + limit);
}

export async function getNewsArticle(slug: string) {
  const sql = getSql();
  if (sql) {
    await ensureNewsSchema();
    const rows = await sql`SELECT * FROM news_articles WHERE slug = ${slug} AND status = 'published' LIMIT 1` as NewsRow[];
    if (!rows[0]) return null;
    const relationRows = await sql`SELECT * FROM news_products WHERE news_id = ${rows[0].id} ORDER BY display_order ASC` as RelationRow[];
    return rowToArticle(rows[0], relationRows.map(relationFromProductId).filter(Boolean) as NewsProductRelation[]);
  }
  return readFileNews().find((article) => article.slug === slug && article.status === "published") || null;
}

export async function getRelatedNewsForProduct(product: Product, limit = 3) {
  const productId = String(product.slug || product.__id);
  const sql = getSql();
  if (sql) {
    await ensureNewsSchema();
    const rows = await sql`
      SELECT a.*
      FROM news_articles a
      INNER JOIN news_products p ON p.news_id = a.id
      WHERE a.status = 'published' AND p.product_id = ${productId}
      ORDER BY a.published_at DESC
      LIMIT ${limit}
    ` as NewsRow[];
    return rows.map((row) => rowToArticle(row));
  }
  return readFileNews().filter((article) => article.products.some((item) => item.productId === productId)).slice(0, limit);
}

export async function getNewsAdminSnapshot() {
  const sql = getSql();
  if (!sql) {
    const articles = readFileNews();
    return { articles, sources: getConfiguredSources(), jobs: [] as NewsJobRecord[], audits: [] as NewsAuditRecord[] };
  }
  await ensureNewsSchema();
  const articles = await sql`SELECT * FROM news_articles ORDER BY created_at DESC LIMIT 120` as NewsRow[];
  const sources = await sql`
    SELECT id, domain, publisher_name, source_type, rss_url, language, country, credibility_score, enabled, allowed_for_auto_publish
    FROM news_sources
    ORDER BY enabled DESC, credibility_score DESC
  ` as {
    id: string; domain: string; publisher_name: string; source_type: string; rss_url: string; language: string; country: string;
    credibility_score: number; enabled: boolean; allowed_for_auto_publish: boolean;
  }[];
  const jobs = await sql`SELECT * FROM news_jobs ORDER BY started_at DESC NULLS LAST LIMIT 50` as {
    id: string; job_type: string; status: string; scheduled_at: Date | null; started_at: Date | null; completed_at: Date | null;
    retry_count: number; error_message: string | null; metadata: Record<string, unknown> | string | null;
  }[];
  const audits = await sql`SELECT * FROM news_publication_audits ORDER BY checked_at DESC LIMIT 30` as {
    id: string; date: string; timezone: string; target_count: number; published_count: number; missing_count: number; status: string; checked_at: Date;
  }[];
  return {
    articles: articles.map((row) => rowToArticle(row)),
    sources: sources.map((row) => ({
      id: row.id,
      domain: row.domain,
      publisherName: row.publisher_name,
      sourceType: row.source_type,
      rssUrl: row.rss_url,
      language: row.language,
      country: row.country,
      credibilityScore: row.credibility_score,
      enabled: row.enabled,
      allowedForAutoPublish: row.allowed_for_auto_publish,
    })),
    jobs: jobs.map((row) => ({
      id: row.id,
      jobType: row.job_type,
      status: row.status,
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).toISOString() : "",
      startedAt: row.started_at ? new Date(row.started_at).toISOString() : "",
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : "",
      retryCount: row.retry_count,
      errorMessage: row.error_message || "",
      metadata: safeJson<Record<string, unknown>>(row.metadata, {}),
    })),
    audits: audits.map((row) => ({
      id: row.id,
      date: row.date,
      timezone: row.timezone,
      targetCount: row.target_count,
      publishedCount: row.published_count,
      missingCount: row.missing_count,
      status: row.status,
      checkedAt: new Date(row.checked_at).toISOString(),
    })),
  };
}

async function persistArticle(article: NewsArticle) {
  const sql = getSql();
  if (!sql) {
    const current = readFileNews();
    writeFileNews([article, ...current.filter((item) => item.id !== article.id)].slice(0, 200));
    return;
  }
  await ensureNewsSchema();
  await sql`
    INSERT INTO news_articles (
      id, title, slug, excerpt, content, status, language, category, tags, cover_image_url, cover_image_source_url,
      cover_image_page_url, cover_image_alt, cover_image_width, cover_image_height, cover_image_status, author_name,
      published_at, updated_at, scheduled_at, seo_title, seo_description, canonical_url, primary_keyword, secondary_keywords,
      geo_summary, key_takeaways, source_title, source_author, source_publisher, source_url, canonical_source_url,
      source_language, source_published_at, source_fetched_at, source_timezone, source_fingerprint, event_fingerprint,
      content_hash, relevance_score, credibility_score, generation_model, generation_prompt_version, created_at
    ) VALUES (
      ${article.id}, ${article.title}, ${article.slug}, ${article.excerpt}, ${article.content}, ${article.status},
      ${article.language}, ${article.category}, ${JSON.stringify(article.tags)}::jsonb, ${article.coverImageUrl},
      ${article.coverImageSourceUrl}, ${article.coverImagePageUrl}, ${article.coverImageAlt}, ${article.coverImageWidth},
      ${article.coverImageHeight}, ${article.coverImageStatus}, ${article.authorName}, ${article.publishedAt},
      ${article.updatedAt}, ${article.scheduledAt}, ${article.seoTitle}, ${article.seoDescription}, ${article.canonicalUrl},
      ${article.primaryKeyword}, ${JSON.stringify(article.secondaryKeywords)}::jsonb, ${article.geoSummary},
      ${JSON.stringify(article.keyTakeaways)}::jsonb, ${article.sourceTitle}, ${article.sourceAuthor}, ${article.sourcePublisher},
      ${article.sourceUrl}, ${article.canonicalSourceUrl}, ${article.sourceLanguage}, ${article.sourcePublishedAt},
      ${article.sourceFetchedAt}, ${article.sourceTimezone}, ${article.sourceFingerprint}, ${article.eventFingerprint},
      ${article.contentHash}, ${article.relevanceScore}, ${article.credibilityScore}, ${article.generationModel},
      ${article.generationPromptVersion}, ${article.createdAt}
    )
    ON CONFLICT (slug) DO NOTHING
  `;
  for (const relation of article.products) {
    await sql`
      INSERT INTO news_products (news_id, product_id, relevance_score, relationship_reason, display_order)
      VALUES (${article.id}, ${relation.productId}, ${relation.relevanceScore}, ${relation.relationshipReason}, ${relation.displayOrder})
      ON CONFLICT (news_id, product_id)
      DO UPDATE SET relevance_score = EXCLUDED.relevance_score, relationship_reason = EXCLUDED.relationship_reason, display_order = EXCLUDED.display_order
    `;
  }
}

function readFileNews() {
  try {
    return JSON.parse(fs.readFileSync(NEWS_FILE, "utf8")) as NewsArticle[];
  } catch {
    return [];
  }
}

function writeFileNews(articles: NewsArticle[]) {
  fs.mkdirSync(path.dirname(NEWS_FILE), { recursive: true });
  fs.writeFileSync(NEWS_FILE, JSON.stringify(articles, null, 2));
}

async function isDuplicate(candidate: Candidate, dedupDays: number) {
  const sql = getSql();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - dedupDays);
  const sourceFingerprint = hash(candidate.canonicalSourceUrl);
  const eventFingerprint = hash(`${candidate.source.publisherName}:${candidate.normalizedTitle}:${candidate.publishedAt.slice(0, 10)}`);
  if (!sql) {
    return readFileNews().some((article) =>
      article.publishedAt >= since.toISOString() &&
      (article.sourceFingerprint === sourceFingerprint || article.eventFingerprint === eventFingerprint || article.canonicalSourceUrl === candidate.canonicalSourceUrl)
    );
  }
  await ensureNewsSchema();
  const rows = await sql`
    SELECT id FROM news_articles
    WHERE published_at >= ${since.toISOString()}
      AND (
        source_fingerprint = ${sourceFingerprint}
        OR event_fingerprint = ${eventFingerprint}
        OR canonical_source_url = ${candidate.canonicalSourceUrl}
      )
    LIMIT 1
  ` as { id: string }[];
  return Boolean(rows[0]);
}

function localDate(date = new Date(), timezone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

async function countPublishedToday(timezone: string) {
  const sql = getSql();
  const today = localDate(new Date(), timezone);
  if (!sql) return readFileNews().filter((article) => article.status === "published" && localDate(new Date(article.publishedAt), timezone) === today).length;
  await ensureNewsSchema();
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM news_articles
    WHERE status = 'published'
      AND to_char(published_at AT TIME ZONE ${timezone}, 'YYYY-MM-DD') = ${today}
  ` as { count: number }[];
  return Number(rows[0]?.count || 0);
}

async function recordJob(job: NewsJobRecord) {
  const sql = getSql();
  if (!sql) return;
  await ensureNewsSchema();
  await sql`
    INSERT INTO news_jobs (id, job_type, status, scheduled_at, started_at, completed_at, retry_count, error_message, metadata)
    VALUES (${job.id}, ${job.jobType}, ${job.status}, ${job.scheduledAt || null}, ${job.startedAt || null}, ${job.completedAt || null},
      ${job.retryCount}, ${job.errorMessage}, ${JSON.stringify(job.metadata)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, completed_at = EXCLUDED.completed_at, error_message = EXCLUDED.error_message, metadata = EXCLUDED.metadata
  `;
}

async function recordAudit(audit: NewsAuditRecord) {
  const sql = getSql();
  if (!sql) return;
  await ensureNewsSchema();
  await sql`
    INSERT INTO news_publication_audits (id, date, timezone, target_count, published_count, missing_count, status, checked_at)
    VALUES (${audit.id}, ${audit.date}, ${audit.timezone}, ${audit.targetCount}, ${audit.publishedCount}, ${audit.missingCount}, ${audit.status}, ${audit.checkedAt})
  `;
}

export async function discoverNewsCandidates() {
  const sources = getConfiguredSources().filter((source) => source.enabled && source.allowedForAutoPublish);
  const all: Candidate[] = [];
  for (const source of sources) {
    try {
      const xml = await fetchText(source.rssUrl, [source.domain], 750_000);
      const candidates = extractRssItems(xml, source);
      all.push(...candidates);
    } catch (error) {
      console.error("News source fetch failed", source.domain, error);
    }
  }
  return all;
}

export async function runNewsAutomation({ dryRun = false } = {}) {
  const timezone = process.env.NEWS_TIMEZONE || DEFAULT_TIMEZONE;
  const target = envNumber("NEWS_DAILY_TARGET", DEFAULT_DAILY_TARGET);
  const lookbackHours = envNumber("NEWS_LOOKBACK_HOURS", DEFAULT_LOOKBACK_HOURS);
  const dedupDays = envNumber("NEWS_DEDUP_DAYS", DEFAULT_DEDUP_DAYS);
  const relevanceThreshold = envNumber("NEWS_RELEVANCE_THRESHOLD", DEFAULT_RELEVANCE_THRESHOLD);
  const job: NewsJobRecord = {
    id: crypto.randomUUID(),
    jobType: "news-automation",
    status: "running",
    scheduledAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    completedAt: "",
    retryCount: 0,
    errorMessage: "",
    metadata: {},
  };
  await recordJob(job);

  try {
    await ensureNewsSchema();
    const existingToday = await countPublishedToday(timezone);
    const missing = Math.max(0, target - existingToday);
    if (missing === 0) {
      job.status = "completed";
      job.completedAt = new Date().toISOString();
      job.metadata = { existingToday, published: 0, reason: "daily target already met" };
      await recordJob(job);
      return job.metadata;
    }

    const maxAgeMs = lookbackHours * 60 * 60 * 1000;
    const candidates = (await discoverNewsCandidates())
      .filter((candidate) => Date.now() - new Date(candidate.publishedAt).getTime() <= maxAgeMs)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const published: NewsArticle[] = [];
    const rejected: Array<{ title: string; reason: string }> = [];

    for (const rawCandidate of candidates) {
      if (published.length >= missing) break;
      if (await isDuplicate(rawCandidate, dedupDays)) {
        rejected.push({ title: rawCandidate.title, reason: "duplicate within dedup window" });
        continue;
      }
      const candidate = await extractPageImage(rawCandidate);
      const relations = scoreCandidate(candidate).filter((relation) => relation.relevanceScore >= relevanceThreshold).slice(0, 3);
      if (!relations.length) {
        rejected.push({ title: candidate.title, reason: "below relevance threshold" });
        continue;
      }
      const article = buildArticle(candidate, relations);
      if (!article.coverImageUrl || article.coverImageUrl.includes(SITE_URL)) {
        rejected.push({ title: candidate.title, reason: "no compliant external cover image" });
        continue;
      }
      if (!dryRun) await persistArticle(article);
      published.push(article);
    }

    const publishedCount = existingToday + published.length;
    const audit: NewsAuditRecord = {
      id: crypto.randomUUID(),
      date: localDate(new Date(), timezone),
      timezone,
      targetCount: target,
      publishedCount,
      missingCount: Math.max(0, target - publishedCount),
      status: publishedCount >= target ? "complete" : "incomplete",
      checkedAt: new Date().toISOString(),
    };
    await recordAudit(audit);

    job.status = "completed";
    job.completedAt = new Date().toISOString();
    job.metadata = {
      dryRun,
      existingToday,
      target,
      candidates: candidates.length,
      published: published.length,
      rejected: rejected.slice(0, 20),
      audit,
    };
    await recordJob(job);
    return job.metadata;
  } catch (error) {
    job.status = "failed";
    job.completedAt = new Date().toISOString();
    job.errorMessage = error instanceof Error ? error.message : "Unknown news automation error";
    await recordJob(job);
    throw error;
  }
}

export function newsJsonLd(article: NewsArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: [article.coverImageUrl],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: article.authorName },
    publisher: {
      "@type": "Organization",
      name: "Cowinmotors",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/live/logo.jpg` },
    },
    mainEntityOfPage: article.canonicalUrl,
    articleSection: article.category,
    keywords: [article.primaryKeyword, ...article.secondaryKeywords].filter(Boolean).join(", "),
    about: article.geoSummary,
    mentions: article.products.map((product) => ({ "@type": "Product", name: product.title, url: `${SITE_URL}${product.url}` })),
    isBasedOn: article.canonicalSourceUrl,
  };
}

export function breadcrumbJsonLd(article: NewsArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "News", item: `${SITE_URL}/news` },
      { "@type": "ListItem", position: 3, name: article.title, item: article.canonicalUrl },
    ],
  };
}
