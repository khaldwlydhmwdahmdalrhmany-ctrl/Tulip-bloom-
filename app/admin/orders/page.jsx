import React from "react";
import { ShoppingBag, Wallet, Clock } from "lucide-react";
import { getOrders } from "../../../lib/db.js";
import OrdersBoard from "../../../components/OrdersBoard.jsx";

const C = { navy: "#0C1C77", slate: "#4A5A63", line: "#E1ECE8", teal: "#00C6C7", success: "#1B9C68" };

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  const total = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const fresh = orders.filter((o) => (o.status || "جديد") === "جديد").length;

  const stats = [
    { icon: ShoppingBag, label: "إجمالي الطلبات", value: orders.length, color: C.navy },
    { icon: Clock, label: "بانتظار المعالجة", value: fresh, color: "#E08A1E" },
    { icon: Wallet, label: "قيمة الطلبات", value: `${Math.round(total).toLocaleString("ar-SA")} ر.س`, color: C.success },
  ];

  return (
    <div>
      <h1 className="font-display text-xl mb-1" style={{ color: C.navy, fontWeight: 800 }}>الطلبات</h1>
      <p className="text-xs mb-5" style={{ color: C.slate }}>
        تُسجَّل تلقائيًا عند إتمام أي عملية من السلة، قبل التحويل إلى واتساب.
      </p>

      {orders.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {stats.map((s, i) => (
            <div key={i} className="p-3.5 rounded-2xl flex flex-col gap-1.5" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon size={14} color={s.color} strokeWidth={2} />
              </span>
              <span className="text-[10px] font-bold leading-tight" style={{ color: C.slate }}>{s.label}</span>
              <span className="font-display text-lg leading-none" style={{ color: C.navy, fontWeight: 800 }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      <OrdersBoard orders={orders} />
    </div>
  );
}
