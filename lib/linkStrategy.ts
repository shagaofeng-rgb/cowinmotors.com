import { adminPages, getAdminProducts } from "@/lib/adminData";

const safeExternalDomains = ["api.whatsapp.com", "wa.me", "github.com", "vercel.com"];

export async function getLinkAuditReport() {
  const products = getAdminProducts();
  const contentRows = [
    ...adminPages.map((page) => ({
      type: "Page",
      title: page.label,
      href: page.path,
      keywords: page.intent,
    })),
    ...products.map((product) => ({
      type: "Product",
      title: product.title,
      href: product.path,
      keywords: `${product.category} ${product.title}`,
    })),
  ];

  const internalRows = contentRows.map((row) => {
    const terms = row.keywords.toLowerCase().split(/\W+/).filter((term) => term.length > 3);
    const suggestions = contentRows
      .filter((candidate) => candidate.href !== row.href)
      .map((candidate) => ({
        ...candidate,
        score: terms.filter((term) => candidate.keywords.toLowerCase().includes(term)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    return { ...row, suggestions };
  });

  const externalRows = [
    {
      url: "https://api.whatsapp.com/send/?phone=%2B8617601255205&text&type=phone_number&app_absent=0",
      domain: "api.whatsapp.com",
      source: "WhatsApp floating button",
      risk: "safe",
      recommendedRel: "noopener noreferrer",
      reason: "Official WhatsApp contact link.",
    },
  ];

  return {
    summary: {
      pages: contentRows.length,
      pagesWithEnoughInternalLinks: internalRows.filter((row) => row.suggestions.length >= 2).length,
      externalLinks: externalRows.length,
      highRiskExternalLinks: externalRows.filter((row) => row.risk === "high-risk").length,
    },
    internalRows,
    externalRows: externalRows.map((row) => ({
      ...row,
      risk: safeExternalDomains.includes(row.domain) ? row.risk : "needs-confirmation",
    })),
    recommendations: [
      "每个核心分类页至少链接 3 个代表产品和 RFQ 页面。",
      "每个产品详情页增加同类产品、分类页和询盘页内链。",
      "外链统一使用 noopener noreferrer，广告或非官方链接再加 nofollow。",
      "后续接入 Search Console 后，按高曝光低点击页面补充 FAQ 和产品对比内容。",
    ],
  };
}
