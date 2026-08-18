"use client";
import React, { useState, useMemo } from "react";
import { Search, Ban, CheckCircle2, KeyRound, Copy, Mail, Phone, ShoppingBag } from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };
const n = (v) => Number(v || 0).toLocaleString("ar-SA");

export default function CustomersBoard({ customers: initial = [] }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  const [resetLink, setResetLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((c) =>
      c.email.toLowerCase().includes(s) ||
      c.name.toLowerCase().includes(s) ||
      (c.phone || "").includes(s)
    );
  }, [rows, q]);

  const totals = useMemo(() => ({
    all: rows.length,
    blocked: rows.filter((c) => c.status === "blocked").length,
    repeat: rows.filter((c) => c.orderCount > 1).length,
    ltv: rows.reduce((s, c) => s + c.lifetimeValue, 0),
  }), [rows]);

  const act = async (customerId, action) => {
    setBusy(customerId + action);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, customerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      if (action === "reset-link") { setResetLink(data.url); setCopied(false); return; }
      setRows((r) => r.map((c) => (c.id === customerId ? { ...c, status: data.status } : c)));
    } finally { setBusy(""); }
  };

  const card = { background: "#fff", border: `1px solid ${T.line}` };

  return (
    <div className="flex flex-col gap-5">
      {/* إحصاءات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: "إجمالي الحسابات", v: n(totals.all) },
          { l: "عملاء متكرّرون", v: n(totals.repeat) },
          { l: "قيمة الشراء الكلية", v: `${n(totals.ltv)} ر.س` },
          { l: "حسابات موقوفة", v: n(totals.blocked) },
        ].map((s) => (
          <div key={s.l} className="p-4 rounded-2xl" style={{ background: T.softTint, border: `1px solid ${T.line}` }}>
            <p className="text-[11px] font-bold mb-1.5" style={{ color: T.muted }}>{s.l}</p>
            <p className="text-xl leading-none" style={{ color: T.primary, ...H }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* رابط إعادة التعيين */}
      {resetLink && (
        <div className="p-4 rounded-2xl flex flex-col gap-3" style={{ background: `${T.warning}12`, border: `1px solid ${T.warning}44` }}>
          <p className="text-xs font-bold" style={{ color: T.ink }}>
            رابط إعادة تعيين صالح ٦٠ دقيقة ومرة واحدة — أرسله للعميل على واتساب.
          </p>
          <div className="flex gap-2">
            <input readOnly value={resetLink} dir="ltr"
                   className="flex-1 px-3 py-2.5 rounded-xl text-[11px]"
                   style={{ border: `1px solid ${T.line}`, background: "#fff" }} />
            <button onClick={() => { navigator.clipboard?.writeText(resetLink); setCopied(true); }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    style={{ background: copied ? T.success : T.primary, color: "#fff" }}>
              <Copy size={13} /> {copied ? "نُسخ" : "نسخ"}
            </button>
            <button onClick={() => setResetLink(null)} className="px-3 py-2.5 rounded-xl text-xs" style={{ color: T.muted }}>
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* بحث */}
      <div className="relative">
        <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none" color={T.mutedLight} />
        <input value={q} onChange={(e) => setQ(e.target.value)}
               placeholder="ابحث بالبريد أو الاسم أو الجوال…"
               className="w-full pr-11 pl-4 py-3 rounded-xl text-sm outline-none"
               style={{ border: `1px solid ${T.line}`, background: "#fff" }} />
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 rounded-2xl text-center" style={card}>
          <p className="text-sm" style={{ color: T.muted }}>
            {rows.length === 0 ? "لا حسابات مسجّلة بعد." : "لا نتائج مطابقة."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((c) => {
            const blocked = c.status === "blocked";
            return (
              <div key={c.id} className="p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4"
                   style={{ ...card, opacity: blocked ? .65 : 1 }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold" style={{ color: T.primary }}>{c.name || "بلا اسم"}</p>
                    {blocked && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: T.danger, color: "#fff" }}>موقوف</span>
                    )}
                    {c.marketingOptIn && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${T.success}18`, color: T.success }}>يقبل التسويق</span>
                    )}
                  </div>
                  <p className="text-[11px] flex items-center gap-1.5" dir="ltr" style={{ color: T.muted, justifyContent: "flex-end" }}>
                    <span>{c.email}</span> <Mail size={11} />
                  </p>
                  {c.phone && (
                    <p className="text-[11px] flex items-center gap-1.5 justify-end" dir="ltr" style={{ color: T.muted }}>
                      <span>{c.phone}</span> <Phone size={11} />
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] font-bold mb-0.5" style={{ color: T.mutedLight }}>الطلبات</p>
                    <p className="text-base leading-none" style={{ color: T.primary, ...H }}>{n(c.orderCount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold mb-0.5" style={{ color: T.mutedLight }}>قيمة الشراء</p>
                    <p className="text-base leading-none" style={{ color: T.primary, ...H }}>{n(c.lifetimeValue)}</p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button onClick={() => act(c.id, "reset-link")} disabled={!!busy}
                          title="توليد رابط إعادة تعيين"
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: T.softTint, color: T.primary }}>
                    <KeyRound size={15} />
                  </button>
                  <button onClick={() => act(c.id, blocked ? "unblock" : "block")} disabled={!!busy}
                          title={blocked ? "إلغاء الإيقاف" : "إيقاف الحساب"}
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: blocked ? `${T.success}15` : `${T.danger}12`, color: blocked ? T.success : T.danger }}>
                    {blocked ? <CheckCircle2 size={15} /> : <Ban size={15} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
