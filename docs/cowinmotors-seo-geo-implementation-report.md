# Cowinmotors SEO and GEO Implementation Report

Date: 2026-08-08

## Product coverage

- Source catalog records scanned: 1,683.
- Public product candidates: 1,433.
- Excluded from the public wheels catalog: 250 motorcycle-wheel, tire, trailer, accessory, or non-forged records.
- Full audit: `docs/cowinmotors-product-master-audit.md`.

Every public product route now uses a fitment-led detail template with the catalog's real product image, a product-specific H1, canonical, Open Graph metadata, Product schema, FAQ schema, Breadcrumb schema, fitment checklist, inquiry form, packaging/export support, and related products. The implementation intentionally omits prices, stock, lead-time, certification, review, dealer, and factory claims unless they are verified in the product data.

The RFQ flow captures name, company, email, WhatsApp/phone, country, buyer type, category, product URL/SKU, vehicle details, LHD/RHD, side/set, OE number, quantity, destination, requirement, and an optional JPG/PNG/WebP/PDF product reference up to 5 MB. Accepted reference files are delivered with the RFQ email as a real attachment; unsupported attachments are rejected server-side.

## Technical SEO controls

- Canonical domain: `https://www.cowinmotors.com`.
- Middleware returns a permanent `308` for `cowinmotors.com` requests to the `www` equivalent.
- `robots.txt` explicitly allows Googlebot, Bingbot, and OAI-SearchBot, with admin, API, and quotation paths disallowed.
- Canonical sitemap is `https://www.cowinmotors.com/sitemap.xml`.
- Sitemap includes valuable static pages, indexable categories, public product pages, published Buyer Guides, and only manually reviewed/indexable News.
- Search/sort/filter and quotation parameter pages receive `noindex,follow` through page metadata.
- All external Google indexing/sitemap submission code and schedules were removed. Search Console is the correct place for a human to submit the canonical sitemap.

## GEO and buyer-trust pages

Created or rebuilt: About, Contact, Quality Control, Packaging & Shipping, Fitment Check, Wholesale Auto Parts Sourcing, Returns & Warranty, Payment, Privacy Policy, Terms, Track Your Order, Installation Guidance, Sourcing & Bulk Orders, and Contact Support.

Each uses the consistent company name, legal entity, address, contacts, and positioning: **China-Based Automotive Parts Sourcing & Export Partner**. Company and product schemas do not claim brand authorization, inventory, certification, pricing, shipping promises, or review ratings.

## Manual editorial policy

News and Buyer Guides remain readable, but no automatic content generation, crawling, RSS import, webhook publication, queue, or time-based publisher is available. News is excluded from search indexing until a human editor validates the material. Buyer Guides are intended for original, manually reviewed guidance with named authors, dates, sources where applicable, and product relevance.

## Local verification

- TypeScript: `pnpm exec tsc --noEmit` passed.
- Production build: `pnpm exec next build` passed with 1,461 generated routes.
- Sitemap test suite: 9 passed, 0 failed.
- Full local smoke check: passed on homepage, catalog, 5 category pages, RFQ, support pages, News, Blog, sitemap, robots, public News APIs, and admin login.
- A real product URL sampled from the generated product sitemap returned `200` and emitted four JSON-LD blocks (organization, Product, FAQPage, BreadcrumbList).

## Items requiring human source material

The audit identifies fields absent from the supplied catalog, including additional gallery images, dimensions, materials, connector and coding information, wheel PCD/offset/center-bore/load data, packaging images, certification documents, installation material, and verified product videos. These are intentionally presented as confirmation requirements rather than invented values.

## Production verification

Deployment `dpl_CrcVYBmYoHpxzDDDnppsFk61me34` was successfully aliased to `https://www.cowinmotors.com`. The production smoke check passed on 22 key routes including the catalog, all five category pages, RFQ, News, Blog, robots, sitemap, public News APIs, admin login, and the new support pages. `https://cowinmotors.com/products` returned a permanent `308` to the equivalent `www` URL. The remaining external validation is the Google Rich Results Test for the homepage, category page, and representative product URLs; that third-party test has not been represented as completed.
