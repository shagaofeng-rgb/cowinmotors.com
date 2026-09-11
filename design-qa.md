# Homepage Catalog Redesign QA

## Comparison target

- **Source visual truth:** `/Users/apple/.codex/generated_images/019e9b6c-df7f-7fb3-89a2-27fd6d2b6fd8/exec-7e1a252b-fc87-40ac-9bd7-6aa72283c238.png` (Catalog Editorial, 1024 x 1536).
- **Implementation:** `http://127.0.0.1:3101/` in the Codex in-app browser.
- **Desktop state:** 1440 x 960 CSS viewport, default header state. The in-app screenshot was captured during this run; DOM sizing confirmed the homepage, hero and finder each measured 1440px with no horizontal overflow.
- **Mobile state:** 390 x 844 CSS viewport, default header state. DOM check confirmed `body.scrollWidth === 390`, `catalog-hero.scrollWidth === 390`, and no horizontal overflow.
- **Density normalization:** source is an ImageGen board rather than a browser viewport. The comparison used the same desktop catalogue/hero state and the same mobile content hierarchy; no browser chrome or device frame was included in the judgement.

## Full-view comparison

The implementation preserves the selected direction's defining sequence: dark operational header, light/dark hero with category index, immediate fitment bar, left category rail with product catalogue, service strip, sourcing process, RFQ panel, resources and footer. Product imagery and product details are intentionally supplied by the real Cowinmotors catalogue rather than invented images or product claims from the concept board.

Focused checks covered the header/hero, finder, catalogue cards, category drawer, request form, and the 390px mobile breakpoint.

## Required fidelity surfaces

- **Fonts and typography:** Strong display hierarchy is retained for the hero; catalogue labels and card metadata are compact but legible. Product titles clamp instead of extending card height.
- **Spacing and layout rhythm:** The desktop catalogue uses a fixed five-track product grid when available and collapses to three then two tracks at smaller widths. The mobile layout converts the hero index, finder, category rail and support strip into touch-safe single or two-column stacks.
- **Colors and visual tokens:** Scoped navy, steel, white and brand-blue tokens match the selected dark catalogue direction without altering other pages.
- **Image quality and asset fidelity:** Every product image comes from the existing product catalogue or the existing approved site asset pack. Images use `object-fit: contain` in catalogue contexts and `cover` only for the existing packaging-service image.
- **Copy and content:** Product title, brand/model/year, references, Blog and News cards are read from existing data. The homepage does not introduce price, inventory, certification, delivery-time or other unsupported claims.

## Interaction evidence

- Product category drawer: click opened the menu; five category menu items were visible.
- Vehicle finder: `Year` selected `2024` successfully.
- Finder submission: navigated to `/products?year=&make=&q=&category=` from the real form action.
- Mobile overflow: no horizontal overflow at 390px.
- Local database outage handling: the Blog/News preview uses a safe empty state when the local Neon connection is unavailable, while deployed environments continue to use published records. No fabricated resource cards are rendered.

## Comparison history

1. **P1 - local homepage could fail when the optional Blog/News query encountered a database connection error.**
   - Fix: changed the two homepage resource queries to `Promise.allSettled` and render the existing resource entrance as a real empty state when neither query is available.
   - Evidence after fix: homepage returned HTTP 200 in the local preview and all catalogue, finder and RFQ regions rendered.
2. **P2 - CSS used two non-portable `end` alignment values.**
   - Fix: replaced them with `flex-end`.
   - Evidence after fix: the homepage CSS compiled without the new Autoprefixer alignment warnings.

## Residual P3 polish

- The selected concept uses a full-width vehicle photograph in the hero. The production implementation uses the real catalogue headlight asset because the site must not substitute unverified imagery. This is an intentional content-accuracy deviation, not a layout mismatch.

## Final result

final result: passed
