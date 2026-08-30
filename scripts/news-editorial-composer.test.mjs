import assert from "node:assert/strict";
import test from "node:test";
import { composeSourceBackedNews } from "../lib/news-editorial-composer.ts";

const site = {
  brandName: "Cowinmotors Automotive Parts",
  industry: "Automotive aftermarket parts sourcing and export",
  targetMarkets: ["US", "EU"],
  desiredWordCount: { min: 700, max: 1000 },
};

const candidate = {
  title: "New vehicle repair guidance highlights fitment and safety checks",
  summary: "The publisher reported new guidance for repair businesses reviewing vehicle parts and installation information.",
  sourceDomain: "example-authoritative-source.org",
  sourcePublishedAt: "2026-08-30T08:00:00.000Z",
  sourceAuthor: "Industry Desk",
};

test("built-in composer creates source-backed publishable News", () => {
  const article = composeSourceBackedNews(site, candidate, { productName: "Automotive lighting fitment" });
  const words = article.content.split(/\s+/).filter(Boolean).length;
  assert.ok(words >= 700 && words <= 1000, `unexpected word count: ${words}`);
  assert.match(article.content, /original publisher/i);
  assert.match(article.editorialNote, /independent editorial summary/i);
  assert.doesNotMatch(article.content, /request a quote|buy now|whatsapp|add to cart/i);
  assert.equal(article.category, "Body Kits & Repair");
});

test("built-in composer does not render source markup as code", () => {
  const article = composeSourceBackedNews(site, {
    ...candidate,
    summary: "<script>alert('x')</script> Verified repair guidance for buyers.",
  }, { productName: "Automotive lighting fitment" });
  assert.doesNotMatch(article.content, /<script>/i);
  assert.doesNotMatch(article.content, /<[^>]+>/);
});
