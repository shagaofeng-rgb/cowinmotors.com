import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { EditorialListing } from "@/components/Editorial";
import { categorySearchPath, normalizedPage, readCategorySearchParams, shouldNormalizeCategorySearch } from "@/lib/category-url";
import { readPublicNewsCategories, readPublicNewsPage } from "@/lib/public-editorial";
import { UI_ASSETS } from "@/lib/ui-assets";

export const dynamic = "force-dynamic";

const metadata: Metadata = {
  title: "Automotive Parts News and Buyer Insights",
  description:
    "Editorially reviewed automotive parts news, sourcing analysis, and fitment notes for global buyers.",
  alternates: { canonical: "/news" },
  openGraph: {
    title: "Automotive Parts News and Buyer Insights | Cowinmotors",
    description:
      "Read editorially reviewed automotive industry updates and sourcing analysis from Cowinmotors.",
    url: "https://www.cowinmotors.com/news",
    images: [UI_ASSETS.newsLighting],
  },
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const { page, category } = readCategorySearchParams(await searchParams);
  return { ...metadata, alternates: { canonical: category ? "/news" : categorySearchPath("/news", { page }) }, ...(category ? { robots: { index: false, follow: true } } : {}) };
}

export default async function NewsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = readCategorySearchParams(await searchParams);
  const category = params.category?.slice(0, 100) || "";
  const page = normalizedPage(params.page);
  if (shouldNormalizeCategorySearch(params, false)) {
    const query = new URLSearchParams();
    if (category) query.set("category", category);
    if (page > 1) query.set("page", String(page));
    permanentRedirect(`/news${query.size ? `?${query}` : ""}`);
  }
  const pageSize = 12;
  const categories = await readPublicNewsCategories();
  const matching = category ? categories.find((item) => item.category === category) : undefined;
  const total = category ? matching?.count || 0 : categories.reduce((count, item) => count + item.count, 0);
  if ((category && !matching) || (page > 1 && (page - 1) * pageSize >= total)) notFound();
  const articles = total ? await readPublicNewsPage({ limit: pageSize, page, category }) : [];
  return <EditorialListing section="news" articles={articles} topics={categories.map((item) => item.category)} activeTopic={category} page={page} hasNext={page * pageSize < total} />;
}
