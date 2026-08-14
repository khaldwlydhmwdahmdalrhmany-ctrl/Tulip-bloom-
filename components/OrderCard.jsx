"use client";
import React, { useState } from "react";
import { Phone, MapPin, Clock, ChevronDown, Copy, Check, MessageCircle, Megaphone } from "lucide-react";
import { labelSource, labelMedium, isPaid } from "../lib/attribution.js";

const C = { navy: "#0C1C77", slate: "#4A5A63", line: "#E1ECE8", teal: "#00C6C7", offWhite: "#F6FAF9" };

const STATUS_STYLE = {
  "جديد":        { bg: "#EAF2FF", fg: "#1E4DB7" },
  "قيد التجهيز": { bg: "#FFF4E0", fg: "#8A6200" },
  "تم الشحن":    { bg: "#E6F7FF", fg: "#0A7490" },
  "مكتمل":       { bg: "#E7F7EF", fg: "#1B7A52" },
  "ملغي":        { bg: "#FDECEC", fg: "#B93030" },
};
const STATUSES = Object.keys(STATUS_STYLE);

export default function OrderCard({ order }) {
  const [status, setStatus] = useState(order.status || "جديد");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  let items = [];
  try { items = JSON.parse(order.itemsJson || "[]"); } catch {}

  const change = async (next) => {
    const prev = status;
    setStatus(next); setSaving(true); setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "فشل التحديث");
    } catch (e) { setStatus(prev); setError(e.message); }
    finally { setSaving(false); }
  };

  const copyRef = async () => {
    try { await navigator.clipboard.writeText(order.orderNumber); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const st = STATUS_STYLE[status] || STATUS_STYLE["جديد"];
  // طلب «اشترِ الآن»: بياناته تُستكمل في واتساب، فنميّزه لئلا يظن المسؤول أنه ناقص
  const isQuick = order.customerPhone === "بانتظار التأكيد";
  const date = order.createdAt ? new Date(order.createdAt).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" }) : "";
  const phoneDigits = String(order.customerPhone || "").replace(/\D/g, "");
  const wa = phoneDigits.startsWith("966") ? phoneDigits : `966${phoneDigits.replace(/^0/, "")}`;
  const paid = isPaid(order.medium);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      {/* الرأس */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex flex-col gap-1.5">
            {order.orderNumber && (
              <button onClick={copyRef} className="inline-flex items-center gap-1.5 w-fit text-[11px] font-bold px-2 py-1 rounded-md tracking-wide" dir="ltr"
                      style={{ background: "#EAF2FF", color: "#1E4DB7" }} title="نسخ رقم الطلب">
                {copied ? <Check size={11} /> : <Copy size={11} />} {order.orderNumber}
              </button>
            )}
            <span className="font-bold text-sm" style={{ color: C.navy }}>{order.customerName}</span>
            {isQuick && (
              <span className="inline-flex items-center gap-1 w-fit text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{ background: "#FFF4E0", color: "#8A6200" }}>
                ⚡ طلب سريع — البيانات تُستكمل عبر واتساب
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="font-display text-base leading-none" style={{ color: C.navy, fontWeight: 800 }}>
              {Number(order.total).toLocaleString("ar-SA")} <span className="text-[11px] font-normal">ر.س</span>
            </span>
            <select value={status} onChange={(e) => change(e.target.value)} disabled={saving} aria-label="حالة الطلب"
                    className="text-[11px] font-bold px-2.5 py-1.5 rounded-full outline-none cursor-pointer border-0 disabled:opacity-50"
                    style={{ background: st.bg, color: st.fg }}>
              {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
        </div>

        {/* بيانات العميل */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]" style={{ color: C.slate }}>
          {isQuick ? (
            <span className="flex items-center gap-1.5"><Phone size={12} /> {order.customerPhone}</span>
          ) : (
            <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1.5 hover:underline">
              <Phone size={12} /> <span dir="ltr">{order.customerPhone}</span>
            </a>
          )}
          {order.customerCity && <span className="flex items-center gap-1.5"><MapPin size={12} /> {order.customerCity}</span>}
          {date && <span className="flex items-center gap-1.5"><Clock size={12} /> {date}</span>}
        </div>

        {/* مصدر الطلب التسويقي */}
        {order.source && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded"
                  style={paid ? { background: "#FFF4E0", color: "#8A6200" } : { background: "#E7F7EF", color: "#1B7A52" }}>
              <Megaphone size={10} /> {labelSource(order.source)} · {labelMedium(order.medium)}
            </span>
            {order.campaign && (
              <span className="text-[10px] px-2 py-1 rounded" style={{ background: C.offWhite, color: C.slate }}>
                حملة: {order.campaign}
              </span>
            )}
          </div>
        )}

        {error && <p className="text-[11px] font-bold" style={{ color: "#B93030" }}>{error}</p>}

        {/* إجراءات */}
        <div className="flex gap-2">
          {!isQuick && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
               className="btn flex-1 py-2.5 text-[11px]" style={{ background: "#25D366", color: "#fff" }}>
              <MessageCircle size={13} /> مراسلة العميل
            </a>
          )}
          {items.length > 0 && (
            <button onClick={() => setOpen((v) => !v)} className="btn px-4 py-2.5 text-[11px]" style={{ background: C.offWhite, color: C.navy }}>
              <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              {items.length} منتج
            </button>
          )}
        </div>
      </div>

      {/* المنتجات */}
      {open && items.length > 0 && (
        <ul className="px-4 pb-4 flex flex-col gap-2" style={{ background: C.offWhite }}>
          {items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3 text-[11px] pt-2.5" style={{ color: C.slate }}>
              <span className="min-w-0 truncate">{it.name} <span className="font-bold">× {it.qty ?? 1}</span></span>
              <span className="font-bold shrink-0" style={{ color: C.navy }}>
                {Number(it.price ?? 0).toLocaleString("ar-SA")} ر.س
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
