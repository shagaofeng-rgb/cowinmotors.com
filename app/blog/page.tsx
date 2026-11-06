import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { EditorialListing } from "@/components/Editorial";
import { categorySearchPath, normalizedPage, readCategorySearchParams, shouldNormalizeCategorySearch } from "@/lib/category-url";
import { readPublicBlogPage } from "@/lib/public-editorial";
import { UI_ASSETS } from "@/lib/ui-assets";

export const dynamic = "force-dynamic";

const metadata: Metadata = {
  title: "Automotive Parts Blog and Buyer Guides",
  description: "Cowinmotors buyer guides for automotive parts sourcing, fitment preparation, global shipping, and aftermarket purchasing decisions.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "Automotive Parts Blog and Buyer Guides | Cowinmotors", description: "Practical automotive parts sourcing and fitment guidance for global B2B buyers.", url: "https://www.cowinmotors.com/blog", images: [UI_ASSETS.newsLighting] },
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const { page } = readCategorySearchParams(await searchParams);
  return { ...metadata, alternates: { canonical: categorySearchPath("/blog", { page }) } };
}

export default async function BlogPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = readCategorySearchParams(await searchParams);
  if (shouldNormalizeCategorySearch(params, false)) permanentRedirect(categorySearchPath("/blog", { page: params.page }));
  const page = normalizedPage(params.page);
  if (page > 10_000) notFound();
  const pageSize = 24;
  const articles = await readPublicBlogPage({ limit: pageSize + 1, offset: (page - 1) * pageSize });
  if (page > 1 && !articles.length) notFound();
  return <EditorialListing section="blog" articles={articles.slice(0, pageSize)} page={page} hasNext={articles.length > pageSize} />;
}
