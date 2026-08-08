import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const source = JSON.parse(fs.readFileSync("public/data/site-data.json", "utf8"));
const output = path.join("docs", "cowinmotors-product-master-audit.md");
const publicWheel = (product) => {
  const text = `${product.title || ""} ${product.description || ""}`;
  if (product.category !== "Wheels") return true;
  if (/sticker|decal|lug nut|center cap|valve stem|tpms|hub centric|hub ring|assembly bolt|gloves|coin pouch|bracket adapter|trailer|caravan|\bRV\b|motorcycle|motorbike|\btire\b|\btyre\b/i.test(text)) return false;
  if (["AL13 Wheels", "BC Forged NA", "Brixton Forged", "HRE Wheels"].includes(product.brand || "")) return true;
  if (product.brand === "Vossen Wheels") return /\b(?:EVO|M-X|S17|S21|LC2|LC3|CG-|GNS-|VPS-|ML-[XR]|ERA-|HC-|RS\d|VFX-)\b|3-Piece|Vossen Forged/i.test(product.title || "");
  return /forg/i.test(text);
};
const category = (product) => product.category === "Automotive Lighting" ? "Headlights / Automotive Lighting" : product.category || "Uncategorized";
const pagePath = (product, index) => `/product/${product.slug || index}`;
const clean = (value) => String(value || "").replace(/[|\n\r]/g, " ").trim();
const completeness = (product) => {
  const fields = [product.localImage || product.image, product.brand, product.model, product.yearRange, ...(product.partNumbers || []), product.description];
  const known = fields.filter(Boolean).length;
  return known >= 6 ? "Complete" : known >= 3 ? "Incomplete" : "Missing";
};
const missing = (product) => {
  const fields = [];
  if (!(product.localImage || product.image)) fields.push("real product image");
  if (!product.yearRange) fields.push("year range");
  if (!product.partNumbers?.length) fields.push("SKU / OE reference");
  if (!product.material && ["Exhaust Systems", "Wheels", "Body Kits"].includes(product.category)) fields.push("material / construction");
  fields.push("vehicle configuration confirmation", "packaging requirements", "compliance requirement if applicable");
  return [...new Set(fields)].join(", ");
};
const risk = (product) => {
  const risks = ["third-party vehicle trademarks used for compatibility only"];
  if (!product.yearRange) risks.push("fitment range incomplete");
  if (!product.partNumbers?.length) risks.push("reference number unavailable");
  if (product.category === "Wheels") risks.push("PCD, offset, center bore, and load rating require confirmation");
  return risks.join("; ");
};
const keyword = (product) => {
  const bits = [product.brand, product.model, product.yearRange, product.productType || product.category].filter(Boolean).join(" ");
  const suffix = product.category === "Wheels" ? "forged wheels supplier" : "aftermarket auto parts sourcing";
  return `${bits} ${suffix}`.trim();
};

const rows = source.products.map((product, index) => ({ product, index, indexable: publicWheel(product) && Boolean(product.localImage || product.image) }));
const summary = {
  sourceRecords: rows.length,
  publicIndexableCandidates: rows.filter((row) => row.indexable).length,
  excludedForSafety: rows.filter((row) => !row.indexable).length,
  categories: Object.fromEntries(Object.entries(Object.groupBy(rows, (row) => category(row.product))).map(([name, records]) => [name, records.length])),
};

const lines = [
  "# Cowinmotors Product Master Audit",
  "",
  "Internal operational document. Do not publish this file on the website.",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Scope",
  `- Source product records scanned: ${summary.sourceRecords}`,
  `- Public indexable candidates: ${summary.publicIndexableCandidates}`,
  `- Excluded from public/indexable use: ${summary.excludedForSafety}`,
  `- Category distribution: ${Object.entries(summary.categories).map(([name, count]) => `${name} (${count})`).join(", ")}`,
  "",
  "## Audit Rules",
  "- Product URL preserves the current slug where present.",
  "- Indexability is a catalog-safety decision, not a statement of stock, authorization, certification, or product availability.",
  "- Third-party vehicle and wheel brand names indicate compatibility or catalog reference only.",
  "- Unknown specifications must be confirmed before quotation; they are not generated or inferred.",
  "",
  "## Product Records",
  "",
  "| Current Product URL | Current Product Name | Product Category | Brand / Compatibility Brand | Model / Platform | Year Range | SKU / OE Reference | Data Completeness | Indexable | Rewrite Needed | Real Data Still Needed | Keyword Direction | Content Risk |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
];

for (const { product, index, indexable } of rows) {
  lines.push(`| ${pagePath(product, index)} | ${clean(product.title)} | ${category(product)} | ${clean(product.brand)} | ${clean(product.model)} | ${clean(product.yearRange)} | ${clean((product.partNumbers || []).join(" / "))} | ${completeness(product)} | ${indexable ? "Yes" : "No"} | Yes | ${missing(product)} | ${keyword(product)} | ${risk(product)} |`);
}

lines.push("", "## Change Control", "- Use the product source file and original catalog assets as the evidence source for changes.", "- Add documents, packaging, installation material, and compliance evidence only after manual verification.", "- Review any existing title or description that implies original equipment, certification, availability, price, lead time, factory ownership, or authorization.");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${lines.join("\n")}\n`);
console.log(JSON.stringify({ output, ...summary, sha256: crypto.createHash("sha256").update(lines.join("\n")).digest("hex") }, null, 2));
