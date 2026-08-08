import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { requireAdminApi } from "@/lib/adminApi";
import { recordAuditLog } from "@/lib/adminData";
import { createManualNews, deleteManualNews, getNewsAdminSnapshot, updateManualNews } from "@/lib/news";
import { markSitemapDirty } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requestContext(request: Request) {
  return {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
    userAgent: request.headers.get("user-agent") || "",
  };
}

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return NextResponse.json(await getNewsAdminSnapshot());
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  try {
    const article = await createManualNews(await request.json());
    const session = await getAdminSession();
    await recordAuditLog({ actorEmail: session?.email || "", action: "news.create", resourceType: "news", resourceId: article.id, metadata: { slug: article.slug, status: article.status, indexable: article.indexable }, ...requestContext(request) });
    await markSitemapDirty("manual News article created");
    return NextResponse.json({ ok: true, article }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to create News article." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  try {
    const payload = await request.json() as Record<string, unknown> & { id?: string; title?: unknown; content?: unknown };
    if (!payload.id) return NextResponse.json({ ok: false, error: "Article ID is required." }, { status: 400 });
    const article = await updateManualNews(payload.id, payload);
    const session = await getAdminSession();
    await recordAuditLog({ actorEmail: session?.email || "", action: "news.update", resourceType: "news", resourceId: article.id, metadata: { slug: article.slug, status: article.status, indexable: article.indexable }, ...requestContext(request) });
    await markSitemapDirty("manual News article updated");
    return NextResponse.json({ ok: true, article });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to update News article." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await request.json() as { id?: string };
    if (!id) return NextResponse.json({ ok: false, error: "Article ID is required." }, { status: 400 });
    const deleted = await deleteManualNews(id);
    const session = await getAdminSession();
    await recordAuditLog({ actorEmail: session?.email || "", action: "news.delete", resourceType: "news", resourceId: id, metadata: { slug: deleted.slug }, ...requestContext(request) });
    await markSitemapDirty("manual News article deleted");
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to delete News article." }, { status: 400 });
  }
}
