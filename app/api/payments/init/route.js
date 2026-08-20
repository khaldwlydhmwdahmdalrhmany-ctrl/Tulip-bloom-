import { NextResponse } from "next/server";
import { getOrderById } from "../../../../lib/db.js";
import {
  listGatewayConfigs, createPayment, setOrderPayment,
} from "../../../../lib/paymentsDb.js";
import { createCharge, GATEWAYS } from "../../../../lib/gateways.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * بدء عملية دفع لطلب قائم.
 *
 * ⚠️ المبلغ يُقرأ من الطلب في القاعدة لا من الطلب الوارد.
 * لو قبلنا مبلغًا من المتصفح لأمكن دفع ١ ريال لطلب بـ٥٠٠.
 */
export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const { orderId, gateway } = b;

  if (!orderId || !gateway) {
    return NextResponse.json({ error: "الطلب والبوابة مطلوبان." }, { status: 400 });
  }
  const def = GATEWAYS[gateway];
  if (!def) return NextResponse.json({ error: "بوابة غير معروفة." }, { status: 400 });

  const order = await getOrderById(orderId).catch(() => null);
  if (!order) return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });

  // الطلب المدفوع لا يُدفع مرتين
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ ok: true, alreadyPaid: true, status: "paid" });
  }

  const amount = Number(order.total || 0);
  if (amount <= 0) return NextResponse.json({ error: "مبلغ الطلب غير صالح." }, { status: 400 });

  const configs = await listGatewayConfigs();
  const cfg = configs[gateway];

  const res = await createCharge(gateway, cfg, {
    amount, currency: "SAR",
    orderId: order.id, orderNumber: order.orderNumber,
    customerName: order.customerName, customerPhone: order.customerPhone,
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.message || "تعذّر بدء الدفع.", reason: res.reason }, { status: 400 });
  }

  const paymentId = await createPayment({
    orderId: order.id, gateway, method: def.methods?.[0],
    amount, status: res.offline ? "pending" : "pending",
    providerRef: res.providerRef, redirectUrl: res.redirectUrl,
  });

  await setOrderPayment(order.id, {
    paymentStatus: "unpaid",
    paymentMethod: def.name,
  });

  return NextResponse.json({
    ok: true, paymentId, offline: !!res.offline,
    redirectUrl: res.redirectUrl || null,
    // بيانات التحويل البنكي تُعرض للعميل — ليست سرّية
    instructions: gateway === "bank_transfer" ? (cfg?.extraJson ? JSON.parse(cfg.extraJson) : {}) : undefined,
  });
}
