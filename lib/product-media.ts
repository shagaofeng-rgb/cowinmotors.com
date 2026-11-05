import { hasUsableProductImage, products, type Product } from "@/lib/products";

function isCatalogPhoto(src: string) {
  return /^(?:\/assets\/(?:catalog|live)\/|https:\/\/)/i.test(src)
    && /\.(?:avif|gif|jpe?g|jfif|png|webp)(?:[?#].*)?$/i.test(src)
    && !/facebook\.com\/tr\?|[/_-](?:renders?|renderings?|cgi|placeholder|no[-_]?image)(?:[/_.-]|\d)/i.test(src);
}

function references(product: Product) {
  return (product.partNumbers || []).map((reference) => reference.toLowerCase().trim()).filter((reference) => /\d/.test(reference));
}

function samePart(first: Product, next: Product) {
  const key = (value?: string) => (value || "").trim().toLowerCase();
  if (key(first.category) !== key(next.category) || key(first.brand) !== key(next.brand)) return false;
  if (first.side && next.side && key(first.side) !== key(next.side)) return false;
  const firstRefs = references(first);
  const nextRefs = references(next);
  if (firstRefs.length && nextRefs.length) return firstRefs.some((reference) => nextRefs.includes(reference));
  return key(first.model || first.title) === key(next.model || next.title);
}

// Do not pass a shared image off as an exact SKU when catalog records disagree.
const ambiguousPhotos = new Set<string>();
const photoRecords = new Map<string, Product>();
for (const product of products) {
  if (!isCatalogPhoto(product.localImage)) continue;
  const previous = photoRecords.get(product.localImage);
  if (previous && !samePart(previous, product)) ambiguousPhotos.add(product.localImage);
  else if (!previous) photoRecords.set(product.localImage, product);
}

export function catalogProductPhotos(product: Product) {
  const gallery = Array.isArray(product.galleryImages) ? product.galleryImages : [];
  const primary = hasUsableProductImage(product) ? product.localImage : "";
  return [...new Set([primary, ...gallery].filter((src): src is string =>
    typeof src === "string" && isCatalogPhoto(src) && !ambiguousPhotos.has(src),
  ))];
}
