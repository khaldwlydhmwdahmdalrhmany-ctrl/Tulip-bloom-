"use client";
import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import OrderCard from "./OrderCard.jsx";

const C = { navy: "#0C1C77", slate: "#4A5A63", line: "#E1ECE8", teal: "#00C6C7" };

const TABS = ["الكل", "جديد", "قيد التجهيز", "تم الشحن", "مكتمل", "ملغي"];

export default function OrdersBoard({ orders = [] }) {
  const [tab, setTab] = useState("الكل");
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const c = { الكل: orders.length };
    for (const o of orders) {
      const k = o.status || "جديد";
      c[k] = (c[k] || 0) + 1;
    }
    return c;
  }, [orders]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab !== "الكل" && (o.status || "جديد") !== tab) return false;
      if (!term) return true;
      return `${o.orderNumber || ""} ${o.customerName} ${o.customerPhone} ${o.customerCity || ""}`
        .toLowerCase().includes(term);
    });
  }, [orders, tab, q]);

  if (orders.length === 0) {
    return (
      <p className="text-sm p-6 rounded-2xl text-center" style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.slate }}>
        لا توجد طلبات مسجّلة بعد.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3.5 pointer-events-none" color={C.teal} />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث برقم الطلب أو اسم العميل أو جواله…"
          className="w-full pr-10 pl-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ border: `1.5px solid ${C.line}`, background: "#fff" }}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {TABS.filter((t) => t === "الكل" || counts[t]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold transition-colors"
            style={tab === t ? { background: C.navy, color: "#fff" } : { background: "#fff", color: C.slate, border: `1px solid ${C.line}` }}>
            {t}
            <span className="text-[10px] px-1.5 rounded-full"
                  style={tab === t ? { background: "rgba(255,255,255,.22)" } : { background: "#F6FAF9" }}>
              {counts[t] || 0}
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm p-6 rounded-2xl text-center" style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.slate }}>
          لا طلبات مطابقة.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((o) => (<OrderCard key={o.id} order={o} />))}
        </div>
      )}
    </div>
  );
}
