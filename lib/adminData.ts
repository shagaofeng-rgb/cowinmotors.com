import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
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

export function getInquiries() {
  return readJsonFile<InquiryRecord[]>(inquiryFile, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveInquiry(input: Omit<InquiryRecord, "id" | "createdAt" | "source">) {
  const record: InquiryRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    source: "website-rfq-form",
    ...input,
  };
  const records = [record, ...getInquiries()].slice(0, 300);
  writeJsonFile(inquiryFile, records);
  return record;
}

export function saveInquiryWithSource(input: Omit<InquiryRecord, "id" | "createdAt">) {
  const record: InquiryRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  const records = [record, ...getInquiries()].slice(0, 300);
  writeJsonFile(inquiryFile, records);
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

export function getAdminOverview() {
  const adminProducts = getAdminProducts();
  const inquiries = getInquiries();
  const missingImages = adminProducts.filter((product) => !product.imageExists);
  const directOrRfq = adminProducts.filter((product) => product.buyingPath === "Direct / RFQ").length;
  const rfqOnly = adminProducts.filter((product) => product.buyingPath === "RFQ").length;

  return {
    generatedAt: new Date().toISOString(),
    storageMode: "temporary file storage",
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
