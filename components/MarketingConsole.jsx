"use client";
/**
 * ═══════════════════════════════════════════════════════════
 *  وحدة تحكّم التسويق
 * ═══════════════════════════════════════════════════════════
 *  ثلاثة ألسنة: الكوبونات، السلات المتروكة، الحملات.
 *  المبدأ نفسه المتّبع في وحدة البحث: لا رقم بلا زرّ يعالجه.
 */
import React, { useState, useMemo } from "react";
import {
  Ticket, ShoppingCart, Megaphone, Plus, Trash2, Loader2, Check, Copy,
  MessageCircle, Power, ExternalLink, X,
} from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };
const n = (v) => Number(v || 0).toLocaleString("ar-SA");

const TABS = [
  { key: "coupons", label: "الكوبونات", icon: Ticket },
  { key: "carts", label: "السلات المتروكة", icon: ShoppingCart },
  { key: "campaigns", label: "الحملات", icon: Megaphone },
];

const TYPE_LABEL = { percent: "نسبة", fixed: "مبلغ", free_shipping: "شحن مجاني" };
const STATUS_LABEL = { open: "مفتوحة", contacted: "تواصلنا", recovered: "استُرجعت", dismissed: "مُهملة" };

export default function MarketingConsole({
  coupons: initCoupons = [], carts: initCarts = [], cartStats = {},
  campaigns: initCampaigns = [], campaignPerf = [], categories = [],
  siteUrl = "", currency = "ر.س",
}) {
  const [tab, setTab] = useState("coupons");
  const [coupons, setCoupons] = useState(initCoupons);
  const [carts, setCarts] = useState(initCarts);
  const [campaigns, setCampaigns] = useState(initCampaigns);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const card = { background: "#fff", border: `1px solid ${T.line}` };
  const field = "w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none";
  const fieldStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt };
  const label = "text-[10px] font-bold tracking-[.12em] uppercase mb-1.5 block";

  const call = async (payload) => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "تعذّر تنفيذ الإجراء."); return null; }
      return data;
    } finally { setBusy(false); }
  };

  /* ══ الكوبونات ══ */
  const [form, setForm] = useState({ code: "", type: "percent", value: "", minOrder: "", maxUses: "", perCustomerLimit: "", categorySlug: "", endsAt: "" });
  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const addCoupon = async () => {
    const res = await call({ action: "create-coupon", ...form });
    if (res?.coupon) {
      setCoupons([{ ...res.coupon, value: Number(res.coupon.value), usedCount: 0, discounted: 0, active: true }, ...coupons]);
      setForm({ code: "", type: "percent", value: "", minOrder: "", maxUses: "", perCustomerLimit: "", categorySlug: "", endsAt: "" });
    }
  };
  const toggleCoupon = async (c) => {
    if (await call({ action: "toggle-coupon", id: c.id, active: !c.active })) {
      setCoupons((l) => l.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)));
    }
  };
  const removeCoupon = async (id) => {
    if (await call({ action: "delete-coupon", id })) setCoupons((l) => l.filter((x) => x.id !== id));
  };

  /* ══ السلات ══ */
  const openCarts = useMemo(() => carts.filter((c) => c.status === "open" || c.status === "contacted"), [carts]);
  const cartStatus = async (id, status) => {
    if (await call({ action: "cart-status", id, status })) {
      setCarts((l) => l.map((c) => (c.id === id ? { ...c, status } : c)));
    }
  };
  const waLink = (c) => {
    const lines = c.items.map((i) => `• ${i.name} × ${i.qty}`).join("\n");
    const msg = `مرحبًا ${c.name || ""}\nلاحظنا أنك تركت هذه الأصناف في سلتك:\n\n${lines}\n\nهل نساعدك في إتمام الطلب؟`;
    const phone = String(c.phone || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  /* ══ الحملات ══ */
  const [cForm, setCForm] = useState({ name: "", source: "instagram", medium: "social", campaign: "", landingPath: "/" });
  const setC = (k) => (e) => setCForm({ ...cForm, [k]: e.target.value });
  const buildUrl = (c) => {
    const base = siteUrl || "https://your-domain.com";
    const u = `${base.replace(/\/$/, "")}${c.landingPath || "/"}`;
    const p = new URLSearchParams({ utm_source: c.source, utm_medium: c.medium || "", utm_campaign: c.campaign });
    return `${u}?${p.toString()}`;
  };
  const addCampaign = async () => {
    if (await call({ action: "create-campaign", ...cForm })) {
      setCampaigns([{ id: Math.random().toString(36), ...cForm }, ...campaigns]);
      setCForm({ name: "", source: "instagram", medium: "social", campaign: "", landingPath: "/" });
    }
  };
  const removeCampaign = async (id) => {
    if (await call({ action: "delete-campaign", id })) setCampaigns((l) => l.filter((c) => c.id !== id));
  };
  const copy = (text, key) => { navigator.clipboard?.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 2000); };

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
            {t.key === "carts" && openCarts.length > 0 && (
              <span className="num text-[10px] px-1.5 rounded-full"
                    style={{ background: tab === t.key ? "#ffffff30" : T.warning, color: "#fff" }}>
                {n(openCarts.length)}
              </span>
            )}
          </button>
        ))}
        {busy && <Loader2 size={15} className="animate-spin" style={{ color: T.accent }} />}
      </div>

      {error && (
        <p className="text-xs font-bold px-4 py-3 rounded-xl" style={{ background: `${T.danger}12`, color: T.danger }}>
          {error}
        </p>
      )}

      {/* ══════════ الكوبونات ══════════ */}
      {tab === "coupons" && (
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl flex flex-col gap-4" style={card}>
            <div>
              <h2 className="text-sm mb-1" style={{ color: T.primary, ...H }}>كوبون جديد</h2>
              <p className="text-[11px]" style={{ color: T.muted }}>
                الكود غير حسّاس لحالة الأحرف — «tulip10» و«TULIP10» واحد.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className={label} style={{ color: T.mutedLight }}>الكود *</label>
                <input value={form.code} onChange={setF("code")} dir="ltr" placeholder="TULIP10"
                       className={`${field} text-right uppercase`} style={fieldStyle} />
              </div>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>النوع</label>
                <select value={form.type} onChange={setF("type")} className={field} style={fieldStyle}>
                  <option value="percent">نسبة مئوية</option>
                  <option value="fixed">مبلغ ثابت</option>
                  <option value="free_shipping">شحن مجاني</option>
                </select>
              </div>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>
                  القيمة {form.type === "percent" ? "(٪)" : form.type === "fixed" ? `(${currency})` : "—"}
                </label>
                <input value={form.value} onChange={setF("value")} type="number" inputMode="numeric"
                       disabled={form.type === "free_shipping"}
                       className={field} style={{ ...fieldStyle, opacity: form.type === "free_shipping" ? .5 : 1 }} />
              </div>
            </div>

            <div className="grid sm:grid-cols-4 gap-3">
              <div>
                <label className={label} style={{ color: T.mutedLight }}>أقل مبلغ</label>
                <input value={form.minOrder} onChange={setF("minOrder")} type="number" placeholder="0"
                       className={field} style={fieldStyle} />
              </div>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>حد الاستخدام</label>
                <input value={form.maxUses} onChange={setF("maxUses")} type="number" placeholder="بلا حد"
                       className={field} style={fieldStyle} />
              </div>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>لكل عميل</label>
                <input value={form.perCustomerLimit} onChange={setF("perCustomerLimit")} type="number" placeholder="بلا حد"
                       className={field} style={fieldStyle} />
              </div>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>ينتهي في</label>
                <input value={form.endsAt} onChange={setF("endsAt")} type="date"
                       className={field} style={fieldStyle} />
              </div>
            </div>

            <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label className={label} style={{ color: T.mutedLight }}>مقيّد بقسم (اختياري)</label>
                <select value={form.categorySlug} onChange={setF("categorySlug")} className={field} style={fieldStyle}>
                  <option value="">كل الأقسام</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <button onClick={addCoupon} disabled={busy || !form.code.trim()}
                      className="px-6 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5"
                      style={{ background: T.primary, color: "#fff", opacity: form.code.trim() ? 1 : .5 }}>
                <Plus size={15} /> إنشاء
              </button>
            </div>
          </div>

          {coupons.length === 0 ? (
            <div className="p-10 rounded-2xl text-center" style={card}>
              <p className="text-sm" style={{ color: T.muted }}>لا كوبونات بعد.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {coupons.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl flex flex-wrap items-center gap-4"
                     style={{ ...card, opacity: c.active ? 1 : .55 }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold tracking-wider" dir="ltr" style={{ color: T.primary }}>{c.code}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: T.softTint, color: T.primary }}>
                        {TYPE_LABEL[c.type]}{c.type !== "free_shipping" ? ` ${n(c.value)}${c.type === "percent" ? "٪" : ""}` : ""}
                      </span>
                      {!c.active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: T.danger, color: "#fff" }}>موقوف</span>
                      )}
                    </div>
                    <p className="text-[11px]" style={{ color: T.muted }}>
                      {c.minOrder > 0 && `أقل مبلغ ${n(c.minOrder)} ${currency} · `}
                      {c.maxUses ? `${n(c.usedCount)}/${n(c.maxUses)} استخدام` : `${n(c.usedCount)} استخدام`}
                      {c.perCustomerLimit ? ` · ${n(c.perCustomerLimit)} لكل عميل` : ""}
                      {c.categorySlug ? ` · ${categories.find((x) => x.slug === c.categorySlug)?.name || c.categorySlug}` : ""}
                    </p>
                  </div>

                  <div className="text-center shrink-0">
                    <p className="text-[10px] font-bold mb-0.5" style={{ color: T.mutedLight }}>خُصم إجمالًا</p>
                    <p className="text-base leading-none num" style={{ color: T.primary, ...H }}>{n(c.discounted)}</p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => copy(c.code, c.id)} title="نسخ الكود"
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: T.softTint, color: T.primary }}>
                      {copied === c.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button onClick={() => toggleCoupon(c)} title={c.active ? "إيقاف" : "تفعيل"}
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: c.active ? `${T.warning}15` : `${T.success}15`, color: c.active ? T.warning : T.success }}>
                      <Power size={14} />
                    </button>
                    <button onClick={() => removeCoupon(c.id)} title="حذف"
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: `${T.danger}10`, color: T.danger }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ السلات المتروكة ══════════ */}
      {tab === "carts" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { l: "مفتوحة", v: n(cartStats.open) },
              { l: "قيمتها", v: `${n(cartStats.openValue)} ${currency}` },
              { l: "استُرجعت", v: n(cartStats.recovered) },
              { l: "نسبة الاسترجاع", v: `${cartStats.recoveryRate || 0}٪` },
            ].map((s) => (
              <div key={s.l} className="p-4 rounded-2xl" style={{ background: T.softTint, border: `1px solid ${T.line}` }}>
                <p className="text-[11px] font-bold mb-1.5" style={{ color: T.muted }}>{s.l}</p>
                <p className="text-lg leading-none" style={{ color: T.primary, ...H }}>{s.v}</p>
              </div>
            ))}
          </div>

          <p className="text-[11px] px-4 py-3 rounded-xl leading-relaxed" style={{ background: T.surfaceAlt, color: T.muted }}>
            السلة تُسجَّل بعد سكون ثماني ثوانٍ من آخر تغيير، وتُعلَّم «استُرجعت» تلقائيًا فور إتمام الطلب من نفس الجهاز.
            زرّ واتساب يظهر فقط لمن ترك رقمه.
          </p>

          {carts.length === 0 ? (
            <div className="p-10 rounded-2xl text-center" style={card}>
              <p className="text-sm" style={{ color: T.muted }}>لا سلات مسجّلة بعد.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {carts.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl flex flex-wrap items-center gap-4"
                     style={{ ...card, opacity: c.status === "recovered" || c.status === "dismissed" ? .6 : 1 }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold" style={{ color: T.primary }}>
                        {c.name || "زائر بلا اسم"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{
                              background: c.status === "recovered" ? `${T.success}18` : c.status === "open" ? `${T.warning}18` : T.softTint,
                              color: c.status === "recovered" ? T.success : c.status === "open" ? T.warning : T.muted,
                            }}>
                        {STATUS_LABEL[c.status]}
                      </span>
                      {c.phone && <span className="text-[11px]" dir="ltr" style={{ color: T.muted }}>{c.phone}</span>}
                    </div>
                    <p className="text-[11px] truncate" style={{ color: T.muted }}>
                      {c.items.map((i) => `${i.name} ×${i.qty}`).join(" · ") || "—"}
                    </p>
                  </div>

                  <p className="num text-base shrink-0" style={{ color: T.primary, ...H }}>
                    {n(c.total)} {currency}
                  </p>

                  <div className="flex gap-2 shrink-0">
                    {c.phone && c.status !== "recovered" && (
                      <a href={waLink(c)} target="_blank" rel="noopener noreferrer"
                         onClick={() => cartStatus(c.id, "contacted")}
                         title="تواصل عبر واتساب"
                         className="w-9 h-9 rounded-xl flex items-center justify-center"
                         style={{ background: "#25D36618", color: "#128C7E" }}>
                        <MessageCircle size={15} />
                      </a>
                    )}
                    {c.status !== "recovered" && (
                      <button onClick={() => cartStatus(c.id, "dismissed")} title="إهمال"
                              className="w-9 h-9 rounded-xl flex items-center justify-center"
                              style={{ background: T.surfaceAlt, color: T.muted }}>
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ الحملات ══════════ */}
      {tab === "campaigns" && (
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl flex flex-col gap-4" style={card}>
            <div>
              <h2 className="text-sm mb-1" style={{ color: T.primary, ...H }}>رابط حملة جديد</h2>
              <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>
                الرابط يحمل وسوم UTM، فيُنسَب كل طلب قادم منه إلى حملته تلقائيًا في تقرير الأداء أدناه.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input value={cForm.name} onChange={setC("name")} placeholder="اسم داخلي *" className={field} style={fieldStyle} />
              <input value={cForm.source} onChange={setC("source")} dir="ltr" placeholder="utm_source" className={`${field} text-right`} style={fieldStyle} />
              <input value={cForm.medium} onChange={setC("medium")} dir="ltr" placeholder="utm_medium" className={`${field} text-right`} style={fieldStyle} />
              <input value={cForm.campaign} onChange={setC("campaign")} dir="ltr" placeholder="utm_campaign *" className={`${field} text-right`} style={fieldStyle} />
              <input value={cForm.landingPath} onChange={setC("landingPath")} dir="ltr" placeholder="/shop" className={`${field} text-right`} style={fieldStyle} />
            </div>
            <button onClick={addCampaign} disabled={busy || !cForm.name.trim() || !cForm.campaign.trim()}
                    className="w-fit px-6 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-1.5"
                    style={{ background: T.primary, color: "#fff", opacity: (cForm.name.trim() && cForm.campaign.trim()) ? 1 : .5 }}>
              <Plus size={15} /> إنشاء الرابط
            </button>
            {!siteUrl && (
              <p className="text-[11px]" style={{ color: T.warning }}>
                ⚠️ اضبط <code>NEXT_PUBLIC_SITE_URL</code> ليُبنى الرابط بدومينك الحقيقي.
              </p>
            )}
          </div>

          {campaigns.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {campaigns.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl flex items-center gap-3" style={card}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold mb-1" style={{ color: T.primary }}>{c.name}</p>
                    <p className="text-[10px] truncate" dir="ltr" style={{ color: T.muted, textAlign: "right" }}>
                      {buildUrl(c)}
                    </p>
                  </div>
                  <button onClick={() => copy(buildUrl(c), c.id)}
                          className="px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0"
                          style={{ background: T.softTint, color: T.primary }}>
                    {copied === c.id ? <Check size={13} /> : <Copy size={13} />} {copied === c.id ? "نُسخ" : "نسخ"}
                  </button>
                  <button onClick={() => removeCampaign(c.id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${T.danger}10`, color: T.danger }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-5 rounded-2xl" style={card}>
            <h2 className="text-sm mb-1" style={{ color: T.primary, ...H }}>أداء آخر ٣٠ يومًا</h2>
            <p className="text-[11px] mb-4" style={{ color: T.muted }}>
              محسوب من الطلبات الفعلية لا من عدّاد منفصل.
            </p>
            {campaignPerf.length === 0 ? (
              <p className="text-xs py-6 text-center" style={{ color: T.mutedLight }}>لا طلبات في الفترة.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {campaignPerf.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: T.surfaceAlt }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold truncate" style={{ color: T.ink }}>{r.campaign}</p>
                      <p className="text-[10px]" style={{ color: T.muted }}>{r.source} · {r.medium}</p>
                    </div>
                    <span className="num text-[11px] shrink-0" style={{ color: T.muted }}>{n(r.orders)} طلب</span>
                    <span className="num text-sm shrink-0" style={{ color: T.primary, ...H }}>{n(r.revenue)} {currency}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
