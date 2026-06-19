import rawData from "../public/data/site-data.json";

export type Product = {
  __id: number;
  title: string;
  url: string;
  price?: string;
  compareAt?: string;
  status?: string;
  image?: string;
  localImage: string;
  category: string;
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
  if (product.category.includes("Exhaust")) return "exhaust";
  if (product.category.includes("Body")) return "body-kits";
  return "products";
}

export function byCategory(slug: string) {
  return products.filter((product) => categorySlug(product) === slug);
}
