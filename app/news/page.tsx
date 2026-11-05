import type { Metadata } from "next";
import { EditorialListing } from "@/components/Editorial";
import { normalizedPage } from "@/lib/category-url";
import { getNewsCategories, getPublishedNews } from "@/lib/news";
import { UI_ASSETS } from "@/lib/ui-assets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
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

export default async function NewsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category.trim().slice(0, 100) : "";
  const page = normalizedPage(typeof params.page === "string" ? params.page : undefined);
  const pageSize = 12;
  const articles = await getPublishedNews({ limit: pageSize, page, category });
  const categories = await getNewsCategories();
  return <EditorialListing section="news" articles={articles} topics={categories.map((item) => item.category)} activeTopic={category} page={page} pageSize={pageSize} />;
}
