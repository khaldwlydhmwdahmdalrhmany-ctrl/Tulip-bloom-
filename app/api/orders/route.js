import { NextResponse } from "next/server";
import { createOrder } from "../../../lib/db.js";
import { rateLimit, clientIp } from "../../../lib/rateLimit.js";
import { getCurrentCustomer } from "../../../lib/customerSession.js";
import { attachOrderToCustomer } from "../../../lib/customerDb.js";

export const dynamic = "force-dynamic";

const cap = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : null);

export async function POST(request) {
  // مسار عام — يحتاج حدًّا يمنع إغراق جدول الطلبات ببيانات وهمية
  const rl = rateLimit(`order:${clientIp(request)}`, { limit: 10, windowMs: 10 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "طلبات كثيرة خلال وقت قصير. حاول بعد قليل." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const { customerName, customerPhone, customerCity, items, total } = body;

  // طلب «اشترِ الآن»: يُسجَّل قبل أن يدخل العميل بياناته، فتُستكمل في واتساب.
  // بلا هذا الاستثناء يرفضه تحقّق رقم الجوال أدناه ويضيع الطلب صامتًا.
  const isQuickOrder = body.quickOrder === true;

  if (!customerName || !Array.isArray(items) || total === undefined) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }
  if (!isQuickOrder && !customerPhone) {
    return NextResponse.json({ error: "رقم الجوال مطلوب" }, { status: 400 });
  }

  // تحقّق من الحدود — يمنع حقل بطول ميغابايت أو سلة بألف عنصر
  if (items.length === 0 || items.length > 100) {
    return NextResponse.json({ error: "عدد المنتجات غير منطقي" }, { status: 400 });
  }
  const numTotal = Number(total);
  if (!Number.isFinite(numTotal) || numTotal < 0 || numTotal > 10_000_000) {
    return NextResponse.json({ error: "قيمة الطلب غير منطقية" }, { status: 400 });
  }
  // التحقّق من الجوال يسري على الطلبات العادية فقط
  if (!isQuickOrder && String(customerPhone).replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "رقم الجوال غير صحيح" }, { status: 400 });
  }

  try {
    const order = await createOrder({
      customerName: cap(customerName, 120),
      customerPhone: cap(customerPhone, 30),
      customerCity: cap(customerCity, 120),
      items: items.slice(0, 100).map((i) => ({
        id: cap(i.id, 64),
        name: cap(i.name, 200),
        qty: Math.max(1, Math.min(999, Number(i.qty) || 1)),
        price: Math.max(0, Number(i.price) || 0),
      })),
      total: numTotal,
      // بيانات الإسناد التسويقي — نصوص قصيرة فقط
      source: cap(body.source, 60),
      medium: cap(body.medium, 40),
      campaign: cap(body.campaign, 120),
      landingPath: cap(body.landingPath, 200),
    });

    /**
     * ⭐ ربط الطلب بحساب العميل إن كان مسجّلًا.
     *
     * لا يُشترط الحساب: الطلب كضيف يبقى صالحًا تمامًا وينجح كما
     * كان. الربط إضافة صامتة — فشلها لا يُفشل الطلب، لأن خسارة
     * سطر في سجلّ العميل أهون بكثير من خسارة الطلب نفسه.
     */
    try {
      const me = await getCurrentCustomer();
      if (me) await attachOrderToCustomer(order.id, me.id);
    } catch { /* الطلب نجح — الربط تفصيل ثانوي */ }

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("[orders] فشل إنشاء الطلب:", err.message);
    // لا نُعيد تفاصيل الخطأ للعميل — قد تكشف بنية القاعدة
    return NextResponse.json({ error: "تعذّر تسجيل الطلب، حاول مرة أخرى" }, { status: 500 });
  }
}
