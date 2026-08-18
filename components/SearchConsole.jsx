"use client";
/**
 * ═══════════════════════════════════════════════════════════
 *  وحدة تحكّم البحث
 * ═══════════════════════════════════════════════════════════
 *
 *  ثلاث ألسنة: التقارير، والمرادفات، والتثبيت.
 *
 *  الفكرة الحاكمة: لا تعرض رقمًا بلا زرّ يعالجه. كل استعلام
 *  «بلا نتائج» يحمل بجانبه زرّ «أضف كمرادف» — التقرير الذي لا
 *  يُفضي إلى إجراء يُقرأ مرة ثم يُنسى.
 */
import React, { useState } from "react";
import {
  Search, AlertTriangle, TrendingUp, Plus, Trash2, Save, Loader2,
  Check, Pin, X, Link2,
} from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };
const n = (v) => Number(v || 0).toLocaleString("ar-SA");

const TABS = [
  { key: "reports", label: "التقارير", icon: TrendingUp },
  { key: "synonyms", label: "المرادفات", icon: Link2 },
  { key: "pins", label: "التثبيت", icon: Pin },
];

export default function SearchConsole({ top = [], zero = [], stats = {}, config = {}, products = [] }) {
  const [tab, setTab] = useState("reports");
  const [synonyms, setSynonyms] = useState(config.synonyms || []);
  const [pins, setPins] = useState(config.pins || {});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  const [pinQuery, setPinQuery] = useState("");
  const [pinProduct, setPinProduct] = useState("");

  const card = { background: "#fff", border: `1px solid ${T.line}` };
  const field = "w-full px-4 py-3 rounded-xl text-sm outline-none";
  const fieldStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt };

  const save = async (payload) => {
    setBusy(true); setSaved(false);
    try {
      const res = await fetch("/api/admin/search", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } finally { setBusy(false); }
  };

  /* ── المرادفات ── */
  const addGroup = (text) => {
    const words = String(text).split(/[,،\s]+/).map((w) => w.trim()).filter(Boolean);
    if (words.length < 2) return;
    const next = [...synonyms, words];
    setSynonyms(next); setNewGroup("");
    save({ synonyms: next });
  };
  const removeGroup = (i) => {
    const next = synonyms.filter((_, j) => j !== i);
    setSynonyms(next); save({ synonyms: next });
  };

  /** من تقرير «بلا نتائج» مباشرة إلى مرادف — إجراء بضغطة واحدة. */
  const [linkFor, setLinkFor] = useState(null);
  const [linkTo, setLinkTo] = useState("");
  const confirmLink = () => {
    if (!linkFor || !linkTo.trim()) return;
    addGroup(`${linkFor} ${linkTo.trim()}`);
    setLinkFor(null); setLinkTo("");
  };

  /* ── التثبيت ── */
  const addPin = () => {
    const q = pinQuery.trim();
    if (!q || !pinProduct) return;
    const next = { ...pins, [q]: [...new Set([...(pins[q] || []), pinProduct])] };
    setPins(next); setPinQuery(""); setPinProduct("");
    save({ pins: next });
  };
  const removePin = (q, id) => {
    const ids = (pins[q] || []).filter((x) => x !== id);
    const next = { ...pins };
    if (ids.length) next[q] = ids; else delete next[q];
    setPins(next); save({ pins: next });
  };

  const productName = (id) => products.find((p) => p.id === id)?.name || id;

  return (
    <div className="flex flex-col gap-5">

      {/* ══ إحصاءات ══ */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "عمليات بحث (٣٠ يومًا)", v: n(stats.total) },
          { l: "بلا نتائج", v: n(stats.zero) },
          { l: "نسبة الإخفاق", v: `${stats.zeroRate || 0}٪` },
        ].map((s, i) => (
          <div key={s.l} className="p-4 rounded-2xl"
               style={{ background: i === 2 && stats.zeroRate > 20 ? `${T.danger}10` : T.softTint, border: `1px solid ${T.line}` }}>
            <p className="text-[11px] font-bold mb-1.5" style={{ color: T.muted }}>{s.l}</p>
            <p className="text-xl leading-none" style={{ color: i === 2 && stats.zeroRate > 20 ? T.danger : T.primary, ...H }}>
              {s.v}
            </p>
          </div>
        ))}
      </div>

      {stats.zeroRate > 20 && (
        <p className="text-xs px-4 py-3 rounded-xl leading-relaxed"
           style={{ background: `${T.warning}12`, color: T.ink }}>
          أكثر من خُمس عمليات البحث لا تُرجع شيئًا. راجع لسان «بلا نتائج» — كل سطر إمّا منتج ينقصك أو مرادف ينقص المحرّك.
        </p>
      )}

      {/* ══ الألسنة ══ */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] transition-all"
                  style={tab === t.key
                    ? { background: T.primary, color: "#fff", fontWeight: 700 }
                    : { background: "#fff", border: `1px solid ${T.line}`, color: T.muted }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
        {saved && (
          <span className="flex items-center gap-1.5 px-3 text-[12px] font-bold" style={{ color: T.success }}>
            <Check size={14} /> حُفظ
          </span>
        )}
        {busy && <Loader2 size={15} className="animate-spin self-center" style={{ color: T.accent }} />}
      </div>

      {/* ══ التقارير ══ */}
      {tab === "reports" && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* بلا نتائج */}
          <div className="p-5 rounded-2xl" style={card}>
            <h2 className="text-sm mb-1 flex items-center gap-2" style={{ color: T.primary, ...H }}>
              <AlertTriangle size={15} style={{ color: T.danger }} /> بحث بلا نتائج
            </h2>
            <p className="text-[11px] mb-4 leading-relaxed" style={{ color: T.muted }}>
              أثمن تقرير لديك: عملاء طلبوا شيئًا ولم يجدوه.
            </p>
            {zero.length === 0 ? (
              <p className="text-xs py-6 text-center" style={{ color: T.mutedLight }}>لا شيء — ممتاز.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {zero.map((r) => (
                  <div key={r.norm} className="flex items-center gap-2 p-3 rounded-xl"
                       style={{ background: T.surfaceAlt }}>
                    <span className="flex-1 text-[13px] font-bold truncate" style={{ color: T.ink }}>{r.q}</span>
                    <span className="num text-[11px] shrink-0" style={{ color: T.muted }}>{n(r.hits)}×</span>
                    <button onClick={() => { setLinkFor(r.q); setTab("synonyms"); }}
                            className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                            style={{ background: T.primary, color: "#fff" }}>
                      اربطه بمرادف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* الأكثر بحثًا */}
          <div className="p-5 rounded-2xl" style={card}>
            <h2 className="text-sm mb-1 flex items-center gap-2" style={{ color: T.primary, ...H }}>
              <TrendingUp size={15} style={{ color: T.accent }} /> الأكثر بحثًا
            </h2>
            <p className="text-[11px] mb-4 leading-relaxed" style={{ color: T.muted }}>
              ما يطلبه الناس فعلًا — استعمله في تسمية المنتجات والحملات.
            </p>
            {top.length === 0 ? (
              <p className="text-xs py-6 text-center" style={{ color: T.mutedLight }}>لا بيانات بعد.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {top.map((r) => (
                  <div key={r.norm} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: T.surfaceAlt }}>
                    <span className="flex-1 text-[13px] truncate" style={{ color: T.ink }}>{r.q}</span>
                    <span className="num text-[11px] shrink-0" style={{ color: T.muted }}>{n(r.hits)}× بحث</span>
                    <span className="num text-[11px] shrink-0 px-2 py-0.5 rounded"
                          style={{ background: r.avg === 0 ? `${T.danger}18` : `${T.success}15`, color: r.avg === 0 ? T.danger : T.success }}>
                      {n(r.avg)} نتيجة
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ المرادفات ══ */}
      {tab === "synonyms" && (
        <div className="p-5 rounded-2xl flex flex-col gap-4" style={card}>
          <div>
            <h2 className="text-sm mb-1" style={{ color: T.primary, ...H }}>المرادفات</h2>
            <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>
              كل مجموعة كلمات متكافئة — البحث بأيّها يجد الباقي. العميل لا يكتب مصطلحك:
              يكتب «بوكيه» وأنت سمّيته «باقة».
            </p>
          </div>

          {linkFor && (
            <div className="p-4 rounded-xl flex flex-col gap-3" style={{ background: `${T.accent}0F`, border: `1px solid ${T.accent}44` }}>
              <p className="text-xs font-bold" style={{ color: T.ink }}>
                اربط «{linkFor}» بكلمة موجودة في منتجاتك:
              </p>
              <div className="flex gap-2">
                <input value={linkTo} onChange={(e) => setLinkTo(e.target.value)}
                       placeholder="مثال: باقة" className={field} style={fieldStyle} />
                <button onClick={confirmLink} className="px-4 rounded-xl text-xs font-bold shrink-0"
                        style={{ background: T.primary, color: "#fff" }}>ربط</button>
                <button onClick={() => setLinkFor(null)} className="px-3 rounded-xl shrink-0" style={{ color: T.muted }}>
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input value={newGroup} onChange={(e) => setNewGroup(e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && addGroup(newGroup)}
                   placeholder="اكتب كلمات متكافئة مفصولة بمسافة أو فاصلة…"
                   className={field} style={fieldStyle} />
            <button onClick={() => addGroup(newGroup)} disabled={busy}
                    className="px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                    style={{ background: T.primary, color: "#fff" }}>
              <Plus size={14} /> إضافة
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-[26rem] overflow-y-auto">
            {synonyms.map((g, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: T.surfaceAlt }}>
                <div className="flex-1 flex flex-wrap gap-1.5">
                  {g.map((w) => (
                    <span key={w} className="text-[12px] px-2 py-0.5 rounded-md"
                          style={{ background: "#fff", color: T.ink, border: `1px solid ${T.line}` }}>
                      {w}
                    </span>
                  ))}
                </div>
                <button onClick={() => removeGroup(i)} aria-label="حذف"
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ color: T.danger }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ التثبيت ══ */}
      {tab === "pins" && (
        <div className="p-5 rounded-2xl flex flex-col gap-4" style={card}>
          <div>
            <h2 className="text-sm mb-1" style={{ color: T.primary, ...H }}>تثبيت نتائج</h2>
            <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>
              اجعل منتجًا يظهر أولًا لاستعلام بعينه — يتجاوز الترتيب الحسابي.
              مفيد في المواسم: ثبّت تنسيق التخرّج على كلمة «تخرج» في موسمه.
            </p>
          </div>

          <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
            <input value={pinQuery} onChange={(e) => setPinQuery(e.target.value)}
                   placeholder="الاستعلام (مثال: تخرج)" className={field} style={fieldStyle} />
            <select value={pinProduct} onChange={(e) => setPinProduct(e.target.value)}
                    className={field} style={fieldStyle}>
              <option value="">اختر منتجًا…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={addPin} disabled={busy || !pinQuery.trim() || !pinProduct}
                    className="px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                    style={{ background: T.primary, color: "#fff", opacity: (!pinQuery.trim() || !pinProduct) ? .5 : 1 }}>
              <Pin size={14} /> تثبيت
            </button>
          </div>

          {Object.keys(pins).length === 0 ? (
            <p className="text-xs py-8 text-center" style={{ color: T.mutedLight }}>لا تثبيتات بعد.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(pins).map(([qy, ids]) => (
                <div key={qy} className="p-3 rounded-xl" style={{ background: T.surfaceAlt }}>
                  <p className="text-[12px] font-bold mb-2 flex items-center gap-1.5" style={{ color: T.primary }}>
                    <Search size={12} /> {qy}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {ids.map((id) => (
                      <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#fff" }}>
                        <span className="flex-1 text-[12px] truncate" style={{ color: T.ink }}>{productName(id)}</span>
                        <button onClick={() => removePin(qy, id)} className="shrink-0" style={{ color: T.danger }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
