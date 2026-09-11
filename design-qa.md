# Homepage Catalog Editorial Fidelity QA

## Comparison target

- **Source visual truth:** `/Users/apple/.codex/generated_images/019e9b6c-df7f-7fb3-89a2-27fd6d2b6fd8/exec-7e1a252b-fc87-40ac-9bd7-6aa72283c238.png` (`1024 x 1536`).
- **Implementation:** `http://127.0.0.1:3102/`, captured in the Codex in-app browser during this implementation run.
- **Desktop capture:** `1280 x 720` CSS viewport, default page state.
- **Mobile capture:** `390 x 844` CSS viewport, default page state.
- **Density normalization:** the source is an ImageGen visual board rather than a browser capture. The comparison used the same catalogue route and default header state; browser chrome was not included in the judgement.

## Full-view comparison

The implementation now follows the source board section-for-section: compact utility/header bands; a single full-width vehicle-photography hero with left copy and a five-row category rail; an immediate white vehicle finder; a left catalogue rail and four-card product row; four image category tiles; a dark four-column service bar; a compact horizontal quotation band; three editorial resource cards; and the existing production footer.

All product cards use the real Cowinmotors product catalogue. The hero vehicle image is a purpose-made neutral automotive visual without product, certification, inventory, or brand claims. It is only a visual background; no product data or CTA has been fabricated.

## Required fidelity surfaces

- **Fonts and typography:** The hero uses a compact high-contrast display hierarchy, while finder controls, product metadata and source cards use the smaller operational typography of the selected board. Headlines, white-background card titles and action labels have explicit contrast tokens.
- **Spacing and layout rhythm:** The hero is one continuous `1fr / 290px` desktop layout instead of two disconnected cards. The finder, product grid, support bar and RFQ band use the source board's compact horizontal cadence. Mobile moves these regions into touch-safe stacks without horizontal overflow.
- **Colors and visual tokens:** Dark navy header/hero/support regions, white catalogue surface, steel dividers and Cowin blue action states map to the source. No unrelated page styles were changed.
- **Image quality and asset fidelity:** Catalogue cards use real product-library images. Category rail and tile images use those same real assets. The new hero background is a generated high-resolution editorial vehicle image without embedded text or logos.
- **Copy and content:** Real product name, brand/model/year and available reference data remain visible. There are no price, inventory, certification, delivery, factory, dealer or authorization claims.

## Interaction evidence

- The Products category drawer opened with five category menu items.
- Vehicle finder controls preserve their existing `/products` search submission route.
- Request Quote, product details, product inquiry, category, Buyer Guides and News links resolve to their existing routes.
- Mobile measurement: `body.scrollWidth = 390`, `body.clientWidth = 390`, `catalog-hero.scrollWidth = 390`, `catalog-hero.clientWidth = 390`.
- Mobile menu still includes `New Arrivals`, `Best Sellers`, `Buyer Guides`, `News` and `Blog` rather than removing those routes.
- Browser console error check returned no page errors.

## Comparison history

1. **P1 - previous homepage only used the selected design direction, not its actual layout.**
   - Evidence: its hero was split into independent copy/product panels, its product section used five cards, and its long sourcing/RFQ blocks did not appear in the source board.
   - Fix: rebuilt the homepage hierarchy around the source's full-width hero, five-row category rail, compact vehicle finder, left catalogue rail/four-card grid, category strip, service strip, compact quote band and editorial resources.
2. **P2 - header navigation wrapped and exposed the old homepage menu order.**
   - Fix: added a homepage-only `catalogMode` to `SiteNav`, keeping the existing category drawer but showing Products, New Arrivals, Best Sellers, Buyer Guides, News, Blog and Company as compact operational navigation.
3. **P2 - white-surface headings inherited light text from the earlier dark-home theme.**
   - Fix: scoped dark text tokens to finder, catalogue, RFQ and resources headings and rechecked the mobile finder and lower sections.

## Follow-up polish

- The WhatsApp contact button remains intentionally visible because it is an existing live support function. It overlaps the visual board in narrow captures but remains a purposeful service control rather than decorative content.

## Final result

final result: passed
