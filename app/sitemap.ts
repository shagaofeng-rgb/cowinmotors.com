import type { MetadataRoute } from "next";
import { getPublishedNews } from "@/lib/news";
import { products } from "@/lib/products";

const siteUrl = "https://www.cowinmotors.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/products",
    "/headlights",
    "/tail-lights",
    "/exhaust",
    "/wheels",
    "/body-kits",
    "/quote",
    "/support",
    "/news",
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

  const newsPages = (await getPublishedNews({ limit: 1000 })).map((article) => ({
    url: `${siteUrl}/news/${article.slug}`,
    lastModified: new Date(article.updatedAt || article.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...newsPages];
}
