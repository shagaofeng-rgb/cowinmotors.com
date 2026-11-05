import type { Metadata } from "next";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { categoryPageMetadata, readCategorySearchParams } from "@/lib/category-url";

const basePath = "/exhaust";
const baseMetadata = {
  title: "Performance Exhaust Systems by Vehicle Fitment",
  description: "Browse catalog-listed exhaust systems with vehicle, engine, installation, and destination-requirement confirmation before ordering.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return categoryPageMetadata({ ...baseMetadata, basePath, params: readCategorySearchParams(await searchParams) });
}

export default async function ExhaustPage({ searchParams }: Props) {
  return <CategoryShowcase category="exhaust" params={readCategorySearchParams(await searchParams)} />;
}
