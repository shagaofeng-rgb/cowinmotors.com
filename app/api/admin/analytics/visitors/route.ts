import { analyticsResponse } from "@/lib/adminApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return analyticsResponse((snapshot) => snapshot.visitors, request);
}
