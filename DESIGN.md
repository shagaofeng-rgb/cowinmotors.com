# Cowinmotors Public Interiors

The existing home and admin surfaces keep their own styles. Public interiors use `InnerPage`, a compact graphite header and a bright technical-catalog body. The language is shared across product, buying, company, support and editorial routes.

## Visual System

- White `#ffffff` for reading and original photos, steel wash `#f1f4f5` for section bands, graphite `#1d242a` for navigation and footer, blue `#0d5594` for primary actions.
- Product identity, photo and fitment lead the first screen. Recorded facts use aligned label/value rows; order-critical unknowns appear in a checklist, not as invented specifications.
- Category banners are clearly labeled illustrations, served as compact WebP assets. They never supply SKU imagery. Product galleries and cards render only images associated with the catalog record; ambiguous or failed sources show a request-photo state.
- Use original part pictograms for the category switcher and Lucide for controls. Controls and product media have predictable dimensions. Page sections are unframed or use full-width bands; framing is for media, forms, modal dialogs and repeated items.

## Interaction

- Catalog filters preserve the public query format and canonical behavior. Phones use a bottom sheet; desktop uses one filter bar. Results and pagination render on the server.
- The product gallery supports keyboard dismissal, zoom and photos explicitly attached to the SKU. Mobile quote actions stay reachable until the main actions or form are in view.
- RFQs carry the selected product URL and name and keep the existing inquiry API. Order status requests open a draft email; there is no live carrier lookup.
- Support content uses topical navigation; legal text is unchanged. News and buyer guides use their existing published records and metadata.

## Verification

Use `scripts/public-interiors-smoke.mjs` with `SITE_URL`, `PLAYWRIGHT_PACKAGE` and an optional `AUDIT_SCREENSHOT_DIR`. It covers responsive routes, catalog filtering, gallery controls, RFQ states and order/support navigation. Run `scripts/catalog-indexation-regression.mjs` for HTTP, canonical and noindex behavior.
