export type NewsSourceConfig = {
  id: string;
  domain: string;
  type: "regulator" | "standards-body" | "trade-media" | "research-institute" | "manufacturer-newsroom";
  allowedTopics: string[];
  allowedLanguages: string[];
  rssOrApiUrl: string;
  sourceTrustScore: number;
};

export type ProductThemePlanItem = {
  themeId: string;
  productUrl: string;
  productName: string;
  startAt: string;
  endAt: string;
  status: "active" | "inactive";
};

export type NewsSiteConfig = {
  siteId: string;
  enabled: boolean;
  brandName: string;
  siteUrl: string;
  industry: string;
  industryScope: string;
  targetMarkets: string[];
  publicationLanguage: string;
  locale: string;
  timezone: string;
  news: {
    enabled: boolean;
    listRoute: string;
    detailRoutePattern: string;
    rssRoute: string;
    sitemapRoute: string;
    desiredWordCount: { min: number; max: number };
    ingestIntervalHours: number;
    publishIntervalHours: number;
    candidateMaxAgeHours: number;
    fallbackCandidateMaxAgeDays: number;
    minScore: number;
    maxInternalProductLinks: number;
    defaultAuthorType: string;
  };
  blog: {
    enabled: boolean;
    listRoute: string;
    detailRoutePattern: string;
    sitemapRoute: string;
    contentSource: string;
    allowNewsAutomation: false;
  };
  productThemePlan: ProductThemePlanItem[];
  sources: { primaryWhitelist: NewsSourceConfig[]; fallbackWhitelist: NewsSourceConfig[] };
  publishing: {
    cmsAdapter: "neon-nextjs-news";
    contentStatusAfterPublish: "published";
    requireFrontendVerification: true;
    alertChannel: string;
    productionEnabled: boolean;
  };
  ownedNeutralImage: { url: string; alt: string };
};

const cowinmotors: NewsSiteConfig = {
  siteId: "cowinmotors",
  enabled: true,
  brandName: "Cowinmotors Automotive Parts",
  siteUrl: "https://www.cowinmotors.com",
  industry: "Automotive aftermarket parts sourcing and export",
  industryScope: "Headlights, tail lights, exhaust systems, forged wheels, body kits, fitment, vehicle safety, standards, international logistics, packaging and automotive aftermarket supply-chain topics. Excludes personnel announcements, promotions, giveaways, unrelated retail news and unverified market claims.",
  targetMarkets: ["US", "EU"],
  publicationLanguage: "en",
  locale: "en-US",
  timezone: "Asia/Shanghai",
  news: {
    enabled: true,
    listRoute: "/news",
    detailRoutePattern: "/news/[slug]",
    rssRoute: "/news/rss.xml",
    sitemapRoute: "/news-sitemap.xml",
    desiredWordCount: { min: 700, max: 1000 },
    ingestIntervalHours: 12,
    publishIntervalHours: 48,
    candidateMaxAgeHours: 72,
    fallbackCandidateMaxAgeDays: 7,
    minScore: 70,
    maxInternalProductLinks: 1,
    defaultAuthorType: "Editorial Team",
  },
  blog: {
    enabled: true,
    listRoute: "/blog",
    detailRoutePattern: "/blog/[slug]",
    sitemapRoute: "/blog-sitemap.xml",
    contentSource: "blog_articles",
    allowNewsAutomation: false,
  },
  productThemePlan: [
    { themeId: "automotive-lighting-fitment", productUrl: "/headlights", productName: "Automotive lighting fitment", startAt: "2026-01-01T00:00:00+08:00", endAt: "2026-12-31T23:59:59+08:00", status: "active" },
    { themeId: "exhaust-compliance", productUrl: "/exhaust", productName: "Performance exhaust sourcing", startAt: "2026-01-01T00:00:00+08:00", endAt: "2026-12-31T23:59:59+08:00", status: "active" },
    { themeId: "wheel-fitment", productUrl: "/wheels", productName: "Forged wheel fitment", startAt: "2026-01-01T00:00:00+08:00", endAt: "2026-12-31T23:59:59+08:00", status: "active" },
  ],
  sources: {
    primaryWhitelist: [
      { id: "aftermarket-news", domain: "aftermarketnews.com", type: "trade-media", allowedTopics: ["technology", "supply-chain", "aftermarket"], allowedLanguages: ["en"], rssOrApiUrl: "https://www.aftermarketnews.com/feed/", sourceTrustScore: 84 },
      { id: "counterman", domain: "counterman.com", type: "trade-media", allowedTopics: ["aftermarket", "parts", "repair"], allowedLanguages: ["en"], rssOrApiUrl: "https://www.counterman.com/feed/", sourceTrustScore: 78 },
    ],
    fallbackWhitelist: [
      { id: "repairer-driven-news", domain: "repairerdrivennews.com", type: "trade-media", allowedTopics: ["repair", "safety", "standards"], allowedLanguages: ["en"], rssOrApiUrl: "https://www.repairerdrivennews.com/feed/", sourceTrustScore: 76 },
      { id: "autobody-news", domain: "autobodynews.com", type: "trade-media", allowedTopics: ["body", "repair", "supply-chain"], allowedLanguages: ["en"], rssOrApiUrl: "https://www.autobodynews.com/news?format=feed&type=rss", sourceTrustScore: 74 },
    ],
  },
  publishing: {
    cmsAdapter: "neon-nextjs-news",
    contentStatusAfterPublish: "published",
    requireFrontendVerification: true,
    alertChannel: "news-automation-audit-events",
    productionEnabled: process.env.NEWS_AUTOMATION_PRODUCTION_ENABLED === "true",
  },
  ownedNeutralImage: {
    url: "https://www.cowinmotors.com/assets/ui/photography/news/article-fitment-compliance.png",
    alt: "Automotive parts fitment and compliance review",
  },
};

const sites = new Map<string, NewsSiteConfig>([[cowinmotors.siteId, cowinmotors]]);

export function getNewsSite(siteId = "cowinmotors") {
  const site = sites.get(siteId);
  if (!site) throw new Error(`Unknown News site_id: ${siteId}`);
  return site;
}

export function listNewsSites() {
  return [...sites.values()];
}

export function validateNewsSiteConfig(site: NewsSiteConfig) {
  const failures: string[] = [];
  if (!site.siteId || !site.siteUrl || !site.industryScope || !site.publicationLanguage || !site.timezone) failures.push("site identity, scope, language, URL or timezone is missing");
  if (!site.news.listRoute || !site.news.detailRoutePattern || !site.news.rssRoute || !site.news.sitemapRoute) failures.push("News routes are incomplete");
  if (!site.productThemePlan.length) failures.push("product theme plan is empty");
  if (!site.sources.primaryWhitelist.length || !site.sources.fallbackWhitelist.length) failures.push("primary or fallback source whitelist is empty");
  if (site.blog.allowNewsAutomation) failures.push("Blog must not allow News automation");
  return { ok: failures.length === 0, failures };
}
