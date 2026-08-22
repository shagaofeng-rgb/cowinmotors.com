import rawData from "../public/data/site-data.json";

export type Product = {
  __id: number;
  id?: string;
  slug?: string;
  title: string;
  url?: string;
  price?: string;
  compareAt?: string;
  status?: string;
  image?: string;
  localImage: string;
  category: string;
  brand?: string;
  model?: string;
  yearRange?: string;
  productType?: string;
  partNumbers?: string[];
  side?: string;
  material?: string;
  moq?: string;
  description?: string;
  features?: string[];
  source?: string;
  rawSourceName?: string;
  [key: string]: unknown;
};

const trustedForgedWheelBrands = new Set(["AL13 Wheels", "BC Forged NA", "Brixton Forged", "HRE Wheels"]);
const wheelAccessoryTerms = /sticker|decal|lug nut|center cap|valve stem|tpms|hub centric|hub ring|assembly bolt|gloves|coin pouch|bracket adapter/i;
const unsupportedWheelUseTerms = /trailer|caravan|\bRV\b|motorcycle|motorbike|\btire\b|\btyre\b/i;
const verifiedVossenForgedSeries = /\b(?:EVO|M-X|S17|S21|LC2|LC3|CG-|GNS-|VPS-|ML-[XR]|ERA-|HC-|RS\d|VFX-)\b|3-Piece|Vossen Forged/i;

function isSupportedCatalogProduct(product: (typeof rawData.products)[number]) {
  if (product.category !== "Wheels") return true;
  const searchable = `${product.title || ""} ${product.description || ""}`;
  if (wheelAccessoryTerms.test(searchable) || unsupportedWheelUseTerms.test(searchable)) return false;
  if (trustedForgedWheelBrands.has(product.brand || "")) return true;
  if (product.brand === "Vossen Wheels") return verifiedVossenForgedSeries.test(product.title || "");
  return /forg/i.test(searchable);
}

export const products: Product[] = rawData.products.filter(isSupportedCatalogProduct).map((product, index) => ({
  ...product,
  __id: index,
  localImage:
    String(product.localImage || "").startsWith("http") || String(product.localImage || "").startsWith("/")
      ? String(product.localImage || "")
      : `/${product.localImage}`,
}));

const genericReferencePattern = /^(?:sjc|n\/a|na|unknown)$/i;
const productImagePattern = /\.(?:avif|gif|jpe?g|jfif|png|webp)(?:[?#].*)?$/i;

function productIndexTitleKey(product: Product) {
  const title = product.title.trim().toLowerCase();
  const reference = (product.partNumbers || []).find((value) => value && !genericReferencePattern.test(value.trim()));
  return `${title}|${reference?.trim().toLowerCase() || ""}`;
}

const productIndexTitleCounts = products.reduce((counts, product) => {
  const key = productIndexTitleKey(product);
  counts.set(key, (counts.get(key) || 0) + 1);
  return counts;
}, new Map<string, number>());

/** Only catalog images are eligible for indexable product pages and structured data. */
export function hasUsableProductImage(product: Product) {
  const image = String(product.localImage || "").trim();
  return Boolean(image) && !/facebook\.com\/tr\?/i.test(image) && productImagePattern.test(image);
}

export function hasProductIndexingEvidence(product: Product) {
  const hasReference = (product.partNumbers || []).some((reference) => !genericReferencePattern.test(String(reference).trim()));
  const hasSpecificAttribute = Boolean(
    product.side ||
      product.material ||
      product.size ||
      product.color ||
      (product.features || []).length ||
      hasReference,
  );
  return Boolean(product.title?.trim() && product.brand?.trim() && product.model?.trim() && hasSpecificAttribute);
}

/**
 * Keep a page indexable only when its catalog record has a genuine image and
 * enough product-specific information for a buyer to distinguish it.
 */
export function isProductIndexable(product: Product) {
  return hasUsableProductImage(product) && hasProductIndexingEvidence(product) && productIndexTitleCounts.get(productIndexTitleKey(product)) === 1;
}

export function inferBuyingPath(product: Product) {
  const title = product.title.toLowerCase();
  if (
    product.category.includes("Wheel") ||
    title.includes("body") ||
    title.includes("kit") ||
    title.includes("paint") ||
    title.includes("titanium") ||
    title.includes("wholesale")
  ) {
    return "RFQ";
  }
  return "Direct / RFQ";
}

export function categorySlug(product: Product) {
  if (product.category.includes("Lighting")) return "headlights";
  if (product.category.includes("Tail")) return "tail-lights";
  if (product.category.includes("Exhaust")) return "exhaust";
  if (product.category.includes("Body")) return "body-kits";
  if (product.category.includes("Wheel")) return "wheels";
  return "products";
}

export function byCategory(slug: string) {
  return products.filter((product) => categorySlug(product) === slug);
}

export function categoryHeroImage(slug: string, fallback = "") {
  return byCategory(slug).find((product) => product.localImage)?.localImage || fallback;
}

export function productPath(product: Product) {
  return `/product/${product.slug || product.__id}`;
}

export function findProduct(id: string) {
  return products.find((product) => String(product.__id) === id || product.slug === id || product.id === id);
}

export const productBrands = [...new Set(products.map((product) => product.brand).filter(Boolean) as string[])].sort();

export const productCategoryOptions = [
  { slug: "headlights", label: "Headlights" },
  { slug: "tail-lights", label: "Tail Lights" },
  { slug: "exhaust", label: "Exhaust Systems" },
  { slug: "body-kits", label: "Body Kits" },
  { slug: "wheels", label: "Wheels" },
];

export function filterProducts({
  category = "",
  brand = "",
  query = "",
}: {
  category?: string;
  brand?: string;
  query?: string;
}) {
  const q = query.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  const b = brand.trim().toLowerCase();

  return products.filter((product) => {
    if (category && categorySlug(product) !== category) return false;
    if (b && b !== "all" && String(product.brand || "").toLowerCase() !== b) return false;
    if (!terms.length) return true;
    const haystack = [
      product.title,
      product.brand,
      product.model,
      product.yearRange,
      product.productType,
      product.category,
      product.description,
      ...(product.features || []),
      ...(product.partNumbers || []),
    ].join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export function paginateProducts(list: Product[], page = 1, pageSize = 25) {
  const safePage = Math.max(1, Number.isFinite(page) ? page : 1);
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    total: list.length,
    currentPage,
    totalPages,
    pageSize,
  };
}

export function productCardData(list: Product[]) {
  return list.map((product) => ({
    __id: product.__id,
    slug: product.slug,
    title: product.title,
    url: product.url,
    price: product.price,
    compareAt: product.compareAt,
    status: product.status,
    localImage: product.localImage,
    category: product.category,
    brand: product.brand,
    model: product.model,
    yearRange: product.yearRange,
    productType: product.productType,
    partNumbers: product.partNumbers,
    side: product.side,
    material: product.material,
    moq: product.moq,
    description: product.description,
    features: product.features,
  }));
}
