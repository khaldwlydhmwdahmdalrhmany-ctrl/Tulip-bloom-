"use client";
/**
 * ═══════════════════════════════════════════════════════════
 *  وحدة تحكّم الشحن
 * ═══════════════════════════════════════════════════════════
 *  أربعة ألسنة: المناطق، الأسعار، نوافذ التسليم، شركات الشحن.
 */
import React, { useState } from "react";
import {
  MapPin, Coins, Clock, Truck, Plus, Trash2, Loader2, Check, Power,
  Star, AlertTriangle, ExternalLink, ShieldCheck,
} from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };
const n = (v) => Number(v || 0).toLocaleString("ar-SA");

const TABS = [
  { key: "zones", label: "المناطق", icon: MapPin },
  { key: "rates", label: "الأسعار", icon: Coins },
  { key: "slots", label: "نوافذ التسليم", icon: Clock },
  { key: "carriers", label: "شركات الشحن", icon: Truck },
];

/** مدن سعودية شائعة — تسريع إعداد المناطق. */
const CITY_PRESETS = {
  "الرياض والضواحي": "الرياض، الدرعية، الخرج، الدلم",
  "المدن الكبرى": "جدة، مكة، المدينة، الدمام، الخبر، الظهران، الطائف",
  "بقية المملكة": "أبها، خميس مشيط، تبوك، حائل، بريدة، عنيزة، جازان، نجران، الباحة، عرعر، سكاكا، ينبع، الجبيل، القطيف، الأحساء، الهفوف",
};

export default function ShippingConsole({
  zones: z0 = [], rates: r0 = [], slots: s0 = [],
  carriers: c0 = {}, carrierList = [], currency = "ر.س", defaults = {},
}) {
  const [tab, setTab] = useState("zones");
  const [zones, setZones] = useState(z0);
  const [rates, setRates] = useState(r0);
  const [slots, setSlots] = useState(s0);
  const [carriers, setCarriers] = useState(c0);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const card = { background: "#fff", border: `1px solid ${T.line}` };
  const field = "w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none";
  const fieldStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt };
  const label = "text-[10px] font-bold tracking-[.12em] uppercase mb-1.5 block";

  const call = async (payload) => {
    setBusy(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/admin/shipping", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || "تعذّر التنفيذ."); return null; }
      if (d.zones) setZones(d.zones);
      if (d.rates) setRates(d.rates);
      if (d.slots) setSlots(d.slots);
      if (d.carriers) setCarriers(d.carriers);
      setSaved(true); setTimeout(() => setSaved(false), 2200);
      return d;
    } finally { setBusy(false); }
  };

  /* ── المناطق ── */
  const [zForm, setZForm] = useState({ name: "", cities: "", isDefault: false });
  const addZone = async () => {
    if (!zForm.name.trim()) return;
    if (await call({ action: "create-zone", ...zForm })) setZForm({ name: "", cities: "", isDefault: false });
  };

  /* ── الأسعار ── */
  const [rForm, setRForm] = useState({
    zoneId: "", name: "", price: "", freeOver: "", etaText: "",
    sameDay: false, cutoffHour: "", carrier: "manual",
  });
  const addRate = async () => {
    if (!rForm.zoneId || !rForm.name.trim()) return;
    if (await call({ action: "create-rate", ...rForm })) {
      setRForm({ ...rForm, name: "", price: "", freeOver: "", etaText: "", sameDay: false, cutoffHour: "" });
    }
  };

  /* ── النوافذ ── */
  const [sForm, setSForm] = useState({ label: "", startHour: 9, endHour: 12, surcharge: "" });
  const addSlot = async () => {
    if (!sForm.label.trim()) return;
    if (await call({ action: "create-slot", ...sForm })) setSForm({ label: "", startHour: 9, endHour: 12, surcharge: "" });
  };

  /* ── الشركات ── */
  const [cForm, setCForm] = useState({});
  const setCF = (code, k, v) => setCForm((f) => ({ ...f, [code]: { ...(f[code] || {}), [k]: v } }));
  const saveCarrier = async (code) => {
    const cur = carriers[code] || {};
    const draft = cForm[code] || {};
    await call({
      action: "save-carrier", code,
      enabled: draft.enabled ?? cur.enabled ?? false,
      mode: draft.mode ?? cur.mode ?? "test",
      accountNumber: draft.accountNumber ?? "",
      apiKey: draft.apiKey ?? "",
      apiSecret: draft.apiSecret ?? "",
    });
    setCForm((f) => ({ ...f, [code]: {} }));
  };

  const zoneName = (id) => zones.find((z) => z.id === id)?.name || "—";
  const noDefault = zones.length > 0 && !zones.some((z) => z.isDefault && z.active);

  return (
    <div className="flex flex-col gap-5">

      <div className="flex flex-wrap gap-2 items-center">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] transition-all"
                  style={tab === t.key ? { background: T.primary, color: "#fff", fontWeight: 700 }
                                       : { background: "#fff", border: `1px solid ${T.line}`, color: T.muted }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
        {busy && <Loader2 size={15} className="animate-spin" style={{ color: T.accent }} />}
        {saved && <span className="flex items-center gap-1 text-[12px] font-bold" style={{ color: T.success }}><Check size={13} /> حُفظ</span>}
      </div>

      {error && <p className="text-xs font-bold px-4 py-3 rounded-xl" style={{ background: `${T.danger}12`, color: T.danger }}>{error}</p>}

      {zones.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: `${T.warning}10`, border: `1px solid ${T.warning}33` }}>
          <AlertTriangle size={16} style={{ color: T.warning }} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: T.ink }}>
            لا مناطق معرّفة — المتجر يستعمل السعر الثابت من التهيئة
            (<span className="num">{n(defaults.shipping)}</span> {currency}، مجاني فوق <span className="num">{n(defaults.freeOver)}</span>).
            أضف منطقة لتفعيل التسعير حسب المدينة.
          </p>
        </div>
      )}

      {noDefault && (
        <p className="text-xs px-4 py-3 rounded-xl leading-relaxed" style={{ background: `${T.danger}10`, color: T.ink }}>
          ⚠️ لا منطقة افتراضية مفعّلة. أي مدينة غير مذكورة في أي منطقة ستسقط إلى السعر الثابت من التهيئة.
        </p>
      )}

      {/* ══════════ المناطق ══════════ */}
      {tab === "zones" && (
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl flex flex-col gap-3" style={card}>
            <div>
              <h2 className="text-sm mb-1" style={{ color: T.primary, ...H }}>منطقة جديدة</h2>
              <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>
                اكتب المدن مفصولة بفواصل. المطابقة تتجاهل «ال» والهمزات والتاء المربوطة،
                فـ«الرياض» و«رياض» و«الریاض» كلها تُطابق.
              </p>
            </div>
            <input value={zForm.name} onChange={(e) => setZForm({ ...zForm, name: e.target.value })}
                   placeholder="اسم المنطقة — مثال: الرياض" className={field} style={fieldStyle} />
            <textarea value={zForm.cities} onChange={(e) => setZForm({ ...zForm, cities: e.target.value })}
                      rows={2} placeholder="الرياض، الدرعية، الخرج"
                      className={`${field} resize-none`} style={fieldStyle} />
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CITY_PRESETS).map(([k, v]) => (
                <button key={k} onClick={() => setZForm({ ...zForm, name: zForm.name || k, cities: v })}
                        className="text-[11px] px-2.5 py-1 rounded-lg"
                        style={{ background: T.surfaceAlt, color: T.muted, border: `1px dashed ${T.line}` }}>
                  + {k}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={zForm.isDefault}
                       onChange={(e) => setZForm({ ...zForm, isDefault: e.target.checked })}
                       style={{ accentColor: T.accent }} />
                <span className="text-[12px]" style={{ color: T.ink }}>افتراضية (لكل مدينة غير مذكورة)</span>
              </label>
              <button onClick={addZone} disabled={busy || !zForm.name.trim()}
                      className="px-5 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5"
                      style={{ background: T.primary, color: "#fff", opacity: zForm.name.trim() ? 1 : .5 }}>
                <Plus size={15} /> إضافة
              </button>
            </div>
          </div>

          {zones.map((z) => (
            <div key={z.id} className="p-4 rounded-2xl flex flex-wrap items-center gap-3" style={{ ...card, opacity: z.active ? 1 : .6 }}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold flex items-center gap-2" style={{ color: T.primary }}>
                  {z.name}
                  {z.isDefault && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                          style={{ background: `${T.gold}20`, color: T.gold }}>
                      <Star size={9} /> افتراضية
                    </span>
                  )}
                </p>
                <p className="text-[11px] truncate" style={{ color: T.mutedLight }}>
                  {z.cities || "بلا مدن — تعمل كافتراضية فقط"}
                </p>
              </div>
              <span className="num text-[11px] shrink-0" style={{ color: T.muted }}>
                {n(rates.filter((r) => r.zoneId === z.id).length)} سعر
              </span>
              {!z.isDefault && (
                <button onClick={() => call({ action: "default-zone", id: z.id })} title="اجعلها افتراضية"
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: T.surfaceAlt, color: T.muted }}><Star size={14} /></button>
              )}
              <button onClick={() => call({ action: "delete-zone", id: z.id })}
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${T.danger}10`, color: T.danger }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* ══════════ الأسعار ══════════ */}
      {tab === "rates" && (
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl flex flex-col gap-3" style={card}>
            <h2 className="text-sm" style={{ color: T.primary, ...H }}>سعر جديد</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={label} style={{ color: T.mutedLight }}>المنطقة *</label>
                <select value={rForm.zoneId} onChange={(e) => setRForm({ ...rForm, zoneId: e.target.value })}
                        className={field} style={fieldStyle}>
                  <option value="">اختر…</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>الاسم *</label>
                <input value={rForm.name} onChange={(e) => setRForm({ ...rForm, name: e.target.value })}
                       placeholder="توصيل نفس اليوم" className={field} style={fieldStyle} />
              </div>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>السعر ({currency})</label>
                <input type="number" value={rForm.price} onChange={(e) => setRForm({ ...rForm, price: e.target.value })}
                       className={field} style={fieldStyle} />
              </div>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>مجاني فوق (اختياري)</label>
                <input type="number" value={rForm.freeOver} onChange={(e) => setRForm({ ...rForm, freeOver: e.target.value })}
                       placeholder="300" className={field} style={fieldStyle} />
              </div>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>مدة التسليم</label>
                <input value={rForm.etaText} onChange={(e) => setRForm({ ...rForm, etaText: e.target.value })}
                       placeholder="خلال ٣ ساعات" className={field} style={fieldStyle} />
              </div>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>الشركة</label>
                <select value={rForm.carrier} onChange={(e) => setRForm({ ...rForm, carrier: e.target.value })}
                        className={field} style={fieldStyle}>
                  {carrierList.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rForm.sameDay}
                       onChange={(e) => setRForm({ ...rForm, sameDay: e.target.checked })}
                       style={{ accentColor: T.accent }} />
                <span className="text-[12px]" style={{ color: T.ink }}>توصيل نفس اليوم</span>
              </label>
              {rForm.sameDay && (
                <div>
                  <label className={label} style={{ color: T.mutedLight }}>ساعة القطع (٠–٢٣)</label>
                  <input type="number" min={0} max={23} value={rForm.cutoffHour}
                         onChange={(e) => setRForm({ ...rForm, cutoffHour: e.target.value })}
                         placeholder="18" className={`${field} w-32`} style={fieldStyle} />
                </div>
              )}
              <button onClick={addRate} disabled={busy || !rForm.zoneId || !rForm.name.trim()}
                      className="px-5 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5"
                      style={{ background: T.primary, color: "#fff", opacity: (rForm.zoneId && rForm.name.trim()) ? 1 : .5 }}>
                <Plus size={15} /> إضافة
              </button>
            </div>
            {rForm.sameDay && (
              <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>
                بعد ساعة القطع يختفي هذا الخيار من السلة تلقائيًا — لا نَعِد بما لا يُنفَّذ.
              </p>
            )}
          </div>

          {rates.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl flex flex-wrap items-center gap-3" style={{ ...card, opacity: r.active ? 1 : .55 }}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold flex items-center gap-2 flex-wrap" style={{ color: T.primary }}>
                  {r.name}
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: T.softTint, color: T.primary }}>
                    {zoneName(r.zoneId)}
                  </span>
                  {r.sameDay && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${T.accent}18`, color: T.accent }}>
                      نفس اليوم {r.cutoffHour != null ? `حتى ${r.cutoffHour}:00` : ""}
                    </span>
                  )}
                </p>
                <p className="text-[11px]" style={{ color: T.mutedLight }}>
                  {r.etaText || "—"}
                  {r.freeOver != null && ` · مجاني فوق ${n(r.freeOver)}`}
                  {` · ${carrierList.find((c) => c.code === r.carrier)?.name || r.carrier}`}
                </p>
              </div>
              <span className="num text-base shrink-0" style={{ color: T.primary, ...H }}>{n(r.price)} {currency}</span>
              <button onClick={() => call({ action: "toggle-rate", id: r.id, active: !r.active })}
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: r.active ? `${T.warning}15` : `${T.success}15`, color: r.active ? T.warning : T.success }}>
                <Power size={14} />
              </button>
              <button onClick={() => call({ action: "delete-rate", id: r.id })}
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${T.danger}10`, color: T.danger }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* ══════════ نوافذ التسليم ══════════ */}
      {tab === "slots" && (
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl flex flex-col gap-3" style={card}>
            <div>
              <h2 className="text-sm mb-1" style={{ color: T.primary, ...H }}>نافذة تسليم</h2>
              <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>
                الهدية لها وقت. النافذة تقلّل محاولات التسليم الفاشلة وترفع رضا العميل.
              </p>
            </div>
            <div className="grid sm:grid-cols-4 gap-3">
              <input value={sForm.label} onChange={(e) => setSForm({ ...sForm, label: e.target.value })}
                     placeholder="صباحًا" className={field} style={fieldStyle} />
              <input type="number" min={0} max={23} value={sForm.startHour}
                     onChange={(e) => setSForm({ ...sForm, startHour: e.target.value })}
                     placeholder="من" className={field} style={fieldStyle} />
              <input type="number" min={0} max={23} value={sForm.endHour}
                     onChange={(e) => setSForm({ ...sForm, endHour: e.target.value })}
                     placeholder="إلى" className={field} style={fieldStyle} />
              <input type="number" value={sForm.surcharge}
                     onChange={(e) => setSForm({ ...sForm, surcharge: e.target.value })}
                     placeholder={`رسم إضافي (${currency})`} className={field} style={fieldStyle} />
            </div>
            <button onClick={addSlot} disabled={busy || !sForm.label.trim()}
                    className="w-fit px-5 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5"
                    style={{ background: T.primary, color: "#fff", opacity: sForm.label.trim() ? 1 : .5 }}>
              <Plus size={15} /> إضافة
            </button>
          </div>

          {slots.map((s) => (
            <div key={s.id} className="p-4 rounded-2xl flex items-center gap-3" style={card}>
              <Clock size={15} style={{ color: T.accent }} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold" style={{ color: T.primary }}>{s.label}</p>
                <p className="num text-[11px]" style={{ color: T.mutedLight }}>
                  {s.startHour}:00 – {s.endHour}:00 {s.surcharge > 0 ? `· +${n(s.surcharge)} ${currency}` : ""}
                </p>
              </div>
              <button onClick={() => call({ action: "delete-slot", id: s.id })}
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${T.danger}10`, color: T.danger }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* ══════════ شركات الشحن ══════════ */}
      {tab === "carriers" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: T.softTint, border: `1px solid ${T.line}` }}>
            <ShieldCheck size={16} style={{ color: T.success }} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: T.ink }}>
              <strong>النظام يعمل بلا مفاتيح.</strong> أنشئ الشحنة في موقع الشركة، ألصق رقم البوليصة في الطلب،
              فيُولَّد رابط التتبّع تلقائيًا ويصل العميل. المفاتيح تضيف الإنشاء الآلي وطباعة البوليصة فقط.
              <br />
              المفاتيح تُحفظ على الخادم وتُعرض مقنّعة — لا تغادر القاعدة إلى المتصفح أبدًا.
            </p>
          </div>

          {carrierList.map((c) => {
            const cur = carriers[c.code] || {};
            const draft = cForm[c.code] || {};
            const on = draft.enabled ?? cur.enabled ?? false;
            return (
              <div key={c.code} className="p-5 rounded-2xl flex flex-col gap-3" style={card}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold flex items-center gap-2 flex-wrap" style={{ color: T.primary }}>
                      {c.name}
                      {!c.needsCredentials && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${T.success}18`, color: T.success }}>
                          جاهز بلا ربط
                        </span>
                      )}
                      {on && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${T.success}18`, color: T.success }}>
                          مفعّلة · {(draft.mode ?? cur.mode) === "live" ? "مباشر" : "اختبار"}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: T.muted }}>{c.hint}</p>
                  </div>
                  {c.docs && (
                    <a href={c.docs} target="_blank" rel="noopener noreferrer"
                       className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: T.surfaceAlt, color: T.muted }}><ExternalLink size={14} /></a>
                  )}
                </div>

                {c.needsCredentials && (
                  <>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {c.fields.includes("accountNumber") && (
                        <div>
                          <label className={label} style={{ color: T.mutedLight }}>
                            رقم الحساب {cur.hasAccount ? `(${cur.accountNumber})` : ""}
                          </label>
                          <input value={draft.accountNumber ?? ""} dir="ltr"
                                 onChange={(e) => setCF(c.code, "accountNumber", e.target.value)}
                                 placeholder={cur.hasAccount ? "اتركه فارغًا للإبقاء" : "—"}
                                 className={`${field} text-right`} style={fieldStyle} />
                        </div>
                      )}
                      {c.fields.includes("apiKey") && (
                        <div>
                          <label className={label} style={{ color: T.mutedLight }}>
                            مفتاح API {cur.hasKey ? `(${cur.apiKey})` : ""}
                          </label>
                          <input value={draft.apiKey ?? ""} dir="ltr" type="password"
                                 onChange={(e) => setCF(c.code, "apiKey", e.target.value)}
                                 placeholder={cur.hasKey ? "اتركه فارغًا للإبقاء" : "—"}
                                 className={`${field} text-right`} style={fieldStyle} />
                        </div>
                      )}
                      {c.fields.includes("apiSecret") && (
                        <div>
                          <label className={label} style={{ color: T.mutedLight }}>
                            السرّ {cur.hasSecret ? `(${cur.apiSecret})` : ""}
                          </label>
                          <input value={draft.apiSecret ?? ""} dir="ltr" type="password"
                                 onChange={(e) => setCF(c.code, "apiSecret", e.target.value)}
                                 placeholder={cur.hasSecret ? "اتركه فارغًا للإبقاء" : "—"}
                                 className={`${field} text-right`} style={fieldStyle} />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={on}
                               onChange={(e) => setCF(c.code, "enabled", e.target.checked)}
                               style={{ accentColor: T.accent }} />
                        <span className="text-[12px]" style={{ color: T.ink }}>مفعّلة</span>
                      </label>
                      <select value={draft.mode ?? cur.mode ?? "test"}
                              onChange={(e) => setCF(c.code, "mode", e.target.value)}
                              className={`${field} w-36`} style={fieldStyle}>
                        <option value="test">اختبار</option>
                        <option value="live">مباشر</option>
                      </select>
                      <button onClick={() => saveCarrier(c.code)} disabled={busy}
                              className="px-5 py-2.5 rounded-xl text-[12px] font-bold"
                              style={{ background: T.primary, color: "#fff" }}>حفظ</button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
