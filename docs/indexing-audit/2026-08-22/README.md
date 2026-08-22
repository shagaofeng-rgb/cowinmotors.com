# Search Console Indexing Remediation Baseline

## Backup and rollback

- Git tag: `pre-gsc-indexing-remediation-20260822`
- Original sitemap response: `sitemap-before.xml`
- Original robots response: `robots-before.txt`
- Original catalog fingerprint and counts: `catalog-before.json`
- Product URL decision list: `product-indexing-decisions.csv`

To roll back the code changes, deploy the tagged revision. The catalog source data is not modified by this remediation.

## Confirmed findings

- The production site redirects the non-www host to `https://www.cowinmotors.com/`.
- Filter and quote parameter pages are intentionally `noindex, follow`.
- The main sitemap was listing 1,433 supported catalog products before remediation.
- The old title template produced 180 duplicate title groups covering 545 product URLs, even where the catalog titles contained differentiating references.
- Four wheel records contain a tracking-pixel URL instead of a product image and are no longer eligible for indexing or Product image schema.

## Indexing policy

Product records remain publicly accessible. A product is excluded from the sitemap and receives `noindex, follow` only when its record has no usable product image, lacks all distinguishing catalog evidence (a non-generic reference, side, material, size, color, or listed feature), or duplicates another record's public title and reference. This preserves product data while keeping low-information URLs out of the crawl queue.
