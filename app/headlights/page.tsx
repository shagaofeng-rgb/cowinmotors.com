import type { Metadata } from "next";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { categoryPageMetadata, readCategorySearchParams } from "@/lib/category-url";

const basePath = "/headlights";
const baseMetadata = {
  title: "Headlight Assemblies by Vehicle Fitment",
  description: "Browse catalog-listed headlight assemblies with vehicle-fitment inquiry support and configuration confirmation before ordering.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return categoryPageMetadata({ ...baseMetadata, basePath, params: readCategorySearchParams(await searchParams) });
}

export default async function HeadlightsPage({ searchParams }: Props) {
  return <CategoryShowcase category="headlights" params={readCategorySearchParams(await searchParams)} />;
}
