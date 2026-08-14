"use client";
import React, { useState } from "react";
import {
  Save, Check, Loader2, ExternalLink, Store, Share2, Phone,
  BarChart3, Settings as SettingsIcon, AlertCircle,
} from "lucide-react";
import { SOCIAL_LINKS, CONTACT_SETTINGS, STORE_SETTINGS, IDENTITY_SETTINGS } from "../lib/settings.js";
import { ANALYTICS_SETTINGS, validateAnalyticsId } from "../lib/analytics.js";
import { getIcon } from "../lib/iconMap.js";
import ImageUploader from "./ImageUploader.jsx";
import BrandIcon, { brandColor, brandLabel } from "./site/BrandIcon.jsx";

const C = { navy: "#0C1C77", slate: "#4A5A63", line: "#E1ECE8", teal: "#00C6C7", success: "#1B9C68", danger: "#D64545", offWhite: "#F6FAF9", mintTint: "#EAF8F1" };

const TABS = [
  { key: "identity",  label: "هوية المتجر", icon: Store,        desc: "الشعار والاسم والوصف" },
  { key: "store",     label: "إعدادات عامة", icon: SettingsIcon, desc: "الشريط والإعلانات وواتساب" },
  { key: "social",    label: "التواصل",      icon: Share2,       desc: "روابط المنصات الاجتماعية" },
  { key: "contact",   label: "بيانات الاتصال", icon: Phone,      desc: "الهاتف والعنوان والخريطة" },
  { key: "analytics", label: "التتبّع",       icon: BarChart3,    desc: "GTM والتحليلات والبكسلات" },
];

export default function SettingsForm({ initial = {} }) {
  const [form, setForm] = useState(initial);
  const [tab, setTab] = useState("identity");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setDirty(true);
  };
  const setValue = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const save = async () => {
    for (const a of ANALYTICS_SETTINGS) {
      const msg = validateAnalyticsId(a.key, form[a.key]);
      if (msg) { setError(msg); setTab("analytics"); return; }
    }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "فشل الحفظ");
      setSaved(true); setDirty(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const field = "w-full px-4 py-2.5 rounded-xl text-sm outline-none min-w-0";
  const fStyle = { border: `1.5px solid ${C.line}`, background: "#fff" };

  /** حقل واحد — يختار الشكل حسب النوع. */
  const Field = ({ def, wide }) => {
    if (def.type === "image") {
      return (
        <div className={wide ? "sm:col-span-2" : ""}>
          <ImageUploader
            value={form[def.key]}
            onChange={(url) => setValue(def.key, url)}
            preset={def.key === "store_favicon" ? "icon" : "banner"}
            label={def.label}
            hint={def.note}
          />
        </div>
      );
    }
    return (
      <div className={wide ? "sm:col-span-2" : ""}>
        <label className="text-xs font-bold block mb-1.5" style={{ color: C.navy }}>{def.label}</label>
        {def.type === "textarea" ? (
          <textarea value={form[def.key] || ""} onChange={set(def.key)} placeholder={def.placeholder}
                    rows={3} className={`${field} resize-none`} style={fStyle} />
        ) : (
          <input value={form[def.key] || ""} onChange={set(def.key)} placeholder={def.placeholder}
                 className={field} style={fStyle} />
        )}
        {def.note && <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: C.slate }}>{def.note}</p>}
      </div>
    );
  };

  const Section = ({ title, desc, children }) => (
    <div className="p-5 sm:p-6 rounded-2xl" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <h2 className="font-bold text-sm mb-1" style={{ color: C.navy }}>{title}</h2>
      {desc && <p className="text-xs mb-5 leading-relaxed" style={{ color: C.slate }}>{desc}</p>}
      {children}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* التبويبات */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
              style={on ? { background: C.navy, color: "#fff" } : { background: "#fff", color: C.slate, border: `1px solid ${C.line}` }}>
              <t.icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs -mt-2" style={{ color: C.slate }}>
        {TABS.find((t) => t.key === tab)?.desc}
      </p>

      {/* هوية المتجر */}
      {tab === "identity" && (
        <Section title="هوية المتجر" desc="الشعار والأيقونة والاسم — تظهر في الموقع ونتائج البحث وعند مشاركة الرابط.">
          <div className="grid sm:grid-cols-2 gap-5">
            {IDENTITY_SETTINGS.map((d) => (
              <Field key={d.key} def={d} wide={d.type === "image" || d.type === "textarea"} />
            ))}
          </div>

          {/* معاينة حيّة */}
          <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${C.line}` }}>
            <p className="text-[11px] font-bold mb-3" style={{ color: C.slate }}>معاينة الترويسة</p>
            <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: C.offWhite }}>
              {form.store_logo ? (
                <img src={form.store_logo} alt="" className="h-10 w-auto object-contain" />
              ) : (
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px]"
                      style={{ background: C.mintTint, color: C.slate }}>شعار</span>
              )}
              <div className="flex flex-col leading-tight">
                <span className="font-display text-sm" style={{ color: C.navy, fontWeight: 800 }}>
                  {form.store_short_name || form.store_name || "متجرك"}
                </span>
                <span className="text-[10px]" style={{ color: C.slate }}>
                  {form.store_tagline || "وصف قصير"}
                </span>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* إعدادات عامة */}
      {tab === "store" && (
        <Section title="إعدادات المتجر" desc="نصوص وأرقام كانت ثابتة في الكود — صارت تحت تحكمك.">
          <div className="grid sm:grid-cols-2 gap-4">
            {STORE_SETTINGS.map((d) => (
              <Field key={d.key} def={d} wide={d.key === "store_ticker" || d.key === "announcement"} />
            ))}
          </div>
        </Section>
      )}

      {/* التواصل الاجتماعي */}
      {tab === "social" && (
        <Section title="روابط التواصل الاجتماعي" desc="الروابط المتروكة فارغة لا تظهر أيقونتها في الموقع — لا حاجة لتعبئتها كلها.">
          <div className="grid sm:grid-cols-2 gap-4">
            {SOCIAL_LINKS.map((s) => {
              const val = form[s.key] || "";
              // الأيقونة تُكتشف من الرابط المُدخل — معاينة فورية لما سيظهر في الموقع
              const live = val ? brandColor(val) : s.color;
              return (
                <div key={s.key}>
                  <label className="text-xs font-bold flex items-center gap-2 mb-1.5" style={{ color: C.navy }}>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${live}18` }}>
                      <BrandIcon url={val || s.placeholder} size={13} color={live === "#FFFC00" ? "#B8A200" : live} />
                    </span>
                    {val ? brandLabel(val) : s.label}
                    {val && (
                      <a href={val} target="_blank" rel="noopener noreferrer" className="mr-auto" title="فتح الرابط">
                        <ExternalLink size={12} color={C.teal} />
                      </a>
                    )}
                  </label>
                  <input value={val} onChange={set(s.key)} placeholder={s.placeholder} dir="ltr"
                         className={`${field} text-left`} style={fStyle} />
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* بيانات الاتصال */}
      {tab === "contact" && (
        <Section title="بيانات الاتصال" desc="تظهر في تذييل الموقع وصفحة «تواصل معنا».">
          <div className="grid sm:grid-cols-2 gap-4">
            {CONTACT_SETTINGS.map((d) => (<Field key={d.key} def={d} wide={d.key === "map_query"} />))}
          </div>
        </Section>
      )}

      {/* التتبّع */}
      {tab === "analytics" && (
        <Section title="التتبّع والتحليلات"
                 desc="أضف معرّف Google Tag Manager وحده، ثم ثبّت كل بكسلات المنصات من داخل حاوية GTM بلا تعديل الكود.">
          <div className="grid sm:grid-cols-2 gap-4">
            {ANALYTICS_SETTINGS.map((a) => (
              <div key={a.key} className={a.primary ? "sm:col-span-2" : ""}>
                <label className="text-xs font-bold flex items-center gap-2 mb-1.5" style={{ color: C.navy }}>
                  {a.label}
                  {a.primary && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: C.mintTint, color: "#0C7A55" }}>الأهم</span>
                  )}
                </label>
                <input value={form[a.key] || ""} onChange={set(a.key)} placeholder={a.placeholder} dir="ltr"
                       className={`${field} text-left`}
                       style={{ ...fStyle, borderColor: a.primary && form[a.key] ? C.teal : C.line }} />
                {a.note && <p className="text-[11px] mt-1.5" style={{ color: C.slate }}>{a.note}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {error && (
        <p className="text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2" style={{ background: `${C.danger}12`, color: C.danger }}>
          <AlertCircle size={14} className="shrink-0" /> {error}
        </p>
      )}

      {/* شريط الحفظ */}
      <div className="sticky bottom-4 z-10">
        <button onClick={save} disabled={saving || (!dirty && !saved)}
                className="btn w-full py-3.5 text-sm shadow-lg disabled:opacity-60"
                style={{ background: saved ? C.success : C.navy, color: "#fff" }}>
          {saving ? <><Loader2 size={16} className="animate-spin" /> جارٍ الحفظ…</>
            : saved ? <><Check size={16} className="pop-in" /> حُفظت الإعدادات</>
            : dirty ? <><Save size={16} /> حفظ التغييرات</>
            : <>لا تغييرات للحفظ</>}
        </button>
      </div>
    </div>
  );
}
