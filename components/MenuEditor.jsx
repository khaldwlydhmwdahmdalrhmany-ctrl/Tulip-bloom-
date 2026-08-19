"use client";
/**
 * محرّر القوائم — الهيدر والفوتر.
 *
 * ⚠️ القائمة الفارغة تعني «استعمل التهيئة الافتراضية».
 * لو عاملنا الفراغ كقائمة فعلية لاختفى التنقّل بالكامل عند أول
 * فتح للمحرّر — وهو ما يبدو كعطل لا كإعداد.
 */
import React, { useState } from "react";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Loader2, Check, Power,
  ExternalLink, Sparkles, ListTree, AlertTriangle,
} from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };

const LOCATIONS = [
  { key: "header", label: "الهيدر" },
  { key: "footer", label: "الفوتر" },
];

export default function MenuEditor({ initial = [], suggestions = [] }) {
  const [items, setItems] = useState(initial);
  const [loc, setLoc] = useState("header");
  const [form, setForm] = useState({ label: "", href: "", accent: false, newTab: false });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const card = { background: "#fff", border: `1px solid ${T.line}` };
  const field = "w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none";
  const fieldStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt };

  const current = items.filter((i) => i.location === loc).sort((a, b) => a.sortOrder - b.sortOrder);

  const call = async (payload) => {
    setBusy(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/admin/nav", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || "تعذّر التنفيذ."); return null; }
      if (d.items) setItems(d.items);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      return d;
    } finally { setBusy(false); }
  };

  const add = async (data) => {
    const payload = { action: "create", location: loc, sortOrder: current.length, ...data };
    if (!payload.label?.trim() || !payload.href?.trim()) return;
    const d = await call(payload);
    if (d) setForm({ label: "", href: "", accent: false, newTab: false });
  };

  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= current.length) return;
    const ids = current.map((x) => x.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await call({ action: "reorder", ids });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* الموقع */}
      <div className="flex gap-2 items-center">
        {LOCATIONS.map((l) => {
          const count = items.filter((i) => i.location === l.key).length;
          return (
            <button key={l.key} onClick={() => setLoc(l.key)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px]"
                    style={loc === l.key ? { background: T.primary, color: "#fff", fontWeight: 700 }
                                         : { background: "#fff", border: `1px solid ${T.line}`, color: T.muted }}>
              <ListTree size={14} /> {l.label} ({count})
            </button>
          );
        })}
        {busy && <Loader2 size={15} className="animate-spin" style={{ color: T.accent }} />}
        {saved && <span className="flex items-center gap-1 text-[12px] font-bold" style={{ color: T.success }}><Check size={13} /> حُفظ</span>}
      </div>

      {current.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl"
             style={{ background: `${T.warning}10`, border: `1px solid ${T.warning}33` }}>
          <AlertTriangle size={16} style={{ color: T.warning }} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: T.ink }}>
            هذه القائمة فارغة، والمتجر يستعمل الروابط الافتراضية من التهيئة.
            <strong> أول رابط تضيفه يتولّى القائمة بالكامل</strong> — فأضف كل ما تريده لا رابطًا واحدًا.
          </p>
        </div>
      )}

      {error && <p className="text-xs font-bold px-4 py-3 rounded-xl" style={{ background: `${T.danger}12`, color: T.danger }}>{error}</p>}

      {/* العناصر */}
      <div className="flex flex-col gap-2">
        {current.map((it, i) => (
          <div key={it.id} className="p-3.5 rounded-2xl flex flex-wrap items-center gap-3"
               style={{ ...card, opacity: it.active ? 1 : .55 }}>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => move(i, -1)} disabled={i === 0}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ color: i === 0 ? T.line : T.muted }}><ChevronUp size={14} /></button>
              <button onClick={() => move(i, 1)} disabled={i === current.length - 1}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ color: i === current.length - 1 ? T.line : T.muted }}><ChevronDown size={14} /></button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold flex items-center gap-2" style={{ color: T.primary }}>
                {it.label}
                {it.accent && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: T.softTint, color: T.primary }}>بارز</span>}
                {it.newTab && <ExternalLink size={11} style={{ color: T.mutedLight }} />}
              </p>
              <p className="text-[11px]" dir="ltr" style={{ color: T.mutedLight, textAlign: "right" }}>{it.href}</p>
            </div>
            <button onClick={() => call({ action: "update", ...it, active: !it.active })}
                    title={it.active ? "إخفاء" : "إظهار"}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: it.active ? `${T.warning}15` : `${T.success}15`, color: it.active ? T.warning : T.success }}>
              <Power size={14} />
            </button>
            <button onClick={() => call({ action: "delete", id: it.id })}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${T.danger}10`, color: T.danger }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* إضافة */}
      <div className="p-5 rounded-2xl flex flex-col gap-3" style={card}>
        <h2 className="text-sm" style={{ color: T.primary, ...H }}>رابط جديد في {LOCATIONS.find((l) => l.key === loc).label}</h2>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
          <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                 placeholder="الاسم الظاهر" className={field} style={fieldStyle} />
          <input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })}
                 dir="ltr" placeholder="/shop" className={`${field} text-right`} style={fieldStyle} />
          <button onClick={() => add(form)} disabled={busy || !form.label.trim() || !form.href.trim()}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5 shrink-0"
                  style={{ background: T.primary, color: "#fff", opacity: (form.label.trim() && form.href.trim()) ? 1 : .5 }}>
            <Plus size={15} /> إضافة
          </button>
        </div>
        <div className="flex gap-5">
          {[["accent", "بارز (شارة)"], ["newTab", "فتح في تبويب جديد"]].map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })}
                     style={{ accentColor: T.accent }} />
              <span className="text-[12px]" style={{ color: T.ink }}>{l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* مقترحات */}
      {suggestions.length > 0 && (
        <div className="p-5 rounded-2xl" style={card}>
          <h3 className="text-[13px] mb-3 flex items-center gap-2" style={{ color: T.primary, ...H }}>
            <Sparkles size={14} /> إضافة سريعة
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestions
              .filter((s) => !current.some((c) => c.href === s.href))
              .slice(0, 30)
              .map((s) => (
                <button key={s.href} onClick={() => add({ label: s.label, href: s.href })} disabled={busy}
                        className="text-[12px] px-3 py-1.5 rounded-lg"
                        style={{ background: T.surfaceAlt, color: T.muted, border: `1px dashed ${T.line}` }}>
                  + {s.label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
