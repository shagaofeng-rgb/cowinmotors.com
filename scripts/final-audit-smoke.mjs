const siteUrl = process.env.SITE_URL || "https://www.cowinmotors.com";

const paths = [
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
  "/api/news",
  "/api/news/categories",
  "/robots.txt",
  "/admin/login",
];

function ok(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchText(path) {
  const response = await fetch(`${siteUrl}${path}`, { redirect: "follow" });
  const text = await response.text();
  return { response, text };
}

const results = [];

for (const path of paths) {
  const { response, text } = await fetchText(path);
  results.push({ path, status: response.status, size: text.length });
  ok(response.status === 200, `${path} returned ${response.status}`);
  ok(text.length > 20, `${path} returned empty body`);
}

const quote = (await fetchText("/quote")).text;
ok(/name="phone"/.test(quote), "Quote form is missing phone input.");
ok(/type="tel"/.test(quote), "Quote phone input should use tel type.");
ok(/Phone \/ WhatsApp/.test(quote), "Quote form is missing phone label.");

const missingPhone = await fetch(`${siteUrl}/api/inquiry`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "Audit Missing Phone", email: "audit@example.com" }),
});
ok(missingPhone.status === 400, "Inquiry API should reject missing phone.");

const protectedApi = await fetch(`${siteUrl}/api/admin/search-console/overview`);
ok(protectedApi.status === 401, "Admin API should require authentication.");

const news = (await fetchText("/news")).text;
ok(/Automotive News|News automation is ready|news-card/.test(news), "News page did not render expected content.");
const newsApi = JSON.parse((await fetchText("/api/news")).text);
ok(Array.isArray(newsApi.articles), "News API should return articles array.");
if (newsApi.articles.length) {
  const first = newsApi.articles[0];
  ok(first.coverImageUrl && /^https?:\/\//.test(first.coverImageUrl), "News article should have an absolute cover image URL.");
  ok(!/cowinmotors\.com/i.test(new URL(first.coverImageUrl).hostname), "News cover image must not use a Cowinmotors site image.");
  ok(first.canonicalSourceUrl && /^https?:\/\//.test(first.canonicalSourceUrl), "News article should include canonical source URL.");
  ok(first.products?.length >= 1, "News article should link at least one product.");
}

const blog = await fetch(`${siteUrl}/blog`, { redirect: "manual" });
ok([301, 302, 303, 307, 308].includes(blog.status) || blog.url.endsWith("/news"), "Blog route should redirect to News rather than 404.");

const robots = (await fetchText("/robots.txt")).text;
ok(/sitemap\.xml/.test(robots), "robots.txt missing sitemap.");
ok(/news-sitemap\.xml/.test(robots), "robots.txt missing news sitemap.");

console.log(JSON.stringify({ ok: true, siteUrl, results }, null, 2));
