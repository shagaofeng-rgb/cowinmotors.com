import { NextResponse } from "next/server";
import { saveInquiry } from "@/lib/adminData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value || "").trim().slice(0, 2000);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = clean(body.name);
  const email = clean(body.email);

  if (!name || !email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Name and email are required." }, { status: 400 });
  }

  const inquiry = saveInquiry({
    name,
    email,
    country: clean(body.country),
    productType: clean(body.productType),
    product: clean(body.product),
    vehicleInfo: clean(body.vehicleInfo),
    quantity: clean(body.quantity),
    requirement: clean(body.requirement),
  });

  return NextResponse.json({ ok: true, id: inquiry.id });
}
