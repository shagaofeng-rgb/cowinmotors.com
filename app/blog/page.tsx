import type { Metadata } from "next";
import { EditorialListing } from "@/components/Editorial";
import { normalizedPage } from "@/lib/category-url";
import { getPublishedBlogPosts } from "@/lib/blog";
import { UI_ASSETS } from "@/lib/ui-assets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Automotive Parts Blog and Buyer Guides",
  description: "Cowinmotors buyer guides for automotive parts sourcing, fitment preparation, global shipping, and aftermarket purchasing decisions.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "Automotive Parts Blog and Buyer Guides | Cowinmotors", description: "Practical automotive parts sourcing and fitment guidance for global B2B buyers.", url: "https://www.cowinmotors.com/blog", images: [UI_ASSETS.newsLighting] },
};

export default async function BlogPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = normalizedPage(typeof params.page === "string" ? params.page : undefined);
  const pageSize = 24;
  const articles = await getPublishedBlogPosts({ limit: pageSize, page });
  return <EditorialListing section="blog" articles={articles} page={page} pageSize={pageSize} />;
}
