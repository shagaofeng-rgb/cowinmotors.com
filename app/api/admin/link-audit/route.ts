import { requireAdminApi } from "@/lib/adminApi";
import { getLinkAuditReport } from "@/lib/linkStrategy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return Response.json(await getLinkAuditReport());
}
