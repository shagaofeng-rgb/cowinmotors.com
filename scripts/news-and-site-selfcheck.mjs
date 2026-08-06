const siteUrl = process.env.SITE_URL || "https://www.cowinmotors.com";

function ok(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchText(path, init) {
  const response = await fetch(`${siteUrl}${path}`, { redirect: "follow", ...init });
  const text = await response.text();
  return { response, text };
}

async function fetchJson(path, init) {
  const { response, text } = await fetchText(path, init);
  ok(response.ok, `${path} returned ${response.status}`);
  return JSON.parse(text);
}

async function imageOk(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: { accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.1" },
  });
  return response.ok && (response.headers.get("content-type") || "").toLowerCase().startsWith("image/");
}

const pages = [
  "/",
  "/products",
  "/headlights",
  "/tail-lights",
  "/exhaust",
  "/wheels",
  "/body-kits",
  "/quote",
  "/support",
  "/news",
  "/blog",
  "/sitemap.xml",
  "/news-sitemap.xml",
  "/news/rss.xml",
  "/robots.txt",
  "/admin/login",
];

const pageResults = [];
for (const path of pages) {
  const { response, text } = await fetchText(path);
  pageResults.push({ path, status: response.status, bytes: text.length });
  ok(response.status === 200, `${path} returned ${response.status}`);
  ok(text.length > 20, `${path} returned an empty body`);
}

const blogResponse = await fetch(`${siteUrl}/blog`, { redirect: "manual" });
ok(blogResponse.status === 200, "/blog should render successfully");

const newsPayload = await fetchJson("/api/news?limit=8");
ok(Array.isArray(newsPayload.articles), "News API does not return an articles array");
ok(newsPayload.articles.length > 0, "News API has no published articles");

const categoryPayload = await fetchJson("/api/news/categories");
ok(Array.isArray(categoryPayload.categories), "News category API does not return categories array");

const article = newsPayload.articles[0];
ok(article.slug, "First News article is missing slug");
ok(article.title, "First News article is missing title");
ok(article.excerpt, "First News article is missing excerpt");
ok(article.canonicalSourceUrl, "First News article is missing source URL");
ok(article.sourcePublisher, "First News article is missing source publisher");
ok(article.sourcePublishedAt, "First News article is missing source published time");
ok(article.products?.length >= 1, "First News article is not linked to a product");
ok(article.coverImageUrl, "First News article is missing cover image");
ok(/^https?:\/\//.test(article.coverImageUrl), "News cover image must be absolute");
ok(!/cowinmotors\.com$/i.test(new URL(article.coverImageUrl).hostname), "News cover image must not be a Cowinmotors site image");
ok(await imageOk(article.coverImageUrl), "News cover image URL is not reachable as an image");

const detail = await fetchText(`/news/${article.slug}`);
ok(detail.response.status === 200, "News detail page is not reachable");
ok(detail.text.includes(article.canonicalSourceUrl), "News detail page does not show original source link");
ok(/application\/ld\+json/.test(detail.text), "News detail page is missing JSON-LD");
ok(detail.text.includes(article.products[0].url), "News detail page does not link related product");

const productNews = await fetchJson(`/api/products/${encodeURIComponent(article.products[0].productId)}/news`);
ok(Array.isArray(productNews.articles), "Product related News API should return articles array");

const adminApi = await fetch(`${siteUrl}/api/admin/news/jobs`);
ok(adminApi.status === 401, "Admin News API must require authentication");

const sitemapAdminApi = await fetch(`${siteUrl}/api/admin/sitemap`);
ok(sitemapAdminApi.status === 401, "Admin Sitemap API must require authentication");

const rss = (await fetchText("/news/rss.xml")).text;
ok(rss.includes(article.slug), "RSS feed does not include latest checked article");

const newsSitemap = (await fetchText("/news-sitemap.xml")).text;
ok(newsSitemap.includes("<urlset"), "News sitemap is not valid XML");
if (Date.now() - new Date(article.publishedAt).getTime() <= 2 * 24 * 60 * 60 * 1000) {
  ok(newsSitemap.includes(article.slug), "News sitemap does not include the recent checked article");
}

const sitemapIndex = (await fetchText("/sitemap.xml")).text;
ok(sitemapIndex.includes("<sitemapindex"), "Main Sitemap is not a Sitemap Index");
for (const file of ["pages-1.xml", "categories-1.xml", "products-1.xml", "posts-1.xml"]) {
  ok(sitemapIndex.includes(`/sitemaps/${file}`), `Sitemap Index is missing ${file}`);
  const child = await fetchText(`/sitemaps/${file}`);
  ok(child.response.status === 200 && child.text.includes("<urlset"), `${file} is not reachable or valid`);
}

console.log(JSON.stringify({
  ok: true,
  siteUrl,
  pageResults,
  checkedArticle: {
    slug: article.slug,
    sourcePublisher: article.sourcePublisher,
    coverImageHost: new URL(article.coverImageUrl).hostname,
    relatedProducts: article.products.length,
  },
}, null, 2));
