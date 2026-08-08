import crypto from "node:crypto";
import { ensureCoreSchema, getSql } from "@/lib/database";

const SITE_URL = "https://www.cowinmotors.com";
const DEFAULT_COVER_IMAGE = `${SITE_URL}/assets/ui/photography/news/article-fitment-compliance.png`;
const DEFAULT_AUTHOR = "Cowinmotors Editorial Team";

type ScheduledBuyerGuide = {
  id: string;
  title: string;
  description: string;
  content: string;
};

const scheduledBuyerGuides: ScheduledBuyerGuide[] = [
  {
    id: "confirm-headlight-fitment-before-importing",
    title: "How to Confirm Headlight Fitment Before Importing",
    description: "A practical buyer guide to confirming vehicle configuration, side, market version, connectors, and product references before ordering headlights.",
    content: `Headlight fitment should be confirmed from the vehicle configuration, not from a model name alone. The same vehicle platform can use different lamps by model year, market, body style, trim, left-hand-drive or right-hand-drive layout, and optional lighting equipment.

Start with the vehicle year, make, model, trim, engine, and market version. For lighting parts, state whether the vehicle is LHD or RHD and whether you need the left lamp, right lamp, or a pair. An OE number, label photo, rear-connector photo, or clear image of the original lamp helps avoid assumptions.

Check the product reference against the specific vehicle information before asking for a quotation. Details such as DRL style, turn-signal function, lens layout, connector type, ballast or module requirement, and coding need can differ by configuration. If any detail is unconfirmed, keep it as a confirmation point rather than treating it as a fixed specification.

Before payment, review the product photo, requested side or set, packaging requirement, quantity, and destination country. This gives the buyer, sourcing partner, and supplier a shared reference for the order.

Cowinmotors Automotive Parts is an independent China-based automotive parts sourcing and export partner. Vehicle brand names are used only to indicate compatibility. Send your vehicle details, OE number, or product photo through the fitment check form before ordering.`,
  },
  {
    id: "wheel-pcd-offset-center-bore-before-ordering",
    title: "How to Check Wheel PCD, Offset and Center Bore Before Ordering",
    description: "A buyer checklist for confirming wheel diameter, width, PCD, offset, center bore, and vehicle clearance before requesting forged wheels.",
    content: `Wheel fitment is a combination of size, bolt pattern, offset, center bore, brake clearance, tire choice, and vehicle use. A wheel that looks suitable in a photograph may not fit a specific vehicle configuration.

Provide the vehicle year, make, model, trim, brake specification if known, and the wheel size you require. Confirm diameter, width, PCD or bolt pattern, offset, center bore, finish, and set quantity. If the vehicle has suspension, brake, or body modifications, include that information in the inquiry.

Do not assume that a wheel specification is interchangeable across every version of a vehicle platform. Regional versions and performance trims can use different fitment requirements. Ask for the exact values to be reviewed against the vehicle before ordering.

Packaging and destination should also be discussed early. Buyers can request product-photo confirmation and packaging review before shipment coordination.

Cowinmotors Automotive Parts can review forged wheel sourcing inquiries using the details supplied by the buyer. Final fitment and local compliance requirements should be confirmed before ordering.`,
  },
  {
    id: "valved-exhaust-buying-checklist",
    title: "What to Confirm Before Buying a Valved Exhaust System",
    description: "A fitment-led checklist for buyers sourcing valved exhaust systems, covering vehicle, engine, installation, materials, sound expectations, and road-use considerations.",
    content: `A valved exhaust request needs more than a vehicle model name. Engine version, model year, drivetrain, existing exhaust configuration, installation position, and the buyer's destination can affect the correct product selection.

Provide the vehicle year, make, model, trim, engine, and any known OEM exhaust reference. State whether the request is for a cat-back, axle-back, downpipe, tips, or another component. If valves, electronic controls, or coding are expected, ask for those details to be confirmed for the exact configuration.

Material, pipe diameter, tip finish, package contents, and installation hardware should not be assumed if they are not identified in the product record. Buyers should also review destination-country road-use, emissions, noise, and import requirements before ordering.

Use product photos, reference numbers, and vehicle photos to reduce ambiguity. Confirm the quantity, packaging requirement, and destination as part of the quotation review.

Cowinmotors Automotive Parts supports fitment-led sourcing and export coordination. It does not represent unverified road-use approvals, certifications, inventory, or delivery times.`,
  },
];

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

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  enabled: boolean;
};

let schemaReady: Promise<boolean> | null = null;

function asIso(value: Date | string | null) {
  return value ? new Date(value).toISOString() : "";
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
    source: row.source || "manual editorial",
    publishedAt: asIso(row.published_at),
    updatedAt: asIso(row.updated_at),
    seoTitle: row.seo_title || row.title,
    seoDescription: row.seo_description || row.excerpt || "",
    canonicalUrl: row.canonical_url || `${SITE_URL}/blog/${row.slug}`,
    createdAt: asIso(row.created_at),
  };
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
            source TEXT NOT NULL DEFAULT 'manual editorial',
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

export async function publishNextScheduledBuyerGuide() {
  const sql = getSql();
  if (!sql) throw new Error("Scheduled Buyer Guide publishing requires a configured database.");
  await ensureBlogSchema();
  const rows = await sql`SELECT external_fingerprint FROM blog_articles WHERE source = 'scheduled-buyer-guide'` as Array<{ external_fingerprint: string }>;
  const published = new Set(rows.map((row) => row.external_fingerprint));
  const guide = scheduledBuyerGuides.find((item) => !published.has(`buyer-guide:${item.id}`));
  if (!guide) return { created: false, reason: "All approved Buyer Guide topics are already published." };

  const fingerprint = `buyer-guide:${guide.id}`;
  const slug = `${guide.id}-${crypto.createHash("sha256").update(fingerprint).digest("hex").slice(0, 8)}`;
  const now = new Date().toISOString();
  const canonicalUrl = `${SITE_URL}/blog/${slug}`;
  const rowsCreated = await sql`
    INSERT INTO blog_articles (
      id, external_fingerprint, class_id, title, slug, excerpt, content, author_id, author_name,
      cover_image_url, cover_image_alt, status, source, published_at, updated_at, seo_title, seo_description, canonical_url
    ) VALUES (
      ${crypto.randomUUID()}, ${fingerprint}, 'blog', ${guide.title}, ${slug}, ${guide.description}, ${guide.content}, 'cowinmotors-editorial', ${DEFAULT_AUTHOR},
      ${DEFAULT_COVER_IMAGE}, ${guide.title}, 'published', 'scheduled-buyer-guide', ${now}, ${now}, ${guide.title}, ${guide.description}, ${canonicalUrl}
    ) RETURNING *
  ` as BlogRow[];
  return { created: true, article: rowToBlogArticle(rowsCreated[0]) };
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
