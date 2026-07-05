import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: ["https://www.cowinmotors.com/sitemap.xml", "https://www.cowinmotors.com/news-sitemap.xml"],
  };
}
