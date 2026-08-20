import { NextResponse } from "next/server";
import {
  saveGatewayConfig, listGatewayConfigs, maskGatewayConfigs,
  listPayments, setPaymentStatus, setOrderPayment,
} from "../../../../lib/paymentsDb.js";
import { GATEWAYS } from "../../../../lib/gateways.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** محمي عبر middleware — كل /api يتطلب جلسة مسؤول إلا القائمة البيضاء. */
export async function POST(request) {
  const b = await request.json().catch(() => ({}));

  try {
    if (b.action === "save-gateway") {
      if (!GATEWAYS[b.code]) return NextResponse.json({ error: "بوابة غير معروفة." }, { status: 400 });
      await saveGatewayConfig(b.code, b);
      // ⚠️ المقنّعة فقط — لا مفاتيح خام إلى المتصفح
      return NextResponse.json({ ok: true, gateways: maskGatewayConfigs(await listGatewayConfigs()) });
    }

    /**
     * تعليم الدفع يدويًا — للتحويل البنكي والدفع عند الاستلام.
     * ⚠️ إجراء إداري صريح لا تلقائي: المشغّل يؤكّد وصول المبلغ
     * بعد رؤية الإيصال أو استلام النقد.
     */
    if (b.action === "mark-paid") {
      if (!b.paymentId || !b.orderId) {
        return NextResponse.json({ error: "الدفعة والطلب مطلوبان." }, { status: 400 });
      }
      await setPaymentStatus(b.paymentId, "paid", { failureReason: null });
      await setOrderPayment(b.orderId, { paymentStatus: "paid" });
      return NextResponse.json({ ok: true, payments: await listPayments({ limit: 100 }) });
    }

    if (b.action === "mark-refunded") {
      await setPaymentStatus(b.paymentId, "refunded");
      await setOrderPayment(b.orderId, { paymentStatus: "refunded" });
      return NextResponse.json({ ok: true, payments: await listPayments({ limit: 100 }) });
    }

    return NextResponse.json({ error: "إجراء غير معروف." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "تعذّر التنفيذ." }, { status: 400 });
  }
}
