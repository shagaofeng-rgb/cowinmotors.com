const siteUrl = process.env.SITE_URL || "https://www.cowinmotors.com";

const paths = [
  "/",
  "/products",
  "/headlights",
  "/tail-lights",
  "/exhaust",
  "/body-kits",
  "/quote",
  "/support",
  "/news",
  "/sitemap.xml",
  "/news-sitemap.xml",
  "/news/rss.xml",
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

const robots = (await fetchText("/robots.txt")).text;
ok(/sitemap\.xml/.test(robots), "robots.txt missing sitemap.");
ok(/news-sitemap\.xml/.test(robots), "robots.txt missing news sitemap.");

console.log(JSON.stringify({ ok: true, siteUrl, results }, null, 2));
