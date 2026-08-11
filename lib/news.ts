import crypto from "node:crypto";
import { ensureCoreSchema, getSql } from "@/lib/database";
import { productPath, products, type Product } from "@/lib/products";
import { getNewsSite } from "@/lib/news-site-config";

const SITE_URL = "https://www.cowinmotors.com";
const DEFAULT_AUTHOR = "Cowinmotors Editorial Team";
const DEFAULT_COVER = `${SITE_URL}/assets/ui/photography/news/article-fitment-compliance.png`;

export type NewsStatus = "draft" | "review_required" | "published" | "archived";

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

export type NewsArticle = {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: NewsStatus;
  indexable: boolean;
  language: string;
  category: string;
  tags: string[];
  coverImageUrl: string;
  coverImageSourceUrl: string;
  coverImagePageUrl: string;
  coverImageAlt: string;
  coverImageWidth: number;
  coverImageHeight: number;
  authorName: string;
  publishedAt: string;
  updatedAt: string;
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
  sourcePublishedAt: string;
  sourceFetchedAt: string;
  editorialNote: string;
  products: NewsProductRelation[];
};

type NewsRow = Record<string, unknown>;
type ManualNewsInput = {
  title?: unknown;
  content?: unknown;
  excerpt?: unknown;
  category?: unknown;
  tags?: unknown;
  coverImageUrl?: unknown;
  coverImageAlt?: unknown;
  authorName?: unknown;
  status?: unknown;
  indexable?: unknown;
  publishedAt?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  sourceTitle?: unknown;
  sourcePublisher?: unknown;
  sourceAuthor?: unknown;
  sourceUrl?: unknown;
  editorialNote?: unknown;
  productIds?: unknown;
};

let schemaReady: Promise<boolean> | null = null;

function asText(value: unknown, maximum = 10_000) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function asIso(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function asList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => asText(item, 120)).filter(Boolean).slice(0, 12);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => asText(item, 120)).filter(Boolean).slice(0, 12);
    } catch {}
    return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12);
  }
  return [] as string[];
}

function plainText(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|section|article)>/gi, "\n\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function excerpt(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 240 ? `${compact.slice(0, 237).trimEnd()}...` : compact;
}

function safeHttpsUrl(value: unknown, fallback = "") {
  const candidate = asText(value, 2_000);
  if (!candidate) return fallback;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 88);
  return slug || "cowinmotors-news";
}

function normalizeStatus(value: unknown): NewsStatus {
  return ["draft", "review_required", "published", "archived"].includes(String(value))
    ? value as NewsStatus
    : "review_required";
}

function productRecord(productId: string, order: number): NewsProductRelation | null {
  const product = products.find((item) => item.id === productId || item.slug === productId || String(item.__id) === productId);
  if (!product) return null;
  return {
    productId: product.id || product.slug || String(product.__id),
    title: product.title,
    url: productPath(product),
    image: product.localImage,
    category: product.category,
    relevanceScore: 0,
    relationshipReason: "Manually selected by Cowinmotors editorial review.",
    displayOrder: order,
  };
}

function toArticle(row: NewsRow, relations: NewsProductRelation[] = []): NewsArticle {
  const title = asText(row.title, 240);
  const slug = asText(row.slug, 160);
  const content = plainText(asText(row.content, 100_000));
  const publishedAt = asIso(row.published_at) || asIso(row.created_at) || new Date().toISOString();
  const updatedAt = asIso(row.updated_at) || publishedAt;
  const sourceUrl = safeHttpsUrl(row.canonical_source_url || row.source_url);
  return {
    id: asText(row.id, 100),
    siteId: asText(row.site_id, 80) || getNewsSite().siteId,
    title,
    slug,
    excerpt: asText(row.excerpt, 500) || excerpt(content),
    content,
    status: normalizeStatus(row.status),
    indexable: row.indexable !== false,
    language: asText(row.language, 20) || "en",
    category: asText(row.category, 120) || "Automotive Parts Insights",
    tags: asList(row.tags),
    coverImageUrl: safeHttpsUrl(row.cover_image_url, DEFAULT_COVER),
    coverImageSourceUrl: safeHttpsUrl(row.cover_image_source_url || row.cover_image_url, DEFAULT_COVER),
    coverImagePageUrl: safeHttpsUrl(row.cover_image_page_url || row.canonical_source_url || row.source_url),
    coverImageAlt: asText(row.cover_image_alt, 240) || title,
    coverImageWidth: Number(row.cover_image_width) || 0,
    coverImageHeight: Number(row.cover_image_height) || 0,
    authorName: asText(row.author_name, 160) || DEFAULT_AUTHOR,
    publishedAt,
    updatedAt,
    seoTitle: asText(row.seo_title, 240) || title,
    seoDescription: asText(row.seo_description, 360) || excerpt(content),
    canonicalUrl: `${SITE_URL}/news/${slug}`,
    primaryKeyword: asText(row.primary_keyword, 160),
    secondaryKeywords: asList(row.secondary_keywords),
    geoSummary: asText(row.geo_summary, 2_000),
    keyTakeaways: asList(row.key_takeaways),
    sourceTitle: asText(row.source_title, 300) || "Cowinmotors original editorial content",
    sourceAuthor: asText(row.source_author, 160),
    sourcePublisher: asText(row.source_publisher, 200) || "Cowinmotors Automotive Parts",
    sourceUrl,
    canonicalSourceUrl: sourceUrl,
    sourcePublishedAt: asIso(row.source_published_at),
    sourceFetchedAt: asIso(row.source_fetched_at),
    editorialNote: asText(row.editorial_note, 2_000),
    products: relations,
  };
}

async function relationMap(ids: string[]) {
  const map = new Map<string, NewsProductRelation[]>();
  if (!ids.length) return map;
  const sql = getSql();
  if (!sql) return map;
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(", ");
  const rows = await sql.query(`SELECT news_id, product_id, relevance_score, relationship_reason, display_order FROM news_products WHERE news_id IN (${placeholders}) ORDER BY display_order ASC`, ids) as NewsRow[];
  for (const row of rows) {
    const relation = productRecord(asText(row.product_id, 160), Number(row.display_order) || 0);
    if (!relation) continue;
    relation.relevanceScore = Number(row.relevance_score) || 0;
    relation.relationshipReason = asText(row.relationship_reason, 360) || relation.relationshipReason;
    const articleRelations = map.get(asText(row.news_id, 100)) || [];
    articleRelations.push(relation);
    map.set(asText(row.news_id, 100), articleRelations);
  }
  return map;
}

export async function ensureNewsSchema() {
  const sql = getSql();
  if (!sql) return false;
  if (!schemaReady) {
    schemaReady = (async () => {
      await ensureCoreSchema();
      await sql`SELECT pg_advisory_lock(65120419)`;
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS news_articles (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            excerpt TEXT NOT NULL DEFAULT '',
            content TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'draft',
            indexable BOOLEAN NOT NULL DEFAULT TRUE,
            language TEXT NOT NULL DEFAULT 'en',
            category TEXT NOT NULL DEFAULT 'Automotive Parts Insights',
            tags JSONB NOT NULL DEFAULT '[]'::jsonb,
            cover_image_url TEXT NOT NULL DEFAULT '',
            cover_image_source_url TEXT NOT NULL DEFAULT '',
            cover_image_page_url TEXT NOT NULL DEFAULT '',
            cover_image_alt TEXT NOT NULL DEFAULT '',
            cover_image_width INTEGER NOT NULL DEFAULT 0,
            cover_image_height INTEGER NOT NULL DEFAULT 0,
            author_name TEXT NOT NULL DEFAULT 'Cowinmotors Editorial Team',
            published_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
            source_published_at TIMESTAMPTZ,
            source_fetched_at TIMESTAMPTZ,
            editorial_note TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `;
        await sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS indexable BOOLEAN NOT NULL DEFAULT TRUE`;
        await sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS editorial_note TEXT NOT NULL DEFAULT ''`;
        await sql`ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'cowinmotors'`;
        await sql`CREATE INDEX IF NOT EXISTS news_articles_public_idx ON news_articles (status, indexable, published_at DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS news_articles_site_public_idx ON news_articles (site_id, status, indexable, published_at DESC)`;
        await sql`CREATE TABLE IF NOT EXISTS news_products (news_id TEXT NOT NULL, product_id TEXT NOT NULL, relevance_score INTEGER NOT NULL DEFAULT 0, relationship_reason TEXT NOT NULL DEFAULT '', display_order INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (news_id, product_id))`;
      } finally {
        await sql`SELECT pg_advisory_unlock(65120419)`;
      }
      return true;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

async function selectArticles(where = "", params: unknown[] = [], suffix = "") {
  const sql = getSql();
  if (!sql) return [] as NewsArticle[];
  await ensureNewsSchema();
  const rows = await sql.query(`SELECT * FROM news_articles ${where} ORDER BY published_at DESC NULLS LAST, updated_at DESC ${suffix}`, params) as NewsRow[];
  const relations = await relationMap(rows.map((row) => asText(row.id, 100)));
  return rows.map((row) => toArticle(row, relations.get(asText(row.id, 100)) || []));
}

export async function getPublishedNews({ limit = 12, page = 1, category = "", tag = "", indexableOnly = false, siteId = getNewsSite().siteId } = {}) {
  const safeLimit = Math.min(50_000, Math.max(1, Number(limit) || 12));
  const safePage = Math.max(1, Number(page) || 1);
  const where: string[] = ["status = 'published'", "site_id = $1", "indexable = TRUE"];
  const params: unknown[] = [siteId];
  if (category) { params.push(category); where.push(`category = $${params.length}`); }
  if (tag) { params.push(tag); where.push(`tags ? $${params.length}`); }
  params.push(safeLimit, (safePage - 1) * safeLimit);
  const articles = await selectArticles(
    `WHERE ${where.join(" AND ")}`,
    params,
    `LIMIT $${params.length - 1} OFFSET $${params.length}`,
  );
  return articles;
}

export async function getNewsCategories() {
  const sql = getSql();
  if (!sql) return [] as Array<{ category: string; count: number }>;
  await ensureNewsSchema();
  const rows = await sql.query(
    "SELECT category, CAST(COUNT(*) AS INTEGER) AS article_count FROM news_articles WHERE status = 'published' AND indexable = TRUE AND site_id = $1 GROUP BY category ORDER BY COUNT(*) DESC, category ASC",
    [getNewsSite().siteId],
  ) as Array<{ category: string; article_count: number }>;
  return rows.map((row) => ({ category: row.category, count: Number(row.article_count) || 0 }));
}

export async function getNewsArticle(slug: string) {
  const articles = await selectArticles("WHERE slug = $1 AND status = 'published' AND site_id = $2", [slug, getNewsSite().siteId], "LIMIT 1");
  return articles[0] || null;
}

export async function getRelatedNewsForProduct(product: Product, limit = 3) {
  const productId = product.id || product.slug || String(product.__id);
  const sql = getSql();
  if (!sql) return [] as NewsArticle[];
  await ensureNewsSchema();
  const rows = await sql`
    SELECT a.* FROM news_articles a
    INNER JOIN news_products p ON p.news_id = a.id
    WHERE p.product_id = ${productId} AND a.status = 'published' AND a.indexable = TRUE AND a.site_id = ${getNewsSite().siteId}
    ORDER BY a.published_at DESC NULLS LAST
    LIMIT ${Math.min(12, Math.max(1, limit))}
  ` as NewsRow[];
  const relations = await relationMap(rows.map((row) => asText(row.id, 100)));
  return rows.map((row) => toArticle(row, relations.get(asText(row.id, 100)) || []));
}

export async function getNewsAdminSnapshot() {
  const articles = (await selectArticles()).filter((article) => article.siteId === getNewsSite().siteId);
  return {
    articles,
    manualPublished: articles.filter((article) => article.status === "published" && article.indexable).length,
    reviewRequired: articles.filter((article) => article.status === "review_required" || !article.indexable).length,
  };
}

function validateManualInput(raw: ManualNewsInput) {
  const title = asText(raw.title, 180);
  const content = plainText(asText(raw.content, 60_000));
  if (title.length < 8) throw new Error("Title must contain at least 8 characters.");
  if (content.length < 80) throw new Error("Article content must contain at least 80 characters.");
  const status = normalizeStatus(raw.status);
  const requestedIndexable = raw.indexable === true || raw.indexable === "true";
  return {
    title,
    content,
    excerpt: asText(raw.excerpt, 360) || excerpt(content),
    category: asText(raw.category, 120) || "Automotive Parts Insights",
    tags: asList(raw.tags),
    coverImageUrl: safeHttpsUrl(raw.coverImageUrl, DEFAULT_COVER),
    coverImageAlt: asText(raw.coverImageAlt, 240) || title,
    authorName: asText(raw.authorName, 160) || DEFAULT_AUTHOR,
    status,
    indexable: status === "published" && requestedIndexable,
    publishedAt: asIso(raw.publishedAt) || new Date().toISOString(),
    seoTitle: asText(raw.seoTitle, 180) || title,
    seoDescription: asText(raw.seoDescription, 320) || excerpt(content),
    sourceTitle: asText(raw.sourceTitle, 240) || "Cowinmotors original editorial content",
    sourcePublisher: asText(raw.sourcePublisher, 160) || "Cowinmotors Automotive Parts",
    sourceAuthor: asText(raw.sourceAuthor, 160),
    sourceUrl: safeHttpsUrl(raw.sourceUrl),
    editorialNote: asText(raw.editorialNote, 1_200),
    productIds: asList(raw.productIds),
  };
}

async function replaceRelations(newsId: string, productIds: string[]) {
  const sql = getSql();
  if (!sql) return;
  await sql`DELETE FROM news_products WHERE news_id = ${newsId}`;
  const valid = productIds.slice(0, 1).map((id, index) => ({ id, index, product: productRecord(id, index) })).filter((item) => item.product);
  for (const item of valid) {
    await sql`
      INSERT INTO news_products (news_id, product_id, relevance_score, relationship_reason, display_order)
      VALUES (${newsId}, ${item.product!.productId}, 0, ${item.product!.relationshipReason}, ${item.index})
    `;
  }
}

export async function createManualNews(raw: ManualNewsInput) {
  const sql = getSql();
  if (!sql) throw new Error("News publishing requires a configured database.");
  await ensureNewsSchema();
  const input = validateManualInput(raw);
  const id = crypto.randomUUID();
  const salt = crypto.createHash("sha256").update(`${input.title}\n${Date.now()}`).digest("hex").slice(0, 8);
  const slug = `${slugify(input.title)}-${salt}`;
  const canonicalUrl = `${SITE_URL}/news/${slug}`;
  const rows = await sql`
    INSERT INTO news_articles (
      id, site_id, title, slug, excerpt, content, status, indexable, language, category, tags,
      cover_image_url, cover_image_source_url, cover_image_page_url, cover_image_alt,
      author_name, published_at, updated_at, seo_title, seo_description, canonical_url,
      source_title, source_author, source_publisher, source_url, canonical_source_url,
      source_published_at, source_fetched_at, editorial_note
    ) VALUES (
      ${id}, ${getNewsSite().siteId}, ${input.title}, ${slug}, ${input.excerpt}, ${input.content}, ${input.status}, ${input.indexable}, 'en', ${input.category}, ${JSON.stringify(input.tags)}::jsonb,
      ${input.coverImageUrl}, ${input.coverImageUrl}, ${input.sourceUrl}, ${input.coverImageAlt},
      ${input.authorName}, ${input.status === "published" ? input.publishedAt : null}, NOW(), ${input.seoTitle}, ${input.seoDescription}, ${canonicalUrl},
      ${input.sourceTitle}, ${input.sourceAuthor}, ${input.sourcePublisher}, ${input.sourceUrl}, ${input.sourceUrl},
      ${input.sourceUrl ? input.publishedAt : null}, ${input.sourceUrl ? new Date().toISOString() : null}, ${input.editorialNote}
    ) RETURNING *
  ` as NewsRow[];
  await replaceRelations(id, input.productIds);
  const relations = await relationMap([id]);
  return toArticle(rows[0], relations.get(id) || []);
}

export async function updateManualNews(id: string, raw: ManualNewsInput) {
  const sql = getSql();
  if (!sql) throw new Error("News publishing requires a configured database.");
  await ensureNewsSchema();
  const input = validateManualInput(raw);
  const existing = await sql`SELECT slug FROM news_articles WHERE id = ${id} AND site_id = ${getNewsSite().siteId} LIMIT 1` as Array<{ slug: string }>;
  if (!existing[0]) throw new Error("News article not found.");
  const canonicalUrl = `${SITE_URL}/news/${existing[0].slug}`;
  const rows = await sql`
    UPDATE news_articles SET
      title = ${input.title}, excerpt = ${input.excerpt}, content = ${input.content}, status = ${input.status}, indexable = ${input.indexable},
      category = ${input.category}, tags = ${JSON.stringify(input.tags)}::jsonb, cover_image_url = ${input.coverImageUrl},
      cover_image_source_url = ${input.coverImageUrl}, cover_image_page_url = ${input.sourceUrl}, cover_image_alt = ${input.coverImageAlt},
      author_name = ${input.authorName}, published_at = ${input.status === "published" ? input.publishedAt : null}, updated_at = NOW(),
      seo_title = ${input.seoTitle}, seo_description = ${input.seoDescription}, canonical_url = ${canonicalUrl},
      source_title = ${input.sourceTitle}, source_author = ${input.sourceAuthor}, source_publisher = ${input.sourcePublisher},
      source_url = ${input.sourceUrl}, canonical_source_url = ${input.sourceUrl}, editorial_note = ${input.editorialNote}
    WHERE id = ${id} AND site_id = ${getNewsSite().siteId} RETURNING *
  ` as NewsRow[];
  await replaceRelations(id, input.productIds);
  const relations = await relationMap([id]);
  return toArticle(rows[0], relations.get(id) || []);
}

export async function deleteManualNews(id: string) {
  const sql = getSql();
  if (!sql) throw new Error("News publishing requires a configured database.");
  await ensureNewsSchema();
  const rows = await sql`DELETE FROM news_articles WHERE id = ${id} AND site_id = ${getNewsSite().siteId} RETURNING slug` as Array<{ slug: string }>;
  if (!rows[0]) throw new Error("News article not found.");
  return rows[0];
}

export function publicNewsArticle(article: NewsArticle) {
  return article;
}

export function newsJsonLd(article: NewsArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.seoDescription,
    image: [article.coverImageUrl],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: article.authorName },
    publisher: { "@type": "Organization", name: "Cowinmotors Automotive Parts", url: SITE_URL },
    mainEntityOfPage: article.canonicalUrl,
  };
}

export function breadcrumbJsonLd(article: NewsArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "News & Insights", item: `${SITE_URL}/news` },
      { "@type": "ListItem", position: 3, name: article.title, item: article.canonicalUrl },
    ],
  };
}
