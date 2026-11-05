import type { Metadata } from "next";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { categoryPageMetadata, readCategorySearchParams } from "@/lib/category-url";

const basePath = "/tail-lights";
const baseMetadata = {
  title: "LED Tail Lights and Rear Lamp Assemblies by Fitment",
  description: "Browse catalog-listed tail light assemblies with side, connector, and vehicle-fitment confirmation before ordering.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return categoryPageMetadata({ ...baseMetadata, basePath, params: readCategorySearchParams(await searchParams) });
}

export default async function TailLightsPage({ searchParams }: Props) {
  return <CategoryShowcase category="tail-lights" params={readCategorySearchParams(await searchParams)} />;
}
