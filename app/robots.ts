import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", allow: "/", disallow: ["/admin/", "/api/"] },
      { userAgent: "Bingbot", allow: "/", disallow: ["/admin/", "/api/"] },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/admin/", "/api/"] },
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    ],
    sitemap: "https://www.cowinmotors.com/sitemap.xml",
  };
}
