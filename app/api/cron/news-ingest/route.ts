import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({ ok: false, disabled: true, reason: "News automation has been stopped." }, { status: 410 });
}

export const POST = GET;
