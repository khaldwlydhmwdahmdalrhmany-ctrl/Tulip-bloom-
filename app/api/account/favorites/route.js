import { NextResponse } from "next/server";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";
import { listFavoriteIds, toggleFavorite, removeFavorite } from "../../../../lib/customerDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * الزائر غير المسجّل يحصل على قائمة فارغة و`auth:false` بدل 401.
 * السبب: هذا المسار يُستدعى في كل تحميل صفحة لملء أزرار القلب،
 * و401 المتكرّر يملأ سجلّات الأخطاء بضجيج ليس خطأً فعليًا.
 */
export async function GET() {
  const me = await getCurrentCustomer();
  if (!me) return NextResponse.json({ auth: false, favorites: [] });
  return NextResponse.json({ auth: true, favorites: await listFavoriteIds(me.id) });
}

export async function POST(request) {
  const me = await getCurrentCustomer();
  if (!me) return NextResponse.json({ error: "سجّل الدخول لحفظ المفضّلة.", auth: false }, { status: 401 });

  const { productId } = await request.json().catch(() => ({}));
  if (!productId) return NextResponse.json({ error: "معرّف المنتج مطلوب." }, { status: 400 });

  const on = await toggleFavorite(me.id, String(productId).slice(0, 64));
  return NextResponse.json({ auth: true, on, favorites: await listFavoriteIds(me.id) });
}

export async function DELETE(request) {
  const me = await getCurrentCustomer();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (id) await removeFavorite(me.id, id);
  return NextResponse.json({ favorites: await listFavoriteIds(me.id) });
}
