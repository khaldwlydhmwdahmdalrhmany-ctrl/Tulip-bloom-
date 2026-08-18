import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";
import { ordersForCustomer } from "../../../../lib/customerDb.js";
import { C, formatPrice } from "../../../../lib/colors.js";
import ReorderButton from "../../../../components/site/ReorderButton.jsx";

export const dynamic = "force-dynamic";
export const metadata = { title: "طلباتي" };

const STATUS_TONE = {
  "جديد": C.warning, "قيد التجهيز": C.teal, "تم الشحن": C.navy,
  "مكتمل": C.success, "ملغي": C.danger,
};

export default async function OrdersPage() {
  const me = await getCurrentCustomer();
  if (!me) redirect("/account/login");
  const orders = await ordersForCustomer(me.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="eyebrow mb-2">سجلّك</span>
        <h1 className="h-section font-display" style={{ color: C.navy }}>طلباتي</h1>
      </div>

      {orders.length === 0 ? (
        <div className="p-10 rounded-2xl text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <p className="text-sm mb-5" style={{ color: C.slate }}>لم تطلب شيئًا بعد.</p>
          <Link href="/shop" className="btn px-6 py-3 text-sm" style={{ background: C.navy, color: "#fff" }}>
            تصفّح التشكيلة
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => {
            let items = [];
            try { items = JSON.parse(o.itemsJson || "[]"); } catch {}
            const tone = STATUS_TONE[o.status] || C.slate;
            return (
              <article key={o.id} className="rounded-2xl overflow-hidden"
                       style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                <div className="flex items-center justify-between gap-3 px-5 py-4"
                     style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <div className="min-w-0">
                    <p className="num text-sm font-bold" style={{ color: C.navy }}>
                      {o.orderNumber || o.id.slice(0, 8)}
                    </p>
                    <p className="num text-[11px]" style={{ color: C.slateLight }}>
                      {new Date(o.createdAt).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0"
                        style={{ background: `${tone}15`, color: tone }}>
                    {o.status}
                  </span>
                </div>

                <div className="px-5 py-4 flex flex-col gap-2">
                  {items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="min-w-0 truncate" style={{ color: C.slate }}>
                        {it.name} <span className="num opacity-60">× {it.qty}</span>
                      </span>
                      <span className="num shrink-0" style={{ color: C.navy }}>
                        {formatPrice(Number(it.price) * Number(it.qty))} ر.س
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 px-5 py-4"
                     style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.pearl }}>
                  <p className="num text-sm font-bold" style={{ color: C.navy }}>
                    الإجمالي {formatPrice(o.total)} ر.س
                  </p>
                  <ReorderButton items={items} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
