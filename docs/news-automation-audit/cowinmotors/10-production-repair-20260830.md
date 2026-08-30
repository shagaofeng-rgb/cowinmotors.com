# News Automation Production Repair - 2026-08-30

## Confirmed root cause

Vercel invoked both News cron routes and received HTTP 200, but `NEWS_AUTOMATION_PRODUCTION_ENABLED` was not enabled. Both handlers returned a successful-looking skip before schema initialization, ingestion or publication. In addition, the publisher required an external composer URL and token, so enabling the switch alone would still have left the publication path unavailable when that adapter was absent.

## Repairs

- Production News automation now defaults to enabled for the approved Cowinmotors site. `NEWS_AUTOMATION_PRODUCTION_ENABLED=false` remains the explicit operational kill switch.
- Disabled jobs return a non-success result instead of a silent successful skip.
- Added a deterministic, source-backed 700-1,000 word editorial composer. A configured external composer remains the first choice; the built-in composer is used when the external service is absent or temporarily fails.
- Preserved paragraph boundaries and stripped markup before publication.
- Adjusted candidate scoring while retaining the configured score threshold of 70, and explicitly rejected personnel and promotional stories.
- Corrected the fallback-source window so approved fallback sources may use verified candidates up to seven days old.
- Fixed publication-run upsert identity, candidate release after failure, draft rollback after failed delivery checks and retry reuse of the same article.
- Added cache-busted frontend checks for News list, detail, News sitemap and RSS, plus an explicit Blog-isolation check.
- Added a mobile navigation overflow correction found during browser regression testing.

## Production data safety

- Baseline commit: `9bf14511b5614a1879c98c720ec95364b5e89b28`.
- Baseline tag: `pre-news-repair-20260830-9bf1451`.
- Pre-change News export: `/Users/apple/Documents/cowinmotors.com-backups/news-repair-20260830-194219/`.
- Vercel Production now explicitly contains `NEWS_AUTOMATION_PRODUCTION_ENABLED=true`; its value is non-secret and requires the new deployment to take effect.
- Existing News and Blog content was not deleted or overwritten.
- Schema changes were additive (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and indexes).

## Controlled production-chain evidence

At `2026-08-30T11:50:19Z`, primary ingestion completed against the production database and fetched 20 source records. No low-scoring primary item was allowed through.

At `2026-08-30T11:51:41Z`, the publisher used the approved fallback list and selected an `autobodynews.com` candidate with score 82. The built-in source-backed composer published exactly one article:

- Article ID: `1ebc456f-983b-47db-8f6a-1d9c55498ddd`
- Publication run: `e684a72c-8124-44e9-8298-fbf2408cdebb`
- Public URL: `https://www.cowinmotors.com/news/washington-adopts-final-claims-handling-rule-with-new-requirements-for-repair-facility-commu-87f5569f`
- Database state: `published`, `indexable=true`, `site_id=cowinmotors`
- Candidate state: `used`, linked to the article ID
- Delivery check: list 200, detail 200, News sitemap 200, RSS 200, Blog 200 and isolated

Browser checks at 1440px and 390px confirmed the title, nine body paragraphs, source panel, valid JSON-LD, no exposed markup and no console errors. The local mobile regression after the CSS patch confirmed `scrollWidth=clientWidth=390`.

## Verification commands

- `pnpm news:test`: 2/2 passed.
- `pnpm sitemap:test`: 9/9 passed.
- `pnpm catalog:test`: passed with 417 public forged-wheel records and 250 excluded records.
- `pnpm typecheck`: passed.
- `pnpm build`: passed; 1,461 static pages generated.

## Rollback

Set `NEWS_AUTOMATION_PRODUCTION_ENABLED=false` for an immediate stop, then redeploy the baseline tag. The controlled automated article can be changed to `draft` and `indexable=false` by its article ID without deleting it. Restore table data only from the dated export after reviewing row-level differences.
