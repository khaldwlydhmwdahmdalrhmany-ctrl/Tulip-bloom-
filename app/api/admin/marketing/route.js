import { NextResponse } from "next/server";
import {
  createCoupon, updateCouponStatus, deleteCoupon,
  setCartStatus, createCampaign, deleteCampaign,
} from "../../../../lib/marketingDb.js";
import { normalizeCode } from "../../../../lib/coupon.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** محمي عبر middleware — كل /api يتطلب جلسة مسؤول إلا القائمة البيضاء. */
export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const { action } = b;

  try {
    if (action === "create-coupon") {
      const code = normalizeCode(b.code);
      if (!code || code.length < 3) {
        return NextResponse.json({ error: "الكود يجب ألا يقل عن ٣ أحرف." }, { status: 400 });
      }
      if (!["percent", "fixed", "free_shipping"].includes(b.type)) {
        return NextResponse.json({ error: "نوع الخصم غير معروف." }, { status: 400 });
      }
      const value = Number(b.value) || 0;
      if (b.type === "percent" && (value <= 0 || value > 90)) {
        // فوق ٩٠٪ يكاد يكون مجانيًا — غالبًا خطأ إدخال لا نيّة
        return NextResponse.json({ error: "النسبة يجب أن تكون بين ١ و٩٠." }, { status: 400 });
      }
      if (b.type === "fixed" && value <= 0) {
        return NextResponse.json({ error: "أدخل مبلغ خصم أكبر من صفر." }, { status: 400 });
      }
      const created = await createCoupon({ ...b, code, value });
      return NextResponse.json({ ok: true, coupon: created }, { status: 201 });
    }

    if (action === "toggle-coupon") {
      await updateCouponStatus(b.id, !!b.active);
      return NextResponse.json({ ok: true });
    }

    if (action === "delete-coupon") {
      await deleteCoupon(b.id);
      return NextResponse.json({ ok: true });
    }

    if (action === "cart-status") {
      if (!["open", "contacted", "recovered", "dismissed"].includes(b.status)) {
        return NextResponse.json({ error: "حالة غير معروفة." }, { status: 400 });
      }
      await setCartStatus(b.id, b.status);
      return NextResponse.json({ ok: true });
    }

    if (action === "create-campaign") {
      if (!b.name || !b.source || !b.campaign) {
        return NextResponse.json({ error: "الاسم والمصدر واسم الحملة مطلوبة." }, { status: 400 });
      }
      await createCampaign(b);
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    if (action === "delete-campaign") {
      await deleteCampaign(b.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "إجراء غير معروف." }, { status: 400 });
  } catch (err) {
    // رسالة عامة — تفاصيل الخطأ قد تكشف بنية القاعدة
    const duplicate = /unique|duplicate/i.test(err.message || "");
    return NextResponse.json(
      { error: duplicate ? "هذا الكود مستخدم بالفعل." : "تعذّر تنفيذ الإجراء." },
      { status: 400 }
    );
  }
}
