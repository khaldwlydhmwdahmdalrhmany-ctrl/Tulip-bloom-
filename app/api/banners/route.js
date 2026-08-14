import { NextResponse } from "next/server";
import { getBanners, createBanner } from "../../../lib/db.js";
import { invalidateBanners } from "../../../lib/cache.js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement");
  invalidateBanners();
  return NextResponse.json(await getBanners({ placement: placement || undefined }));
}

export async function POST(request) {
  const body = await request.json();
  if (!body.title || !body.placement) {
    return NextResponse.json({ error: "العنوان ومكان العرض مطلوبان" }, { status: 400 });
  }
  const banner = await createBanner(body);
  invalidateBanners();
  return NextResponse.json(banner, { status: 201 });
}
