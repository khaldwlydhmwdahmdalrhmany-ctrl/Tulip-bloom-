import { NextResponse } from "next/server";
import { findCouponByCode, couponUsesBy } from "../../../../lib/marketingDb.js";
import { evaluateCoupon, computeTotals } from "../../../../lib/coupon.js";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";
import { getProducts } from "../../../../lib/queries.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * تحقّق فوري من كود الخصم — للعرض في السلة.
 *
 * ⚠️ نتيجته إعلامية فقط. مسار الطلبات يعيد التحقّق من الصفر
 * ولا يثق بأي مبلغ خصم قادم من المتصفح.
 */
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  if (!code) return NextResponse.json({ ok: false, error: "أدخل كود الخصم." }, { status: 400 });

  const coupon = await findCouponByCode(code);
  // رسالة موحّدة: لا نكشف أن الكود موجود لكنه منتهٍ أو مستنفد،
  // وإلا صار النموذج أداة لتخمين أكواد صالحة.
  if (!coupon) {
    return NextResponse.json({ ok: false, error: "هذا الكود غير صحيح." }, { status: 404 });
  }

  const me = await getCurrentCustomer().catch(() => null);
  const products = await getProducts();

  // أسعار المنتجات من القاعدة لا من العميل — العميل قد يرسل سعرًا مرتفعًا
  // ليتجاوز حدّ «أقل مبلغ للطلب».
  const items = (Array.isArray(body.items) ? body.items : [])
    .map((i) => {
      const p = products.find((x) => x.id === i.id);
      if (!p) return null;
      return { id: p.id, qty: Math.max(1, Number(i.qty) || 1), price: Number(p.price), categorySlug: p.categorySlug };
    })
    .filter(Boolean);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const uses = await couponUsesBy({ couponId: coupon.id, customerId: me?.id, phone: body.phone });
  const res = evaluateCoupon(coupon, { subtotal, items, customerUses: uses });

  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 422 });

  return NextResponse.json({
    ok: true,
    code: coupon.code,
    label: res.label,
    ...computeTotals({ subtotal, discount: res.discount, freeShipping: res.freeShipping }),
    freeShipping: res.freeShipping,
  });
}
