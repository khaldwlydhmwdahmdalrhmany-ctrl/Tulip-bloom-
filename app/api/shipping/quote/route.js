import { NextResponse } from "next/server";
import { quoteShipping } from "../../../../lib/shippingDb.js";
import { getProducts } from "../../../../lib/queries.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * خيارات الشحن لمدينة وسلة — عام (السلة تحتاجه قبل تسجيل الدخول).
 *
 * ⚠️ الأسعار تُقرأ من القاعدة لا من الطلب. العميل يرسل معرّفات
 * المنتجات فقط؛ إرسال الأسعار كان سيسمح برفع المجموع صناعيًا
 * لتجاوز حدّ الشحن المجاني.
 */
export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const products = await getProducts();

  const subtotal = (Array.isArray(b.items) ? b.items : []).reduce((sum, i) => {
    const p = products.find((x) => x.id === i.id);
    if (!p) return sum;
    return sum + Number(p.price) * Math.max(1, Number(i.qty) || 1);
  }, 0);

  const quote = await quoteShipping({ city: b.city || "", subtotal });
  return NextResponse.json({ ...quote, subtotal: Math.round(subtotal) });
}
