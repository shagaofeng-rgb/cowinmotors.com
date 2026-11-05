import type { Metadata } from "next";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { categoryPageMetadata, readCategorySearchParams } from "@/lib/category-url";

const basePath = "/wheels";
const baseMetadata = {
  title: "Forged Automotive Wheels by Fitment",
  description: "Browse forged automotive wheels with diameter, PCD, offset, center bore, finish, and export quotation support.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return categoryPageMetadata({ ...baseMetadata, basePath, params: readCategorySearchParams(await searchParams) });
}

export default async function WheelsPage({ searchParams }: Props) {
  return <CategoryShowcase category="wheels" params={readCategorySearchParams(await searchParams)} />;
}
