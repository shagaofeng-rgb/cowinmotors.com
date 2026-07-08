import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { ensureCoreSchema, getSql, isDatabaseConfigured } from "@/lib/database";
import { categorySlug, inferBuyingPath, productCategoryOptions, productPath, products } from "@/lib/products";

export type InquiryRecord = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  productType: string;
  product: string;
  vehicleInfo: string;
  quantity: string;
  requirement: string;
  source: string;
};

export type AdminListParams = {
  query: string;
  page: number;
  pageSize: number;
  sort: string;
};

export type AdminAuditLog = {
  id: string;
  createdAt: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ip: string;
  userAgent: string;
  metadata: Record<string, unknown>;
};

export type ProductCategoryRecord = {
  slug: string;
  nameEn: string;
  nameZh: string;
  parentSlug: string;
  enabled: boolean;
  showInNav: boolean;
  sortOrder: number;
  productCount: number;
  seoTitle: string;
  seoDescription: string;
  sampleImage: string;
};

export type MediaAssetRecord = {
  id: string;
  url: string;
  alt: string;
  assetType: string;
  source: string;
  category: string;
  usedBy: string;
  productCount: number;
  createdAt: string;
  exists: boolean;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  role: string;
  status: string;
  displayName: string;
  permissions: string[];
  lastLoginAt: string;
  createdAt: string;
};

export type SyncJobRecord = {
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

const inquiryFile = path.join(os.tmpdir(), "cowinmotors-inquiries.json");

export function getAdminListParams(searchParams?: Record<string, string | string[] | undefined>): AdminListParams {
  const read = (key: string) => {
    const value = searchParams?.[key];
    return Array.isArray(value) ? value[0] || "" : value || "";
  };
  const page = Math.max(1, Number.parseInt(read("page"), 10) || 1);
  const pageSizeInput = Number.parseInt(read("pageSize"), 10) || 25;
  const pageSize = [10, 25, 50, 100].includes(pageSizeInput) ? pageSizeInput : 25;

  return {
    query: read("q").trim(),
    page,
    pageSize,
    sort: read("sort") || "latest",
  };
}

export function paginate<T>(items: T[], page = 1, pageSize = 25) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    total: items.length,
    currentPage,
    totalPages,
    pageSize: safePageSize,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
}

export function filterByQuery<T>(items: T[], query: string, selector: (item: T) => unknown[]) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return items;

  return items.filter((item) => {
    const haystack = selector(item).filter(Boolean).join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export const adminPages = [
  { path: "/", label: "Home", priority: "High", intent: "brand, categories, featured products" },
  { path: "/products", label: "All Products", priority: "High", intent: "catalog discovery and fitment search" },
  { path: "/headlights", label: "Headlights", priority: "High", intent: "lighting category SEO and buyer entry" },
  { path: "/exhaust", label: "Exhaust Pipes", priority: "High", intent: "USD 1,999 exhaust offer and workshop proof" },
  { path: "/wheels", label: "Wheels", priority: "High", intent: "forged and performance wheel category SEO and RFQ entry" },
  { path: "/body-kits", label: "Body Kits", priority: "Medium", intent: "quote-only oversized parts" },
  { path: "/quote", label: "RFQ", priority: "High", intent: "lead capture" },
  { path: "/support", label: "Support", priority: "Medium", intent: "buyer trust and after-sales terms" },
];

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, value: T) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

type InquiryRow = {
  id: string;
  created_at: string | Date;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  product_type: string | null;
  product: string | null;
  vehicle_info: string | null;
  quantity: string | null;
  requirement: string | null;
  source: string | null;
};

function inquiryFromRow(row: InquiryRow): InquiryRecord {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    source: row.source || "website-rfq-form",
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    country: row.country || "",
    productType: row.product_type || "",
    product: row.product || "",
    vehicleInfo: row.vehicle_info || "",
    quantity: row.quantity || "",
    requirement: row.requirement || "",
  };
}

export async function getInquiries(): Promise<InquiryRecord[]> {
  const sql = getSql();

  if (sql) {
    try {
      await ensureCoreSchema();
      const rows = await sql`
        SELECT id, created_at, source, name, email, phone, country, product_type, product, vehicle_info, quantity, requirement
        FROM cowin_inquiries
        ORDER BY created_at DESC
        LIMIT 300
      ` as InquiryRow[];
      return rows.map(inquiryFromRow);
    } catch (error) {
      console.error("Inquiry database read failed; using file fallback.", error);
    }
  }

  return readJsonFile<InquiryRecord[]>(inquiryFile, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function persistInquiry(record: InquiryRecord) {
  const sql = getSql();

  if (sql) {
    try {
      await ensureCoreSchema();
      await sql`
        INSERT INTO cowin_inquiries (
          id, created_at, source, name, email, phone, country, product_type, product, vehicle_info, quantity, requirement
        ) VALUES (
          ${record.id},
          ${record.createdAt},
          ${record.source},
          ${record.name},
          ${record.email},
          ${record.phone},
          ${record.country},
          ${record.productType},
          ${record.product},
          ${record.vehicleInfo},
          ${record.quantity},
          ${record.requirement}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      return;
    } catch (error) {
      console.error("Inquiry database write failed; using file fallback.", error);
    }
  }

  const records = [record, ...readJsonFile<InquiryRecord[]>(inquiryFile, [])].slice(0, 300);
  writeJsonFile(inquiryFile, records);
}

export async function saveInquiry(input: Omit<InquiryRecord, "id" | "createdAt" | "source">): Promise<InquiryRecord> {
  const record: InquiryRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    source: "website-rfq-form",
    ...input,
  };
  await persistInquiry(record);
  return record;
}

export async function saveInquiryWithSource(input: Omit<InquiryRecord, "id" | "createdAt">): Promise<InquiryRecord> {
  const record: InquiryRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  await persistInquiry(record);
  return record;
}

export function getAdminProducts() {
  return products.map((product) => ({
    ...product,
    path: productPath(product),
    categorySlug: categorySlug(product),
    buyingPath: inferBuyingPath(product),
    imageExists: fs.existsSync(path.join(process.cwd(), "public", product.localImage.replace(/^\//, ""))),
  }));
}

function categoryNameZh(slug: string) {
  return {
    headlights: "前大灯",
    "tail-lights": "尾灯",
    exhaust: "排气系统",
    "body-kits": "包围件",
    wheels: "锻造轮毂",
  }[slug] || "产品分类";
}

export function getProductCategoryRecords(): ProductCategoryRecord[] {
  const stats = getCategoryStats();
  const statMap = new Map(stats.map((item) => [item.slug, item]));

  return productCategoryOptions.map((option, index) => {
    const sample = getAdminProducts().find((product) => product.categorySlug === option.slug);
    const stat = statMap.get(option.slug);
    return {
      slug: option.slug,
      nameEn: option.label,
      nameZh: categoryNameZh(option.slug),
      parentSlug: "",
      enabled: Boolean(stat?.count),
      showInNav: true,
      sortOrder: (index + 1) * 10,
      productCount: stat?.count || 0,
      seoTitle: `${option.label} for Global Automotive Parts Buyers | Cowinmotors`,
      seoDescription: `Browse ${option.label.toLowerCase()} with vehicle fitment, sourcing support, export packaging, and wholesale quotation support from Cowinmotors.`,
      sampleImage: sample?.localImage || "/icon.png",
    };
  });
}

export function getNewsCategoryRecords() {
  return [
    { slug: "automotive-lighting", nameEn: "Automotive Lighting", nameZh: "汽车照明", enabled: true, articleCount: 0 },
    { slug: "tail-lights", nameEn: "Tail Lights", nameZh: "尾灯资讯", enabled: true, articleCount: 0 },
    { slug: "exhaust-systems", nameEn: "Exhaust Systems", nameZh: "排气资讯", enabled: true, articleCount: 0 },
    { slug: "wheels", nameEn: "Wheels", nameZh: "轮毂资讯", enabled: true, articleCount: 0 },
    { slug: "body-kits", nameEn: "Body Kits", nameZh: "外观件资讯", enabled: true, articleCount: 0 },
    { slug: "shipping-sourcing", nameEn: "Shipping & Sourcing", nameZh: "运输与采购", enabled: true, articleCount: 0 },
  ];
}

export function getMediaAssets(): MediaAssetRecord[] {
  const productMap = new Map<string, { alt: string; category: string; count: number; source: string }>();
  for (const product of getAdminProducts()) {
    const current = productMap.get(product.localImage) || {
      alt: product.title,
      category: product.category,
      count: 0,
      source: product.source || product.rawSourceName || "product-catalog",
    };
    current.count += 1;
    productMap.set(product.localImage, current);
  }

  const uiAssetManifestPath = path.join(process.cwd(), "public/assets/ui/asset-manifest.json");
  const uiManifest = readJsonFile<{ file?: string; name?: string; page?: string; asset_type?: string; recommended_use?: string }[]>(uiAssetManifestPath, []);
  const productAssets = [...productMap.entries()].map(([url, item], index) => ({
    id: `product-${index + 1}`,
    url,
    alt: item.alt,
    assetType: "product-image",
    source: item.source,
    category: item.category,
    usedBy: `${item.count} product${item.count === 1 ? "" : "s"}`,
    productCount: item.count,
    createdAt: new Date(0).toISOString(),
    exists: fs.existsSync(path.join(process.cwd(), "public", url.replace(/^\//, ""))),
  }));

  const uiAssets = uiManifest.map((asset, index) => {
    const url = `/assets/ui/${asset.file || ""}`;
    return {
    id: `ui-${index + 1}`,
    url,
    alt: asset.name || asset.recommended_use || "ui asset",
    assetType: asset.asset_type || "ui-image",
    source: "ui-asset-pack",
    category: asset.page || "Website UI",
    usedBy: asset.recommended_use || "site design",
    productCount: 0,
    createdAt: new Date(0).toISOString(),
    exists: fs.existsSync(path.join(process.cwd(), "public", String(url).replace(/^\//, ""))),
    };
  });

  return [...productAssets, ...uiAssets].sort((a, b) => a.category.localeCompare(b.category));
}

export async function recordAuditLog(input: Omit<AdminAuditLog, "id" | "createdAt" | "metadata"> & { metadata?: Record<string, unknown> }) {
  const sql = getSql();
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    actorEmail: input.actorEmail,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: input.metadata || {},
  };

  if (!sql) return record;

  try {
    await ensureCoreSchema();
    await sql`
      INSERT INTO cowin_admin_audit_logs (
        id, created_at, actor_email, action, resource_type, resource_id, ip, user_agent, metadata
      ) VALUES (
        ${record.id},
        ${record.createdAt},
        ${record.actorEmail},
        ${record.action},
        ${record.resourceType},
        ${record.resourceId},
        ${record.ip},
        ${record.userAgent},
        ${JSON.stringify(record.metadata)}::jsonb
      )
    `;
  } catch (error) {
    console.error("Admin audit log write failed.", error);
  }

  return record;
}

export async function getAuditLogs(): Promise<AdminAuditLog[]> {
  const sql = getSql();
  if (sql) {
    try {
      await ensureCoreSchema();
      const rows = await sql`
        SELECT id, created_at, actor_email, action, resource_type, resource_id, ip, user_agent, metadata
        FROM cowin_admin_audit_logs
        ORDER BY created_at DESC
        LIMIT 300
      ` as {
        id: string;
        created_at: string | Date;
        actor_email: string;
        action: string;
        resource_type: string;
        resource_id: string;
        ip: string;
        user_agent: string;
        metadata: Record<string, unknown>;
      }[];
      return rows.map((row) => ({
        id: row.id,
        createdAt: new Date(row.created_at).toISOString(),
        actorEmail: row.actor_email,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        ip: row.ip,
        userAgent: row.user_agent,
        metadata: row.metadata || {},
      }));
    } catch (error) {
      console.error("Admin audit log read failed.", error);
    }
  }

  const inquiries = await getInquiries();
  return inquiries.slice(0, 30).map((inquiry) => ({
    id: `inquiry-${inquiry.id}`,
    createdAt: inquiry.createdAt,
    actorEmail: inquiry.email,
    action: "submit_inquiry",
    resourceType: "inquiry",
    resourceId: inquiry.id,
    ip: "",
    userAgent: "",
    metadata: { source: inquiry.source, productType: inquiry.productType },
  }));
}

export async function getAdminUsers(): Promise<AdminUserRecord[]> {
  const email = (process.env.ADMIN_EMAIL || "admin@cowinmotors.com").trim().toLowerCase();
  const now = new Date(0).toISOString();
  return [
    {
      id: "env-super-admin",
      email,
      role: "super_admin",
      status: "active",
      displayName: "环境变量管理员",
      permissions: ["dashboard:read", "products:read", "inquiries:read", "exports:create", "seo:read", "settings:read"],
      lastLoginAt: "",
      createdAt: now,
    },
  ];
}

export async function getSyncJobs(): Promise<SyncJobRecord[]> {
  const sql = getSql();
  if (sql) {
    try {
      await ensureCoreSchema();
      const rows = await sql`
        SELECT id, job_type, status, scheduled_at, started_at, completed_at, retry_count, error_message, metadata
        FROM cowin_sync_jobs
        ORDER BY started_at DESC NULLS LAST
        LIMIT 200
      ` as {
        id: string;
        job_type: string;
        status: string;
        scheduled_at: string | Date | null;
        started_at: string | Date | null;
        completed_at: string | Date | null;
        retry_count: number;
        error_message: string;
        metadata: Record<string, unknown>;
      }[];
      if (rows.length) {
        return rows.map((row) => ({
          id: row.id,
          jobType: row.job_type,
          status: row.status,
          scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).toISOString() : "",
          startedAt: row.started_at ? new Date(row.started_at).toISOString() : "",
          completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : "",
          retryCount: row.retry_count,
          errorMessage: row.error_message,
          metadata: row.metadata || {},
        }));
      }
    } catch (error) {
      console.error("Sync job read failed.", error);
    }
  }

  return [
    {
      id: "cron-news-automation",
      jobType: "news-automation",
      status: process.env.CRON_SECRET ? "configured" : "needs_secret",
      scheduledAt: "daily",
      startedAt: "",
      completedAt: "",
      retryCount: 0,
      errorMessage: process.env.CRON_SECRET ? "" : "CRON_SECRET is required for protected cron execution.",
      metadata: { path: "/api/cron/news-automation", schedule: "daily" },
    },
    {
      id: "cron-inquiry-email-test",
      jobType: "inquiry-email-test",
      status: process.env.CRON_SECRET ? "configured" : "needs_secret",
      scheduledAt: "monthly",
      startedAt: "",
      completedAt: "",
      retryCount: 0,
      errorMessage: process.env.CRON_SECRET ? "" : "CRON_SECRET is required for protected cron execution.",
      metadata: { path: "/api/cron/inquiry-email-test", schedule: "monthly" },
    },
    {
      id: "gsc-oauth",
      jobType: "google-search-console",
      status: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ? "configured" : "needs_config",
      scheduledAt: "on admin request",
      startedAt: "",
      completedAt: "",
      retryCount: 0,
      errorMessage: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ? "" : "GOOGLE_SEARCH_CONSOLE_SITE_URL is not configured.",
      metadata: { siteUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || "" },
    },
  ];
}

export function getSystemSettingsSnapshot() {
  return [
    { key: "后台登录", value: process.env.ADMIN_EMAIL ? "已配置管理员邮箱" : "使用默认管理员邮箱", sensitive: false },
    { key: "密码策略", value: process.env.ADMIN_PASSWORD_HASH ? "Hash 密码" : process.env.ADMIN_PASSWORD ? "明文环境变量密码" : "未配置生产密码", sensitive: false },
    { key: "数据库", value: isDatabaseConfigured() ? "DATABASE_URL 已配置" : "未配置，部分数据使用临时文件兜底", sensitive: false },
    { key: "询盘邮件", value: process.env.SMTP_HOST || process.env.RESEND_API_KEY ? "已配置发送通道" : "未配置邮件发送通道", sensitive: false },
    { key: "Search Console", value: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ? "已配置站点 URL" : "未配置站点 URL", sensitive: false },
    { key: "Cron Secret", value: process.env.CRON_SECRET ? "已配置" : "未配置", sensitive: true },
  ];
}

export function getCategoryStats() {
  const stats = new Map<string, { category: string; slug: string; count: number; priced: number; rfq: number }>();

  for (const product of products) {
    const slug = categorySlug(product);
    const current = stats.get(product.category) || {
      category: product.category,
      slug,
      count: 0,
      priced: 0,
      rfq: 0,
    };
    current.count += 1;
    if (product.price) current.priced += 1;
    if (inferBuyingPath(product) === "RFQ") current.rfq += 1;
    stats.set(product.category, current);
  }

  return [...stats.values()].sort((a, b) => b.count - a.count);
}

export async function getAdminOverview() {
  const adminProducts = getAdminProducts();
  const inquiries = await getInquiries();
  const missingImages = adminProducts.filter((product) => !product.imageExists);
  const directOrRfq = adminProducts.filter((product) => product.buyingPath === "Direct / RFQ").length;
  const rfqOnly = adminProducts.filter((product) => product.buyingPath === "RFQ").length;

  return {
    generatedAt: new Date().toISOString(),
    storageMode: isDatabaseConfigured() ? "postgres" : "temporary file storage",
    metrics: {
      products: adminProducts.length,
      categories: getCategoryStats().length,
      pages: adminPages.length,
      inquiries: inquiries.length,
      rfqOnly,
      directOrRfq,
      missingImages: missingImages.length,
    },
    categories: getCategoryStats(),
    recentInquiries: inquiries.slice(0, 8),
    missingImages: missingImages.slice(0, 12).map((product) => ({
      title: product.title,
      image: product.localImage,
      path: product.path,
    })),
    pages: adminPages,
  };
}
