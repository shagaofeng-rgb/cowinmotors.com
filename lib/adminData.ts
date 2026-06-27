import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { ensureCoreSchema, getSql, isDatabaseConfigured } from "@/lib/database";
import { categorySlug, inferBuyingPath, products } from "@/lib/products";

export type InquiryRecord = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  country: string;
  productType: string;
  product: string;
  vehicleInfo: string;
  quantity: string;
  requirement: string;
  source: string;
};

const inquiryFile = path.join(os.tmpdir(), "cowinmotors-inquiries.json");

export const adminPages = [
  { path: "/", label: "Home", priority: "High", intent: "brand, categories, featured products" },
  { path: "/products", label: "All Products", priority: "High", intent: "catalog discovery and fitment search" },
  { path: "/headlights", label: "Headlights", priority: "High", intent: "lighting category SEO and buyer entry" },
  { path: "/exhaust", label: "Exhaust Pipes", priority: "High", intent: "USD 1,999 exhaust offer and workshop proof" },
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
    await ensureCoreSchema();
    const rows = await sql`
      SELECT id, created_at, source, name, email, country, product_type, product, vehicle_info, quantity, requirement
      FROM cowin_inquiries
      ORDER BY created_at DESC
      LIMIT 300
    ` as InquiryRow[];
    return rows.map(inquiryFromRow);
  }

  return readJsonFile<InquiryRecord[]>(inquiryFile, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function persistInquiry(record: InquiryRecord) {
  const sql = getSql();

  if (sql) {
    await ensureCoreSchema();
    await sql`
      INSERT INTO cowin_inquiries (
        id, created_at, source, name, email, country, product_type, product, vehicle_info, quantity, requirement
      ) VALUES (
        ${record.id},
        ${record.createdAt},
        ${record.source},
        ${record.name},
        ${record.email},
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
    path: `/product/${product.__id}`,
    categorySlug: categorySlug(product),
    buyingPath: inferBuyingPath(product),
    imageExists: fs.existsSync(path.join(process.cwd(), "public", product.localImage.replace(/^\//, ""))),
  }));
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
