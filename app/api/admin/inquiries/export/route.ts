import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { filterByQuery, getInquiries, recordAuditLog } from "@/lib/adminData";

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
  const inquiries = filterByQuery(await getInquiries(), q, (inquiry) => [
    inquiry.name,
    inquiry.email,
    inquiry.phone,
    inquiry.country,
    inquiry.productType,
    inquiry.product,
    inquiry.vehicleInfo,
    inquiry.quantity,
    inquiry.requirement,
    inquiry.source,
  ]);
  const headerList = await headers();
  await recordAuditLog({
    actorEmail: session.email,
    action: "export_inquiries_csv",
    resourceType: "inquiry",
    resourceId: q || "all",
    ip: headerList.get("x-forwarded-for") || "",
    userAgent: headerList.get("user-agent") || "",
    metadata: { count: inquiries.length, query: q },
  });

  const rows = [
    ["id", "createdAt", "name", "email", "phone", "country", "productType", "product", "vehicleInfo", "quantity", "requirement", "source"].map(csvCell).join(","),
    ...inquiries.map((inquiry) => [
      inquiry.id,
      inquiry.createdAt,
      inquiry.name,
      inquiry.email,
      inquiry.phone,
      inquiry.country,
      inquiry.productType,
      inquiry.product,
      inquiry.vehicleInfo,
      inquiry.quantity,
      inquiry.requirement,
      inquiry.source,
    ].map(csvCell).join(",")),
  ];

  return new Response(rows.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="cowinmotors-inquiries.csv"',
    },
  });
}
