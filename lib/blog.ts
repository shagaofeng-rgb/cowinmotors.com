import crypto from "node:crypto";
import { ensureCoreSchema, getSql } from "@/lib/database";

const SITE_URL = "https://www.cowinmotors.com";
const DEFAULT_COVER_IMAGE = `${SITE_URL}/assets/ui/photography/news/article-fitment-compliance.png`;
const DEFAULT_AUTHOR = "Cowinmotors Editorial Team";
const BLOG_CLASS_IDS = new Set(["blog", "31"]);
const MIN_TITLE_LENGTH = 3;
const MIN_CONTENT_LENGTH = 12;

type BlogRow = {
  id: string;
  external_fingerprint: string;
  class_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  author_id: string | null;
  author_name: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  status: string;
  source: string | null;
  published_at: Date | string | null;
  updated_at: Date | string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  created_at: Date | string | null;
};

export type BlogArticle = {
  id: string;
  classId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  authorId: string;
  authorName: string;
  coverImageUrl: string;
  coverImageAlt: string;
  status: "published";
  source: string;
  publishedAt: string;
  updatedAt: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  createdAt: string;
};

export type BlogWebhookInput = {
  classId: string;
  title: string;
  content: string;
  authorId: string;
  imageUrl: string;
};

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  enabled: boolean;
};

let schemaReady: Promise<boolean> | null = null;

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function asIso(value: Date | string | null) {
  return value ? new Date(value).toISOString() : "";
}

function normaliseWhitespace(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/[\t ]+/g, " ").trim();
}

function decodeCommonEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

// The publishing partner may send HTML. Store readable plain text so external input never reaches the page as executable markup.
function plainTextContent(value: string) {
  return normaliseWhitespace(
    decodeCommonEntities(value)
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|h[1-6]|li|blockquote|section|article)>/gi, "\n\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/\n{3,}/g, "\n\n"),
  );
}

function makeExcerpt(content: string) {
  const singleLine = content.replace(/\s+/g, " ").trim();
  return singleLine.length <= 230 ? singleLine : `${singleLine.slice(0, 227).trimEnd()}...`;
}

function slugify(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 92);
  return normalized || "cowinmotors-blog";
}

function normaliseImageUrl(value: string) {
  const candidate = value.trim();
  if (!candidate) return DEFAULT_COVER_IMAGE;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : DEFAULT_COVER_IMAGE;
  } catch {
    return DEFAULT_COVER_IMAGE;
  }
}

function cleanInput(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function normaliseClassId(value: unknown) {
  return cleanInput(value, 60).toLowerCase() || "blog";
}

function rowToBlogArticle(row: BlogRow): BlogArticle {
  return {
    id: row.id,
    classId: row.class_id || "blog",
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || "",
    content: row.content || "",
    authorId: row.author_id || "",
    authorName: row.author_name || DEFAULT_AUTHOR,
    coverImageUrl: row.cover_image_url || DEFAULT_COVER_IMAGE,
    coverImageAlt: row.cover_image_alt || row.title,
    status: "published",
    source: row.source || "plugin-webhook",
    publishedAt: asIso(row.published_at),
    updatedAt: asIso(row.updated_at),
    seoTitle: row.seo_title || row.title,
    seoDescription: row.seo_description || row.excerpt || "",
    canonicalUrl: row.canonical_url || `${SITE_URL}/blog/${row.slug}`,
    createdAt: asIso(row.created_at),
  };
}

export function validateBlogWebhookInput(input: Record<string, unknown>): { input?: BlogWebhookInput; error?: string } {
  const classId = normaliseClassId(input.class_id);
  const title = normaliseWhitespace(cleanInput(input.title, 180));
  const content = plainTextContent(cleanInput(input.content, 100_000));
  const authorId = normaliseWhitespace(cleanInput(input.author_id, 120));
  const imageUrl = normaliseImageUrl(cleanInput(input.image_url, 2_000));

  if (!BLOG_CLASS_IDS.has(classId)) return { error: "Unsupported class_id. Use blog." };
  if (title.length < MIN_TITLE_LENGTH) return { error: "title must contain at least 3 characters." };
  if (content.length < MIN_CONTENT_LENGTH) return { error: "content must contain at least 12 characters." };

  return { input: { classId: "blog", title, content, authorId, imageUrl } };
}

export function isSupportedBlogClassId(value: unknown) {
  return BLOG_CLASS_IDS.has(normaliseClassId(value));
}

export function hasCompleteBlogWebhookArticle(input: Record<string, unknown>) {
  const title = normaliseWhitespace(cleanInput(input.title, 180));
  const content = plainTextContent(cleanInput(input.content, 100_000));
  return title.length >= MIN_TITLE_LENGTH && content.length >= MIN_CONTENT_LENGTH;
}

export async function ensureBlogSchema() {
  const sql = getSql();
  if (!sql) return false;
  if (!schemaReady) {
    schemaReady = (async () => {
      await ensureCoreSchema();
      await sql`SELECT pg_advisory_lock(34882941)`;
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS blog_articles (
            id TEXT PRIMARY KEY,
            external_fingerprint TEXT NOT NULL UNIQUE,
            class_id TEXT NOT NULL DEFAULT 'blog',
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            excerpt TEXT NOT NULL DEFAULT '',
            content TEXT NOT NULL DEFAULT '',
            author_id TEXT NOT NULL DEFAULT '',
            author_name TEXT NOT NULL DEFAULT 'Cowinmotors Editorial Team',
            cover_image_url TEXT NOT NULL DEFAULT '',
            cover_image_alt TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'published',
            source TEXT NOT NULL DEFAULT 'plugin-webhook',
            published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            seo_title TEXT NOT NULL DEFAULT '',
            seo_description TEXT NOT NULL DEFAULT '',
            canonical_url TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS blog_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            description TEXT NOT NULL DEFAULT '',
            enabled BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `;
        await sql`
          INSERT INTO blog_categories (id, name, slug, description, enabled)
          VALUES ('blog', 'Blog', 'blog', 'Cowinmotors buyer guides and sourcing articles.', TRUE)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            description = EXCLUDED.description,
            enabled = EXCLUDED.enabled,
            updated_at = NOW()
        `;
        await sql`CREATE INDEX IF NOT EXISTS blog_articles_status_published_at_idx ON blog_articles (status, published_at DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS blog_articles_class_id_idx ON blog_articles (class_id)`;
      } finally {
        await sql`SELECT pg_advisory_unlock(34882941)`;
      }
      return true;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

export async function getPublishedBlogPosts({ limit = 12, page = 1 } = {}) {
  const sql = getSql();
  if (!sql) return [] as BlogArticle[];
  await ensureBlogSchema();
  const offset = Math.max(0, page - 1) * limit;
  const rows = await sql`
    SELECT * FROM blog_articles
    WHERE status = 'published'
    ORDER BY published_at DESC
    LIMIT ${Math.min(100, Math.max(1, limit))}
    OFFSET ${offset}
  ` as BlogRow[];
  return rows.map(rowToBlogArticle);
}

export async function getBlogCategories() {
  const sql = getSql();
  if (!sql) return [] as BlogCategory[];
  await ensureBlogSchema();
  const rows = await sql`
    SELECT id, name, slug, description, enabled
    FROM blog_categories
    WHERE enabled = TRUE
    ORDER BY name ASC
  ` as BlogCategory[];
  return rows;
}

export async function getBlogAdminSnapshot() {
  const sql = getSql();
  if (!sql) return { articles: [] as BlogArticle[], categories: [] as BlogCategory[] };
  await ensureBlogSchema();
  const articleRows = await sql`SELECT * FROM blog_articles ORDER BY published_at DESC LIMIT 250` as BlogRow[];
  const categoryRows = await sql`SELECT id, name, slug, description, enabled FROM blog_categories ORDER BY name ASC` as BlogCategory[];
  return { articles: articleRows.map(rowToBlogArticle), categories: categoryRows };
}

export async function getPublishedBlogArticle(slug: string) {
  const sql = getSql();
  if (!sql) return null;
  await ensureBlogSchema();
  const rows = await sql`
    SELECT * FROM blog_articles
    WHERE slug = ${slug} AND status = 'published'
    LIMIT 1
  ` as BlogRow[];
  return rows[0] ? rowToBlogArticle(rows[0]) : null;
}

export async function publishBlogWebhookArticle(input: BlogWebhookInput) {
  const sql = getSql();
  if (!sql) throw new Error("Blog publishing is unavailable because the database is not configured.");
  await ensureBlogSchema();

  const fingerprint = hash(`${input.classId}\n${input.title.toLowerCase()}\n${input.authorId.toLowerCase()}`);
  const existingRows = await sql`SELECT slug FROM blog_articles WHERE external_fingerprint = ${fingerprint} LIMIT 1` as Array<{ slug: string }>;
  const slug = existingRows[0]?.slug || `${slugify(input.title)}-${fingerprint.slice(0, 10)}`;
  const id = crypto.randomUUID();
  const excerpt = makeExcerpt(input.content);
  const authorName = input.authorId || DEFAULT_AUTHOR;
  const canonicalUrl = `${SITE_URL}/blog/${slug}`;
  const rows = await sql`
    INSERT INTO blog_articles (
      id, external_fingerprint, class_id, title, slug, excerpt, content, author_id, author_name,
      cover_image_url, cover_image_alt, status, source, published_at, updated_at,
      seo_title, seo_description, canonical_url
    ) VALUES (
      ${id}, ${fingerprint}, ${input.classId}, ${input.title}, ${slug}, ${excerpt}, ${input.content}, ${input.authorId}, ${authorName},
      ${input.imageUrl}, ${input.title}, 'published', 'plugin-webhook', NOW(), NOW(),
      ${input.title}, ${excerpt}, ${canonicalUrl}
    )
    ON CONFLICT (external_fingerprint) DO UPDATE SET
      class_id = EXCLUDED.class_id,
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      content = EXCLUDED.content,
      author_id = EXCLUDED.author_id,
      author_name = EXCLUDED.author_name,
      cover_image_url = EXCLUDED.cover_image_url,
      cover_image_alt = EXCLUDED.cover_image_alt,
      status = 'published',
      source = 'plugin-webhook',
      updated_at = NOW(),
      seo_title = EXCLUDED.seo_title,
      seo_description = EXCLUDED.seo_description,
      canonical_url = EXCLUDED.canonical_url
    RETURNING *
  ` as BlogRow[];
  return rowToBlogArticle(rows[0]);
}

export function blogArticleJsonLd(article: BlogArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.seoDescription,
    image: [article.coverImageUrl],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: article.authorName },
    publisher: {
      "@type": "Organization",
      name: "Cowinmotors",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/brand/cowinmotors-mark.png` },
    },
    mainEntityOfPage: article.canonicalUrl,
    articleSection: "Blog",
  };
}
