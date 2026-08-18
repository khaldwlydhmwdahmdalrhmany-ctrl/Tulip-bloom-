"use client";
/**
 * ═══════════════════════════════════════════════════════════
 *  لوحة CRM
 * ═══════════════════════════════════════════════════════════
 *  قائمة جهات الاتصال مع الشرائح والبحث والتصدير، ومتابعات
 *  مستحقّة أعلى الصفحة.
 */
import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Download, UserCheck, UserPlus, AlertTriangle, ArrowLeft,
  CheckSquare, Phone, Mail, Tag as TagIcon,
} from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };
const n = (v) => Number(v || 0).toLocaleString("ar-SA");

const SEG_TONE = {
  vip: T.gold, repeat: T.success, new: T.accent,
  at_risk: T.danger, prospect: T.muted, marketing: T.primary,
};

const daysAgo = (d) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null);

export default function CrmBoard({ contacts = [], overview = {}, segments = [], tasks = [], currency = "ر.س" }) {
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("");
  const [sort, setSort] = useState("ltv");

  const segLabel = (k) => segments.find((s) => s.key === k)?.label || k;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let out = contacts.filter((c) => {
      if (seg && !c.segments.includes(seg)) return false;
      if (!s) return true;
      return (
        c.name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.phone.includes(s) ||
        c.tags.some((t) => t.toLowerCase().includes(s))
      );
    });
    const sorters = {
      ltv: (a, b) => b.lifetimeValue - a.lifetimeValue,
      orders: (a, b) => b.orderCount - a.orderCount,
      recent: (a, b) => new Date(b.lastOrderAt || 0) - new Date(a.lastOrderAt || 0),
      name: (a, b) => a.name.localeCompare(b.name, "ar"),
    };
    return [...out].sort(sorters[sort] || sorters.ltv);
  }, [contacts, q, seg, sort]);

  const card = { background: "#fff", border: `1px solid ${T.line}` };
  const openTasks = tasks.filter((t) => !t.done);

  return (
    <div className="flex flex-col gap-5">

      {/* ══ نظرة عامة ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: "جهات الاتصال", v: n(overview.total), sub: `${n(overview.registered)} مسجّل · ${n(overview.guests)} ضيف` },
          { l: "قيمة الشراء الكلية", v: `${n(overview.revenue)} ${currency}` },
          { l: "متوسط قيمة العميل", v: `${n(overview.avgLtv)} ${currency}` },
          { l: "نسبة التكرار", v: `${overview.repeatRate || 0}٪` },
        ].map((s) => (
          <div key={s.l} className="p-4 rounded-2xl" style={{ background: T.softTint, border: `1px solid ${T.line}` }}>
            <p className="text-[11px] font-bold mb-1.5" style={{ color: T.muted }}>{s.l}</p>
            <p className="text-lg leading-none" style={{ color: T.primary, ...H }}>{s.v}</p>
            {s.sub && <p className="text-[10px] mt-1.5" style={{ color: T.mutedLight }}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* ══ متابعات مستحقّة ══ */}
      {openTasks.length > 0 && (
        <div className="p-5 rounded-2xl" style={card}>
          <h2 className="text-sm mb-3 flex items-center gap-2" style={{ color: T.primary, ...H }}>
            <CheckSquare size={15} style={{ color: T.warning }} /> متابعات مفتوحة ({n(openTasks.length)})
          </h2>
          <div className="flex flex-col gap-2">
            {openTasks.slice(0, 6).map((t) => {
              const overdue = t.dueAt && new Date(t.dueAt).getTime() < Date.now();
              return (
                <Link key={t.id} href={`/admin/customers/${encodeURIComponent(t.contactKey)}`}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: overdue ? `${T.danger}0D` : T.surfaceAlt }}>
                  <span className="flex-1 text-[13px] truncate" style={{ color: T.ink }}>{t.title}</span>
                  {t.dueAt && (
                    <span className="num text-[11px] shrink-0" style={{ color: overdue ? T.danger : T.muted }}>
                      {new Date(t.dueAt).toLocaleDateString("ar-SA")}
                      {overdue ? " · متأخّرة" : ""}
                    </span>
                  )}
                  <ArrowLeft size={14} style={{ color: T.mutedLight }} className="shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {overview.atRisk > 0 && (
        <Link href="#" onClick={(e) => { e.preventDefault(); setSeg("at_risk"); }}
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: `${T.warning}10`, border: `1px solid ${T.warning}33` }}>
          <AlertTriangle size={16} style={{ color: T.warning }} className="shrink-0" />
          <p className="text-xs flex-1 leading-relaxed" style={{ color: T.ink }}>
            <strong>{n(overview.atRisk)}</strong> عميلًا اشترى سابقًا وصمت أكثر من ٩٠ يومًا.
            استرجاع عميل سابق أرخص بكثير من كسب جديد.
          </p>
          <span className="text-[11px] font-bold shrink-0" style={{ color: T.warning }}>اعرضهم</span>
        </Link>
      )}

      {/* ══ الشرائح ══ */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSeg("")}
                className="px-3.5 py-2 rounded-xl text-[12px] transition-all"
                style={!seg ? { background: T.primary, color: "#fff", fontWeight: 700 }
                            : { background: "#fff", border: `1px solid ${T.line}`, color: T.muted }}>
          الكل ({n(contacts.length)})
        </button>
        {segments.map((s) => {
          const count = contacts.filter((c) => c.segments.includes(s.key)).length;
          const on = seg === s.key;
          return (
            <button key={s.key} onClick={() => setSeg(on ? "" : s.key)} title={s.hint}
                    className="px-3.5 py-2 rounded-xl text-[12px] transition-all"
                    style={on ? { background: SEG_TONE[s.key] || T.primary, color: "#fff", fontWeight: 700 }
                              : { background: "#fff", border: `1px solid ${T.line}`, color: T.muted }}>
              {s.label} ({n(count)})
            </button>
          );
        })}
      </div>

      {/* ══ البحث والتصدير ══ */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none" color={T.mutedLight} />
          <input value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="ابحث بالاسم أو الجوال أو البريد أو الوسم…"
                 className="w-full pr-11 pl-4 py-3 rounded-xl text-sm outline-none"
                 style={{ border: `1px solid ${T.line}`, background: "#fff" }} />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="px-4 py-3 rounded-xl text-[13px] outline-none"
                style={{ border: `1px solid ${T.line}`, background: "#fff", color: T.primary }}>
          <option value="ltv">الأعلى إنفاقًا</option>
          <option value="orders">الأكثر طلبًا</option>
          <option value="recent">الأحدث طلبًا</option>
          <option value="name">الاسم</option>
        </select>
        <a href={`/api/admin/crm/export${seg ? `?segment=${seg}` : ""}`}
           className="px-4 py-3 rounded-xl text-[13px] font-bold flex items-center gap-2 justify-center shrink-0"
           style={{ background: T.softTint, color: T.primary }}>
          <Download size={15} /> تصدير CSV
        </a>
      </div>

      {/* ══ القائمة ══ */}
      {filtered.length === 0 ? (
        <div className="p-10 rounded-2xl text-center" style={card}>
          <p className="text-sm" style={{ color: T.muted }}>
            {contacts.length === 0 ? "لا جهات اتصال بعد — ستظهر تلقائيًا مع أول طلب أو تسجيل." : "لا نتائج مطابقة."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((c) => {
            const since = daysAgo(c.lastOrderAt);
            return (
              <Link key={c.key} href={`/admin/customers/${encodeURIComponent(c.key)}`}
                    className="p-4 rounded-2xl flex flex-wrap items-center gap-4 transition-transform hover:-translate-y-0.5"
                    style={{ ...card, opacity: c.status === "blocked" ? .6 : 1 }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold" style={{ color: T.primary }}>
                      {c.name || "بلا اسم"}
                    </span>
                    {c.registered ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                            style={{ background: `${T.success}15`, color: T.success }}>
                        <UserCheck size={9} /> مسجّل
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                            style={{ background: T.surfaceAlt, color: T.muted }}>
                        <UserPlus size={9} /> ضيف
                      </span>
                    )}
                    {c.status === "blocked" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: T.danger, color: "#fff" }}>موقوف</span>
                    )}
                    {c.segments.filter((s) => s !== "marketing").slice(0, 2).map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: `${SEG_TONE[s] || T.muted}18`, color: SEG_TONE[s] || T.muted }}>
                        {segLabel(s)}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-[11px]" style={{ color: T.muted }}>
                    {c.phone && <span className="flex items-center gap-1" dir="ltr"><span>{c.phone}</span><Phone size={10} /></span>}
                    {c.email && <span className="flex items-center gap-1 truncate" dir="ltr"><span>{c.email}</span><Mail size={10} /></span>}
                    {c.tags.length > 0 && (
                      <span className="flex items-center gap-1"><TagIcon size={10} /> {c.tags.join("، ")}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] font-bold mb-0.5" style={{ color: T.mutedLight }}>الطلبات</p>
                    <p className="text-base leading-none num" style={{ color: T.primary, ...H }}>{n(c.orderCount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold mb-0.5" style={{ color: T.mutedLight }}>الإنفاق</p>
                    <p className="text-base leading-none num" style={{ color: T.primary, ...H }}>{n(c.lifetimeValue)}</p>
                  </div>
                  <div className="text-center min-w-[3.5rem]">
                    <p className="text-[10px] font-bold mb-0.5" style={{ color: T.mutedLight }}>آخر طلب</p>
                    <p className="text-[12px] leading-none num"
                       style={{ color: since !== null && since > 90 ? T.danger : T.muted }}>
                      {since === null ? "—" : since === 0 ? "اليوم" : `${n(since)} يوم`}
                    </p>
                  </div>
                </div>

                <ArrowLeft size={15} style={{ color: T.mutedLight }} className="shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
