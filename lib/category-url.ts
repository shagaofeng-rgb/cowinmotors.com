import type { Metadata } from "next";

export type CategorySearchParams = {
  category?: string;
  make?: string;
  q?: string;
  year?: string;
  page?: string;
};

export function readCategorySearchParams(raw: Record<string, string | string[] | undefined>): CategorySearchParams {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim();
  return { category: first(raw.category), make: first(raw.make), q: first(raw.q), year: first(raw.year), page: first(raw.page) };
}

function cleanValue(value?: string) {
  return value?.trim() || "";
}

export function normalizedPage(value?: string) {
  const raw = cleanValue(value);
  const parsed = /^\d+$/.test(raw) ? Number(raw) : 1;
  return Number.isSafeInteger(parsed) && parsed > 1 ? parsed : 1;
}

/** Builds the only query form emitted by a category page. */
export function categorySearchPath(basePath: string, params: CategorySearchParams) {
  const query = new URLSearchParams();
  const make = cleanValue(params.make);
  const search = cleanValue(params.q);
  const year = cleanValue(params.year);
  const page = normalizedPage(params.page);

  if (basePath === "/products" && cleanValue(params.category)) query.set("category", cleanValue(params.category));
  if (make) query.set("make", make);
  if (search) query.set("q", search);
  if (year) query.set("year", year);
  if (page > 1) query.set("page", String(page));

  const value = query.toString();
  return `${basePath}${value ? `?${value}` : ""}`;
}

export function shouldNormalizeCategorySearch(params: CategorySearchParams, categoryInPath = true) {
  const rawPage = cleanValue(params.page);
  return (categoryInPath && Boolean(cleanValue(params.category))) || (rawPage !== "" && (normalizedPage(rawPage) === 1 || rawPage !== String(normalizedPage(rawPage))));
}

export function categoryPageMetadata({
  title,
  description,
  basePath,
  params,
}: {
  title: string;
  description: string;
  basePath: string;
  params: CategorySearchParams;
}): Metadata {
  const hasFilter = Boolean(cleanValue(params.make) || cleanValue(params.q) || cleanValue(params.year) || (basePath === "/products" && cleanValue(params.category)));
  const page = normalizedPage(params.page);

  return {
    title,
    description,
    // Filter result pages are useful to visitors but not standalone search landing pages.
    // Pagination remains self-canonical so crawlers can reach deeper catalog items.
    alternates: { canonical: hasFilter ? basePath : categorySearchPath(basePath, { page: String(page) }) },
    robots: hasFilter ? { index: false, follow: true } : undefined,
  };
}

