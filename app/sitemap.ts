import type { MetadataRoute } from "next";
import { categorySlug, products } from "@/lib/products";

const siteUrl = "https://www.cowinmotors.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/products",
    "/headlights",
    "/tail-lights",
    "/exhaust",
    "/body-kits",
    "/quote",
    "/support",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));

  const productPages = products
    .filter((product) => categorySlug(product) !== "catalog-reference")
    .slice(0, 2500)
    .map((product) => ({
      url: `${siteUrl}/product/${product.slug || product.__id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: categorySlug(product) === "oem-parts" ? 0.45 : 0.65,
    }));

  return [...staticPages, ...productPages];
}
