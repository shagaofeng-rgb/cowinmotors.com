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

export const products: Product[] = rawData.products.map((product, index) => ({
  ...product,
  __id: index,
  localImage: `/${product.localImage}`,
}));

export function inferBuyingPath(product: Product) {
  const title = product.title.toLowerCase();
  if (
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
  return "products";
}

export function byCategory(slug: string) {
  return products.filter((product) => categorySlug(product) === slug);
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
