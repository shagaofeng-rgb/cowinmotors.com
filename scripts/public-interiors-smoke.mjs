import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const base = process.env.SITE_URL || 'http://127.0.0.1:47931';
const out = process.env.AUDIT_SCREENSHOT_DIR;
const widths = process.env.AUDIT_FLOWS_ONLY ? [] : (process.env.AUDIT_WIDTHS || '1440,768,390').split(',').map(Number);
const productRoutes = {
  headlight: '/product/audi-a3-audi-a3-led-drl-facelift-conversion-headlight-assembly-2013-2016-7a4cb2',
  tail: '/product/audi-a3-audi-a3-led-sequential-turn-signal-rs-style-tail-light-assembly-2013-2016-6d9f6e',
  pipe: '/product/mercedes-benz-e63-amg-w212-5-5t-2014-ss304-valved-catback-exhaust-system',
  wheel: '/product/bc-forged-na-acl51-bcforged',
  missing: '/product/brixton-forged-aerotech-brixton',
};
const pages = [
  '/', '/products', '/headlights', '/tail-lights', '/exhaust', '/wheels', '/body-kits',
  '/quote', '/support', '/about', '/contact', '/quality-control', '/packaging-shipping',
  '/fitment-check', '/wholesale-auto-parts-sourcing', '/returns-warranty', '/payment',
  '/track-your-order', '/installation-guidance', '/sourcing-bulk-orders', '/contact-support',
  '/privacy-policy', '/terms', '/news', '/blog', ...Object.values(productRoutes),
  '/product/qa-product-not-found-87476',
];
const capture = new Set(['/', '/products', '/headlights', '/exhaust', '/body-kits', '/quote', '/about', '/support', '/contact', '/news', '/blog', ...Object.values(productRoutes)]);
const data = JSON.parse(await fs.readFile(new URL('../public/data/site-data.json', import.meta.url), 'utf8'));
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
const results = [];
const saved = (slug) => data.products.find((item) => `/product/${item.slug}` === slug);

if (out) await fs.mkdir(out, { recursive: true });
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const exceptions = [];
    page.on('pageerror', (error) => exceptions.push(error.message));
    await page.route('**/api/analytics**', (route) => route.fulfill({ json: { ok: true } }));
    // Keep third-party map availability independent of layout checks.
    await page.route('https://www.google.com/maps/**', (route) => route.fulfill({ body: '<!doctype html><title>Map frame</title>' }));
    const discovered = new Set();
    for (const route of pages) {
      exceptions.length = 0;
      const response = await page.goto(new URL(route, base).href, { waitUntil: 'domcontentloaded', timeout: 75_000 });
      await page.locator('main h1').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const expectedStatus = route.endsWith('not-found-87476') ? 404 : 200;
      assert.equal(response?.status(), expectedStatus, route);
      const h1 = await page.locator('main h1').allTextContents();
      assert.equal(h1.length, 1, `${route} at ${width}: one page title`);
      assert.ok(h1[0].trim(), `${route} has a title`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${route} overflows at ${width}`);
      assert.equal(await page.locator('main.cm-inner').count(), route === '/' ? 0 : 1, `${route} interior isolation`);
      if (route === '/news' || route === '/blog') {
        const href = await page.locator(`main a[href^="${route}/"]`).first().getAttribute('href', { timeout: 1000 }).catch(() => null);
        if (href) { discovered.add(href); capture.add(href); }
      }
      if (route === productRoutes.missing) {
        assert.equal(await page.locator('.cm-photo-stage img').count(), 0, 'tracking pixel is not a product photo');
        assert.equal(await page.getByRole('link', { name: 'Request a photo' }).count(), 1);
      }
      if ([productRoutes.headlight, productRoutes.tail, productRoutes.pipe].includes(route)) {
        const photo = page.locator('.cm-photo-stage img');
        await photo.evaluate((img) => img.decode());
        assert.equal(await photo.getAttribute('src'), `/${saved(route).localImage}`);
        assert.equal(await photo.evaluate((img) => {
          const image = img.getBoundingClientRect();
          const frame = img.parentElement.getBoundingClientRect();
          return getComputedStyle(img).objectFit === 'contain' && image.top >= frame.top && image.bottom <= frame.bottom + 1 && image.width <= frame.width + 1;
        }), true, `${route} photo fits without clipping at ${width}`);
      }
      if (route === productRoutes.wheel) assert.equal(await page.locator('.cm-wheel-diagram').count(), 1);
      if (out && capture.has(route)) {
        await page.waitForLoadState('load', { timeout: 30_000 }).catch(() => {});
        await page.screenshot({ path: path.join(out, `${route === '/' ? 'home' : route.slice(1).replaceAll('/', '_')}-${width}.png`), animations: 'disabled' });
      }
      assert.deepEqual(exceptions, [], `${route} runtime errors at ${width}`);
      results.push({ route, width, status: expectedStatus });
    }

    for (const route of discovered) {
      const response = await page.goto(new URL(route, base).href, { waitUntil: 'domcontentloaded' });
      assert.equal(response?.status(), 200, route);
      assert.equal(await page.locator('.cm-article-body > p').count() > 0, true, route);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${route} overflows at ${width}`);
      if (out) await page.screenshot({ path: path.join(out, `${route.slice(1).replaceAll('/', '_')}-${width}.png`), animations: 'disabled' });
      results.push({ route, width, status: 200 });
    }
    console.log(`${width}px: ${pages.length} routes + ${discovered.size} published articles passed`);
    await context.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(12000);
  await page.route('**/api/analytics**', (route) => route.fulfill({ json: { ok: true } }));
  await page.goto(new URL('/products', base).href);
  await page.getByLabel('Navigation menu').click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Headlights', exact: true }).click();
  await page.waitForURL('**/headlights');
  assert.equal(await page.locator('.cm-menu[open]').count(), 0);
  await page.locator('.cm-category-picker summary').click();
  assert.equal(await page.locator('.cm-category-picker').getByRole('link', { name: 'Forged wheels' }).isVisible(), true);
  await page.locator('.cm-category-picker summary').click();
  await page.getByRole('button', { name: 'Search & filter' }).click();
  const filter = page.getByRole('dialog', { name: 'Search & filter' });
  await filter.getByLabel('Search parts').fill('A3');
  await filter.getByLabel('Make / brand').selectOption('Audi');
  await filter.getByLabel('Model year').fill('2015');
  await filter.getByRole('button', { name: 'Apply filters' }).click();
  await page.waitForURL('**/headlights?make=Audi&q=A3&year=2015');
  assert.ok(await page.locator('.cm-part-card').count(), 'A3 headlight covers intermediate model year 2015');
  assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
  await page.locator('.cm-part-card h3 a').first().click();
  await page.waitForURL('**/product/**');
  await page.goBack();
  assert.equal(new URL(page.url()).search, '?make=Audi&q=A3&year=2015');
  await page.getByRole('link', { name: 'Remove filter 2015' }).click();
  await page.waitForURL('**/headlights?make=Audi&q=A3');

  await page.goto(new URL(productRoutes.headlight, base).href);
  const enlarge = page.getByRole('button', { name: 'Enlarge product photo' });
  await enlarge.click();
  assert.equal(await page.locator('.cm-photo-dialog[open]').count(), 1);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.cm-photo-dialog[open]').count(), 0);
  assert.equal(await enlarge.evaluate((node) => document.activeElement === node), true);
  await page.getByRole('link', { name: 'Request a quote', exact: true }).filter({ visible: true }).first().click();
  await page.waitForURL('**#product-inquiry');
  const form = page.locator('#rfqForm');
  assert.equal(await form.locator('input[name="productUrl"]').inputValue(), `https://www.cowinmotors.com${productRoutes.headlight}`);
  await form.getByLabel('Name', { exact: false }).first().fill('Codex QA');
  await form.locator('input[name="email"]').fill('codex@example.com');
  await form.getByLabel('WhatsApp / phone').fill('+12025550142');
  await form.getByLabel('Vehicle model').fill('A3 8V');
  await form.getByLabel('Quantity').fill('2 sets');
  let payload;
  let failNext = true;
  await page.route('**/api/inquiry', async (route) => {
    payload = route.request().postDataJSON();
    if (failNext) { failNext = false; await route.abort(); }
    else await route.fulfill({ json: { ok: true, emailSent: true } });
  });
  await form.getByRole('button', { name: 'Send quote request' }).click();
  await form.getByRole('alert').waitFor();
  assert.match(await form.getByRole('alert').textContent(), /try again/);
  await form.getByRole('button', { name: 'Send quote request' }).click();
  await form.getByRole('status').filter({ hasText: 'Quote request received' }).waitFor();
  assert.match(payload.product, /Audi A3/);
  assert.ok(payload.requirement.includes(productRoutes.headlight));
  assert.match(payload.vehicleInfo, /A3 8V/);
  assert.equal(payload.quantity, '2 sets');

  await page.route('**/assets/catalog/tianju/id_dbebb9d655a34cd4b44b4efca86279d9.webp', (route) => route.fulfill({ status: 404 }));
  await page.reload();
  await page.getByRole('link', { name: 'Request a photo' }).waitFor();
  assert.equal(await page.locator('.cm-photo-stage img').count(), 0);

  await page.goto(new URL('/support?q=warranty', base).href);
  assert.equal(await page.locator('.cm-support-list a').count(), 1);
  await page.goto(new URL('/support?q=not-a-support-topic-87476', base).href);
  assert.equal(await page.getByRole('heading', { name: 'No matching topics' }).count(), 1);
  await page.goto(new URL('/body-kits', base).href);
  await page.getByRole('link', { name: 'Rear diffusers' }).click();
  await page.waitForURL('**/quote?category=body-kits&product=Rear%20diffusers');
  assert.equal(await page.getByLabel('Product category').inputValue(), 'Body Kits');
  assert.equal(await page.getByLabel('Product name or SKU').inputValue(), 'Rear diffusers');
  await page.goto(new URL('/track-your-order', base).href);
  await page.getByLabel('Order or quotation reference').fill('QA-0001');
  await page.getByLabel('Receiving company or name').fill('QA workshop');
  await page.getByLabel('Destination country').fill('Canada');
  await page.getByRole('button', { name: 'Open email draft' }).click();
  const draft = await page.getByRole('link', { name: 'Reopen email draft' }).getAttribute('href');
  assert.match(decodeURIComponent(draft), /Order or quotation reference: QA-0001/);
  console.log(`Passed ${results.length} responsive route checks plus navigation, catalog filters, photo enlargement/failure, RFQ recovery and prefill, and support search.`);
} finally {
  await browser.close();
}
