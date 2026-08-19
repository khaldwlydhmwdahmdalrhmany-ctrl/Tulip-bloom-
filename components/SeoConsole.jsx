"use client";
/**
 * ═══════════════════════════════════════════════════════════
 *  وحدة تحكّم SEO
 * ═══════════════════════════════════════════════════════════
 *  أربعة ألسنة: الفحص، التجاوزات، التحويلات، النشاط المحلي.
 *  المبدأ نفسه: كل مشكلة في الفحص تحمل زرًّا يفتح محرّرها.
 */
import React, { useState, useMemo } from "react";
import {
  Stethoscope, FileEdit, ArrowLeftRight, MapPin, AlertTriangle, AlertCircle,
  Info, Plus, Trash2, Loader2, Check, Save, ExternalLink, EyeOff,
} from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };
const n = (v) => Number(v || 0).toLocaleString("ar-SA");

const TABS = [
  { key: "audit", label: "الفحص", icon: Stethoscope },
  { key: "meta", label: "تجاوزات الصفحات", icon: FileEdit },
  { key: "redirects", label: "التحويلات", icon: ArrowLeftRight },
  { key: "local", label: "النشاط المحلي", icon: MapPin },
];

const SEV = {
  high:   { label: "حرجة",  tone: T.danger,  icon: AlertTriangle },
  medium: { label: "متوسطة", tone: T.warning, icon: AlertCircle },
  low:    { label: "طفيفة",  tone: T.muted,   icon: Info },
};

const BUSINESS_TYPES = [
  { v: "Florist", l: "محل ورد (Florist)" },
  { v: "Store", l: "متجر عام (Store)" },
  { v: "GiftShop", l: "متجر هدايا (GiftShop)" },
  { v: "LocalBusiness", l: "نشاط محلي (LocalBusiness)" },
];

export default function SeoConsole({ audit = {}, overrides = [], redirects = [], paths = [], settings = {}, siteUrl = "" }) {
  const [tab, setTab] = useState("audit");
  const [ovs, setOvs] = useState(overrides);
  const [reds, setReds] = useState(redirects);
  const [cfg, setCfg] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [sev, setSev] = useState("");

  const card = { background: "#fff", border: `1px solid ${T.line}` };
  const field = "w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none";
  const fieldStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt };
  const label = "text-[10px] font-bold tracking-[.12em] uppercase mb-1.5 block";

  const call = async (payload) => {
    setBusy(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "تعذّر تنفيذ الإجراء."); return null; }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      return data;
    } finally { setBusy(false); }
  };

  /* ══ التجاوزات ══ */
  const empty = { path: "", title: "", description: "", ogImage: "", keywords: "", noIndex: false, canonical: "" };
  const [form, setForm] = useState(empty);
  const setF = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const editPath = (path) => {
    const found = ovs.find((o) => o.path === path);
    setForm(found || { ...empty, path });
    setTab("meta");
  };

  const saveOv = async () => {
    const res = await call({ action: "save-override", ...form });
    if (res) {
      setOvs((l) => {
        const others = l.filter((o) => o.path !== res.path);
        return [...others, { ...form, path: res.path, id: form.id || Math.random().toString(36) }];
      });
      setForm(empty);
    }
  };
  const delOv = async (id) => {
    if (await call({ action: "delete-override", id })) setOvs((l) => l.filter((o) => o.id !== id));
  };

  /* ══ التحويلات ══ */
  const [rForm, setRForm] = useState({ fromPath: "", toPath: "", permanent: true });
  const addRed = async () => {
    const res = await call({ action: "create-redirect", ...rForm });
    if (res) {
      setReds([{ id: Math.random().toString(36), ...rForm, hits: 0 }, ...reds]);
      setRForm({ fromPath: "", toPath: "", permanent: true });
    }
  };
  const delRed = async (id) => {
    if (await call({ action: "delete-redirect", id })) setReds((l) => l.filter((r) => r.id !== id));
  };

  const saveCfg = () => call({ action: "save-settings", settings: cfg });
  const setCf = (k) => (e) => setCfg({ ...cfg, [k]: e.target.value });

  const issues = useMemo(
    () => (sev ? (audit.issues || []).filter((i) => i.severity === sev) : audit.issues || []),
    [audit.issues, sev]
  );

  const grouped = useMemo(() => {
    const g = {};
    for (const p of paths) (g[p.group] = g[p.group] || []).push(p);
    return g;
  }, [paths]);

  return (
    <div className="flex flex-col gap-5">

      {/* ══ الألسنة ══ */}
      <div className="flex flex-wrap gap-2 items-center">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] transition-all"
                  style={tab === t.key
                    ? { background: T.primary, color: "#fff", fontWeight: 700 }
                    : { background: "#fff", border: `1px solid ${T.line}`, color: T.muted }}>
            <t.icon size={14} /> {t.label}
            {t.key === "audit" && audit.counts?.high > 0 && (
              <span className="num text-[10px] px-1.5 rounded-full"
                    style={{ background: tab === t.key ? "#ffffff30" : T.danger, color: "#fff" }}>
                {n(audit.counts.high)}
              </span>
            )}
          </button>
        ))}
        {busy && <Loader2 size={15} className="animate-spin" style={{ color: T.accent }} />}
        {saved && <span className="flex items-center gap-1.5 text-[12px] font-bold" style={{ color: T.success }}><Check size={14} /> حُفظ</span>}
      </div>

      {error && (
        <p className="text-xs font-bold px-4 py-3 rounded-xl" style={{ background: `${T.danger}12`, color: T.danger }}>{error}</p>
      )}

      {/* ══════════ الفحص ══════════ */}
      {tab === "audit" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {["high", "medium", "low"].map((k) => {
              const meta = SEV[k];
              const on = sev === k;
              return (
                <button key={k} onClick={() => setSev(on ? "" : k)}
                        className="p-4 rounded-2xl text-right transition-all"
                        style={{
                          background: on ? `${meta.tone}18` : T.softTint,
                          border: `1px solid ${on ? meta.tone : T.line}`,
                        }}>
                  <p className="text-[11px] font-bold mb-1.5" style={{ color: T.muted }}>{meta.label}</p>
                  <p className="text-xl leading-none" style={{ color: meta.tone, ...H }}>
                    {n(audit.counts?.[k])}
                  </p>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] px-4 py-3 rounded-xl leading-relaxed" style={{ background: T.surfaceAlt, color: T.muted }}>
            فُحص {n(audit.scanned?.products)} منتجًا و{n(audit.scanned?.categories)} تصنيفًا.
            الفحص عملي لا شامل: يعرض ما يمنع الظهور فعلًا، لا كل ما يمكن تحسينه.
          </p>

          {issues.length === 0 ? (
            <div className="p-10 rounded-2xl text-center" style={card}>
              <Check size={22} style={{ color: T.success }} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: T.muted }}>لا مشاكل في هذه الدرجة.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {issues.slice(0, 60).map((i, idx) => {
                const meta = SEV[i.severity];
                const Icon = meta.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl" style={card}>
                    <Icon size={15} style={{ color: meta.tone }} className="shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold mb-0.5" style={{ color: T.primary }}>{i.label}</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>{i.detail}</p>
                      <p className="text-[10px] mt-1" dir="ltr" style={{ color: T.mutedLight, textAlign: "right" }}>{i.path}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => editPath(i.path)} title="حرّر الميتا"
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
                              style={{ background: T.softTint, color: T.primary }}>
                        عالجها
                      </button>
                      <a href={`${siteUrl}${i.path}`} target="_blank" rel="noopener noreferrer"
                         className="w-8 h-8 rounded-lg flex items-center justify-center"
                         style={{ background: T.surfaceAlt, color: T.muted }}>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                );
              })}
              {issues.length > 60 && (
                <p className="text-[11px] text-center py-2" style={{ color: T.mutedLight }}>
                  و{n(issues.length - 60)} مشكلة أخرى — عالج الحرجة أولًا.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════ التجاوزات ══════════ */}
      {tab === "meta" && (
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl flex flex-col gap-4" style={card}>
            <div>
              <h2 className="text-sm mb-1" style={{ color: T.primary, ...H }}>تجاوز ميتا لصفحة</h2>
              <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>
                الحقل المتروك فارغًا يبقى محسوبًا تلقائيًا — لا تحتاج ملء كل شيء لتعديل واحد.
              </p>
            </div>

            <div>
              <label className={label} style={{ color: T.mutedLight }}>المسار *</label>
              <select value={form.path} onChange={setF("path")} className={field} style={fieldStyle}>
                <option value="">اختر صفحة…</option>
                {Object.entries(grouped).map(([g, list]) => (
                  <optgroup key={g} label={g}>
                    {list.map((p) => <option key={p.path} value={p.path}>{p.label} — {p.path}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className={label} style={{ color: T.mutedLight }}>
                العنوان <span style={{ color: form.title.length > 60 ? T.danger : T.mutedLight }}>({form.title.length}/60)</span>
              </label>
              <input value={form.title} onChange={setF("title")} className={field} style={fieldStyle} />
            </div>

            <div>
              <label className={label} style={{ color: T.mutedLight }}>
                الوصف <span style={{ color: form.description.length > 160 ? T.danger : T.mutedLight }}>({form.description.length}/160)</span>
              </label>
              <textarea value={form.description} onChange={setF("description")} rows={2}
                        className={`${field} resize-none`} style={fieldStyle} />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={label} style={{ color: T.mutedLight }}>كلمات مفتاحية (بفواصل)</label>
                <input value={form.keywords} onChange={setF("keywords")} className={field} style={fieldStyle} />
              </div>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>صورة المشاركة</label>
                <input value={form.ogImage} onChange={setF("ogImage")} dir="ltr"
                       className={`${field} text-right`} style={fieldStyle} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className={label} style={{ color: T.mutedLight }}>Canonical (اختياري)</label>
                <input value={form.canonical} onChange={setF("canonical")} dir="ltr"
                       className={`${field} text-right`} style={fieldStyle} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer pb-2">
                <input type="checkbox" checked={form.noIndex} onChange={setF("noIndex")}
                       style={{ accentColor: T.danger }} />
                <span className="text-[12px]" style={{ color: T.ink }}>
                  منع الفهرسة (noindex, follow)
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <button onClick={saveOv} disabled={busy || !form.path}
                      className="px-6 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5"
                      style={{ background: T.primary, color: "#fff", opacity: form.path ? 1 : .5 }}>
                <Save size={15} /> حفظ
              </button>
              {form.path && (
                <button onClick={() => setForm(empty)} className="px-4 py-2.5 rounded-xl text-[13px]"
                        style={{ color: T.muted }}>تفريغ</button>
              )}
            </div>
          </div>

          {ovs.length > 0 && (
            <div className="flex flex-col gap-2">
              {ovs.map((o) => (
                <div key={o.id} className="p-4 rounded-2xl flex items-center gap-3" style={card}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold truncate" style={{ color: T.primary }}>
                      {o.title || "(عنوان محسوب)"}
                      {o.noIndex && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full mr-2 inline-flex items-center gap-1"
                              style={{ background: `${T.danger}15`, color: T.danger }}>
                          <EyeOff size={9} /> noindex
                        </span>
                      )}
                    </p>
                    <p className="text-[10px]" dir="ltr" style={{ color: T.mutedLight, textAlign: "right" }}>{o.path}</p>
                  </div>
                  <button onClick={() => setForm(o)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0"
                          style={{ background: T.softTint, color: T.primary }}>تحرير</button>
                  <button onClick={() => delOv(o.id)} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ color: T.danger }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ التحويلات ══════════ */}
      {tab === "redirects" && (
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl flex flex-col gap-4" style={card}>
            <div>
              <h2 className="text-sm mb-1" style={{ color: T.primary, ...H }}>تحويل دائم</h2>
              <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>
                ضروري عند تغيير سلَغ تصنيف أو حذف منتج مفهرس — بدونه يفقد المتجر ترتيبه
                ويصل الزائر إلى صفحة ٤٠٤. السلاسل تُسطَّح تلقائيًا، والتحويل إلى النفس مرفوض.
              </p>
            </div>
            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
              <input value={rForm.fromPath} onChange={(e) => setRForm({ ...rForm, fromPath: e.target.value })}
                     dir="ltr" placeholder="/category/old-slug" className={`${field} text-right`} style={fieldStyle} />
              <input value={rForm.toPath} onChange={(e) => setRForm({ ...rForm, toPath: e.target.value })}
                     dir="ltr" placeholder="/category/new-slug" className={`${field} text-right`} style={fieldStyle} />
              <button onClick={addRed} disabled={busy || !rForm.fromPath || !rForm.toPath}
                      className="px-5 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5 shrink-0"
                      style={{ background: T.primary, color: "#fff", opacity: (rForm.fromPath && rForm.toPath) ? 1 : .5 }}>
                <Plus size={15} /> إضافة
              </button>
            </div>
          </div>

          {reds.length === 0 ? (
            <div className="p-10 rounded-2xl text-center" style={card}>
              <p className="text-sm" style={{ color: T.muted }}>لا تحويلات.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {reds.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl flex items-center gap-3" style={card}>
                  <div className="min-w-0 flex-1" dir="ltr" style={{ textAlign: "right" }}>
                    <p className="text-[12px] truncate" style={{ color: T.muted }}>{r.fromPath}</p>
                    <p className="text-[12px] font-bold truncate" style={{ color: T.primary }}>→ {r.toPath}</p>
                  </div>
                  <span className="num text-[11px] shrink-0" style={{ color: T.mutedLight }}>{n(r.hits)} زيارة</span>
                  <button onClick={() => delRed(r.id)} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ color: T.danger }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ النشاط المحلي ══════════ */}
      {tab === "local" && (
        <div className="p-5 rounded-2xl flex flex-col gap-4" style={card}>
          <div>
            <h2 className="text-sm mb-1" style={{ color: T.primary, ...H }}>بيانات النشاط المحلي</h2>
            <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>
              نوع النشاط والإحداثيات هما ما يؤهّلك لبطاقة النشاط المحلي وخريطة النتائج.
              النوع العام <code>Store</code> لا يؤهّل — <code>Florist</code> يؤهّل.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={label} style={{ color: T.mutedLight }}>نوع النشاط</label>
              <select value={cfg.seo_business_type} onChange={setCf("seo_business_type")} className={field} style={fieldStyle}>
                {BUSINESS_TYPES.map((b) => <option key={b.v} value={b.v}>{b.l}</option>)}
              </select>
            </div>
            <div>
              <label className={label} style={{ color: T.mutedLight }}>نطاق الأسعار</label>
              <input value={cfg.seo_price_range} onChange={setCf("seo_price_range")} dir="ltr"
                     placeholder="SAR 89 - 750" className={`${field} text-right`} style={fieldStyle} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={label} style={{ color: T.mutedLight }}>خط العرض (Latitude)</label>
              <input value={cfg.seo_geo_lat} onChange={setCf("seo_geo_lat")} dir="ltr"
                     placeholder="24.7136" className={`${field} text-right`} style={fieldStyle} />
            </div>
            <div>
              <label className={label} style={{ color: T.mutedLight }}>خط الطول (Longitude)</label>
              <input value={cfg.seo_geo_lng} onChange={setCf("seo_geo_lng")} dir="ltr"
                     placeholder="46.6753" className={`${field} text-right`} style={fieldStyle} />
            </div>
          </div>

          <div>
            <label className={label} style={{ color: T.mutedLight }}>ساعات العمل (صيغة schema.org)</label>
            <input value={cfg.seo_opening_hours} onChange={setCf("seo_opening_hours")} dir="ltr"
                   placeholder="Mo-Su 09:00-23:00" className={`${field} text-right`} style={fieldStyle} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={label} style={{ color: T.mutedLight }}>توثيق Search Console</label>
              <input value={cfg.gsc_verification} onChange={setCf("gsc_verification")} dir="ltr"
                     className={`${field} text-right`} style={fieldStyle} />
            </div>
            <div>
              <label className={label} style={{ color: T.mutedLight }}>توثيق Bing</label>
              <input value={cfg.bing_verification} onChange={setCf("bing_verification")} dir="ltr"
                     className={`${field} text-right`} style={fieldStyle} />
            </div>
          </div>

          <div>
            <label className={label} style={{ color: T.mutedLight }}>مسارات إضافية لمنعها في robots.txt</label>
            <textarea value={cfg.seo_robots_extra} onChange={setCf("seo_robots_extra")} rows={3} dir="ltr"
                      placeholder={"/temp\n/private"} className={`${field} resize-none text-right`} style={fieldStyle} />
            <p className="text-[10px] mt-1.5" style={{ color: T.mutedLight }}>
              مسار واحد في كل سطر، يبدأ بشرطة مائلة.
            </p>
          </div>

          <button onClick={saveCfg} disabled={busy}
                  className="w-fit px-6 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5"
                  style={{ background: T.primary, color: "#fff" }}>
            <Save size={15} /> حفظ
          </button>
        </div>
      )}
    </div>
  );
}
