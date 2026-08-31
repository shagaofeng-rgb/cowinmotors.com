import assert from "node:assert/strict";
import test from "node:test";
import { validateBlogIndustryScope } from "../lib/blog-industry-scope.ts";

test("accepts an automotive fitment buyer guide", () => {
  const result = validateBlogIndustryScope(
    "How to Confirm LED Headlight Fitment Before Ordering",
    "Automotive headlight fitment requires buyers to confirm the vehicle year, model, market version, LHD or RHD configuration, connector, and OE number before ordering replacement auto parts.",
  );
  assert.equal(result.ok, true);
  assert.equal(result.error, "");
});

test("rejects adjacent industries not supplied by Cowinmotors", () => {
  const result = validateBlogIndustryScope(
    "Evaluating Electric Bicycle Manufacturers",
    "This guide compares electric bicycle suppliers, batteries, and warranty support.",
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /outside.*automotive-parts scope/i);
});

test("rejects generic B2B content without an automotive-parts focus", () => {
  const result = validateBlogIndustryScope(
    "How to Evaluate a Global Supplier",
    "Compare pricing, communication, lead times, packaging, and general after-sales support.",
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /automotive-parts.*vehicle-fitment focus/i);
});
