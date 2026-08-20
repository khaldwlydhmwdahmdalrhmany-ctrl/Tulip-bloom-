import { NextResponse } from "next/server";
import {
  listGatewayConfigs, getPaymentByRef, setPaymentStatus,
  setOrderPayment, recordEvent, listPayments,
} from "../../../../../lib/paymentsDb.js";
import { verifyWebhookSignature, normalizeEvent, GATEWAYS } from "../../../../../lib/gateways.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ═══════════════════════════════════════════════════════════
 *  مستقبل أحداث بوابات الدفع
 * ═══════════════════════════════════════════════════════════
 *
 *  هذا أخطر مسار في المتجر كله. عام بالضرورة — البوابة تستدعيه
 *  من خوادمها — ويملك صلاحية تعليم الطلب «مدفوعًا».
 *
 *  ثلاث حمايات، وإسقاط أي منها يعني بضاعة تُشحن بلا مقابل:
 *
 *   ١) التحقّق من التوقيع — بلا مفتاح صحيح لا يُقبل شيء
 *   ٢) منع التكرار — البوابة تعيد الإرسال حتى تتلقّى 200
 *   ٣) مطابقة المبلغ — الحدث الذي يخالف مبلغ الطلب يُرفض
 */
export async function POST(request, { params }) {
  const gateway = String(params.gateway || "");
  const def = GATEWAYS[gateway];
  if (!def) return NextResponse.json({ error: "unknown gateway" }, { status: 404 });

  // ⚠️ الجسم الخام إلزامي: التوقيع محسوب عليه حرفيًا، وإعادة
  // ترتيب المفاتيح بعد JSON.parse تُبطل المطابقة.
  const rawBody = await request.text();

  const configs = await listGatewayConfigs();
  const cfg = configs[gateway];

  const check = verifyWebhookSignature({
    gateway, rawBody, headers: request.headers, secret: cfg?.webhookSecret,
  });

  if (!check.ok) {
    // ⚠️ لا نكشف السبب في الرد — يساعد المهاجم على المحاولة
    console.warn(`[payments] رُفض webhook من ${gateway}: ${check.reason}`);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const evt = normalizeEvent(gateway, body);

  // ── منع التكرار ──
  const fresh = await recordEvent({
    gateway, eventId: evt.eventId, type: evt.type, payload: rawBody,
  });
  if (!fresh) {
    // مكرّر — نُرجع 200 حتى تتوقّف البوابة عن إعادة الإرسال
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // ── إيجاد عملية الدفع ──
  let payment = await getPaymentByRef(evt.providerRef);
  if (!payment && evt.orderRef) {
    const list = await listPayments({ orderId: evt.orderRef });
    payment = list[0] || null;
  }
  if (!payment) {
    // نقبل الحدث ولا نُفشل البوابة — لكن لا نغيّر شيئًا
    console.warn(`[payments] حدث بلا عملية مطابقة: ${gateway}/${evt.eventId}`);
    return NextResponse.json({ ok: true, unmatched: true });
  }

  // ── مطابقة المبلغ ──
  if (evt.status === "paid" && evt.amount > 0) {
    const expected = Number(payment.amount || 0);
    // البوابات ترسل المبلغ بالهللات أحيانًا — نقبل الصيغتين
    const matches =
      Math.abs(evt.amount - expected) < 1 ||
      Math.abs(evt.amount / 100 - expected) < 1;
    if (!matches) {
      await setPaymentStatus(payment.id, "failed", {
        failureReason: `مبلغ غير مطابق: ورد ${evt.amount} والمتوقّع ${expected}`,
        raw: rawBody,
      });
      console.warn(`[payments] مبلغ غير مطابق للدفعة ${payment.id}`);
      return NextResponse.json({ ok: true, mismatch: true });
    }
  }

  await setPaymentStatus(payment.id, evt.status, {
    providerRef: evt.providerRef || null,
    raw: rawBody,
    failureReason: evt.status === "failed" ? evt.type : null,
  });

  if (evt.status === "paid") {
    await setOrderPayment(payment.orderId, { paymentStatus: "paid" });
  } else if (evt.status === "refunded") {
    await setOrderPayment(payment.orderId, { paymentStatus: "refunded" });
  }

  return NextResponse.json({ ok: true });
}
