import type { MetadataRoute } from "next";
import { products } from "@/lib/products";

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
    .slice(0, 2500)
    .map((product) => ({
      url: `${siteUrl}/product/${product.slug || product.__id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    }));

  return [...staticPages, ...productPages];
}
