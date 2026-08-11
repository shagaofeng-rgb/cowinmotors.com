import crypto from "node:crypto";
import { NextResponse } from "next/server";
import {
  hasCompleteBlogWebhookArticle,
  isSupportedBlogClassId,
  publishBlogWebhookArticle,
  recordBlogPublicationEvent,
  validateBlogWebhookInput,
} from "@/lib/blog";
import { markSitemapDirty } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(code: 0 | 1, msg: string, status = 200) {
  return NextResponse.json({ code, msg }, { status });
}

function secureEquals(provided: string, expected: string) {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const apiKey = process.env.WEBHOOK_ARTICLE_SIGN || "";
  if (!apiKey) {
    await recordBlogPublicationEvent({ status: "failed", detail: "Webhook rejected because WEBHOOK_ARTICLE_SIGN is not configured." }).catch(() => undefined);
    return response(0, "Blog publishing is not configured.", 503);
  }

  try {
    const formData = await request.formData();
    const sign = String(formData.get("sign") || "");
    if (!secureEquals(sign, apiKey)) {
      await recordBlogPublicationEvent({ status: "failed", detail: "Webhook authentication rejected." }).catch(() => undefined);
      return response(0, "Invalid API key.", 401);
    }
    const payload = {
      class_id: formData.get("class_id"),
      title: formData.get("title"),
      content: formData.get("content"),
      author_id: formData.get("author_id"),
      image_url: formData.get("image_url"),
    };
    if (!isSupportedBlogClassId(payload.class_id)) return response(0, "Unsupported class_id. Use blog.", 400);
    if (!hasCompleteBlogWebhookArticle(payload)) return response(1, "验证成功");

    const validated = validateBlogWebhookInput(payload);
    if (!validated.input) return response(0, validated.error || "Invalid article data.", 400);
    const result = await publishBlogWebhookArticle(validated.input);
    await markSitemapDirty("Blog article published through signed webhook");
    await recordBlogPublicationEvent({
      status: "success",
      articleId: result.article.id,
      fingerprint: result.fingerprint,
      detail: result.created ? "Article published." : "Existing article updated without creating a duplicate.",
    }).catch(() => undefined);
    return response(1, "发布成功");
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Article could not be published.";
    await recordBlogPublicationEvent({ status: "failed", detail }).catch(() => undefined);
    console.error("Blog webhook publishing failed", detail);
    return response(0, "Article could not be published. Please retry.", 500);
  }
}

export async function GET() {
  return response(0, "Use POST with application/x-www-form-urlencoded article fields.", 405);
}
