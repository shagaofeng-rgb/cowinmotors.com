import type { Metadata } from "next";

export type CategorySearchParams = {
  category?: string;
  make?: string;
  q?: string;
  year?: string;
  page?: string;
};

function cleanValue(value?: string) {
  return value?.trim() || "";
}

function normalizedPage(value?: string) {
  const parsed = Number.parseInt(cleanValue(value), 10);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1;
}

/** Builds the only query form emitted by a category page. */
export function categorySearchPath(basePath: string, params: CategorySearchParams) {
  const query = new URLSearchParams();
  const make = cleanValue(params.make);
  const search = cleanValue(params.q);
  const year = cleanValue(params.year);
  const page = normalizedPage(params.page);

  if (make) query.set("make", make);
  if (search) query.set("q", search);
  if (year) query.set("year", year);
  if (page > 1) query.set("page", String(page));

  const value = query.toString();
  return `${basePath}${value ? `?${value}` : ""}`;
}

export function shouldNormalizeCategorySearch(params: CategorySearchParams) {
  const rawPage = cleanValue(params.page);
  return Boolean(cleanValue(params.category)) || rawPage === "1" || (rawPage !== "" && normalizedPage(rawPage) === 1);
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
  const hasFilter = Boolean(cleanValue(params.make) || cleanValue(params.q) || cleanValue(params.year));
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

