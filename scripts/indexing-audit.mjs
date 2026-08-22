import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const outputDirectory = path.join(root, "docs/indexing-audit/2026-08-22");
const source = JSON.parse(await fs.readFile(path.join(root, "public/data/site-data.json"), "utf8"));
const genericReferencePattern = /^(?:sjc|n\/a|na|unknown)$/i;
const productImagePattern = /\.(?:avif|gif|jpe?g|jfif|png|webp)(?:[?#].*)?$/i;
const csvValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function usableImage(product) {
  const image = String(product.localImage || "").trim();
  return Boolean(image) && !/facebook\.com\/tr\?/i.test(image) && productImagePattern.test(image);
}

function hasEvidence(product) {
  return (product.partNumbers || []).some((reference) => !genericReferencePattern.test(String(reference).trim())) || Boolean(
    product.side || product.material || product.size || product.color || (product.features || []).length,
  );
}

function supportedWheel(product) {
  if (product.category !== "Wheels") return true;
  const searchable = `${product.title || ""} ${product.description || ""}`;
  if (/sticker|decal|lug nut|center cap|valve stem|tpms|hub centric|hub ring|assembly bolt|gloves|coin pouch|bracket adapter/i.test(searchable)) return false;
  if (/trailer|caravan|\bRV\b|motorcycle|motorbike|\btire\b|\btyre\b/i.test(searchable)) return false;
  if (["AL13 Wheels", "BC Forged NA", "Brixton Forged", "HRE Wheels"].includes(product.brand || "")) return true;
  if (product.brand === "Vossen Wheels") return /\b(?:EVO|M-X|S17|S21|LC2|LC3|CG-|GNS-|VPS-|ML-[XR]|ERA-|HC-|RS\d|VFX-)\b|3-Piece|Vossen Forged/i.test(product.title || "");
  return /forg/i.test(searchable);
}

const supported = source.products.filter(supportedWheel);
const indexTitleCounts = supported.reduce((counts, product) => {
  const reference = (product.partNumbers || []).find((value) => value && !genericReferencePattern.test(String(value).trim()));
  const key = `${String(product.title || "").trim().toLowerCase()}|${String(reference || "").trim().toLowerCase()}`;
  counts.set(key, (counts.get(key) || 0) + 1);
  return counts;
}, new Map());
const rows = supported.map((product) => {
  const reference = (product.partNumbers || []).find((value) => value && !genericReferencePattern.test(String(value).trim()));
  const indexTitleKey = `${String(product.title || "").trim().toLowerCase()}|${String(reference || "").trim().toLowerCase()}`;
  const indexable = usableImage(product) && hasEvidence(product) && indexTitleCounts.get(indexTitleKey) === 1;
  const reason = !usableImage(product)
    ? "noindex: catalog image is missing or is not a product image"
    : !hasEvidence(product)
      ? "noindex: catalog record lacks a specific reference, side, material, size, color, or listed feature"
      : indexTitleCounts.get(indexTitleKey) !== 1
        ? "noindex: another catalog record has the same public title and reference"
        : "indexable: product has a usable catalog image and distinguishing product data";
  return {
    slug: product.slug,
    url: `https://www.cowinmotors.com/product/${product.slug}`,
    category: product.category,
    title: product.title,
    partNumbers: (product.partNumbers || []).join(" / "),
    indexable,
    reason,
  };
});

await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(
  path.join(outputDirectory, "product-indexing-decisions.csv"),
  [
    "slug,url,category,title,part_numbers,indexable,reason",
    ...rows.map((row) => [row.slug, row.url, row.category, row.title, row.partNumbers, row.indexable ? "yes" : "no", row.reason].map(csvValue).join(",")),
  ].join("\n"),
);

const summary = {
  generatedAt: new Date().toISOString(),
  supportedCatalogProducts: supported.length,
  indexableProducts: rows.filter((row) => row.indexable).length,
  noindexProducts: rows.filter((row) => !row.indexable).length,
  sourceFingerprint: crypto.createHash("sha256").update(JSON.stringify(source.products)).digest("hex"),
};
await fs.writeFile(path.join(outputDirectory, "product-indexing-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary));
