import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", allow: "/", disallow: ["/admin/", "/api/", "/quote"] },
      { userAgent: "Bingbot", allow: "/", disallow: ["/admin/", "/api/", "/quote"] },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/admin/", "/api/", "/quote"] },
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/quote"] },
    ],
    sitemap: "https://www.cowinmotors.com/sitemap.xml",
  };
}
