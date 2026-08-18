import { NextResponse } from "next/server";
import { upsertAbandonedCart } from "../../../../lib/marketingDb.js";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * تسجيل سلة مفتوحة.
 *
 * ⚠️ لا يرمي أبدًا ويُرجع 200 دائمًا: هذا مسار تسويقي، وفشله
 * يجب ألا يظهر للعميل ولا يعطّل سلته.
 */
export async function POST(request) {
  try {
    const b = await request.json().catch(() => ({}));
    if (!b.sessionId || !Array.isArray(b.items) || b.items.length === 0) {
      return NextResponse.json({ ok: true });
    }
    const me = await getCurrentCustomer().catch(() => null);
    await upsertAbandonedCart({
      sessionId: String(b.sessionId).slice(0, 64),
      customerId: me?.id || null,
      items: b.items.slice(0, 50).map((i) => ({
        id: String(i.id || "").slice(0, 64),
        name: String(i.name || "").slice(0, 200),
        qty: Math.max(1, Number(i.qty) || 1),
        price: Math.max(0, Number(i.price) || 0),
      })),
      total: Math.max(0, Number(b.total) || 0),
      contactName: b.name ? String(b.name).slice(0, 120) : null,
      contactPhone: b.phone ? String(b.phone).slice(0, 30) : null,
      source: b.source ? String(b.source).slice(0, 60) : null,
      campaign: b.campaign ? String(b.campaign).slice(0, 120) : null,
    });
  } catch { /* صامت بالكامل */ }
  return NextResponse.json({ ok: true });
}
