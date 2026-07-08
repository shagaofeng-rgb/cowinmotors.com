import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { filterByQuery, getAdminProducts, recordAuditLog } from "@/lib/adminData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const products = filterByQuery(getAdminProducts(), q, (product) => [
    product.title,
    product.category,
    product.brand,
    product.model,
    product.yearRange,
    product.productType,
    product.partNumbers?.join(" "),
  ]);
  const headerList = await headers();
  await recordAuditLog({
    actorEmail: session.email,
    action: "export_products_csv",
    resourceType: "product",
    resourceId: q || "all",
    ip: headerList.get("x-forwarded-for") || "",
    userAgent: headerList.get("user-agent") || "",
    metadata: { count: products.length, query: q },
  });

  const rows = [
    ["id", "title", "category", "brand", "model", "yearRange", "productType", "price", "path", "image"].map(csvCell).join(","),
    ...products.map((product) => [
      product.__id,
      product.title,
      product.category,
      product.brand,
      product.model,
      product.yearRange,
      product.productType,
      product.price || "RFQ",
      product.path,
      product.localImage,
    ].map(csvCell).join(",")),
  ];

  return new Response(rows.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="cowinmotors-products.csv"',
    },
  });
}
