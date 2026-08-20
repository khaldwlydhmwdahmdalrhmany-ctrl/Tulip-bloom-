"use client";
/**
 * ═══════════════════════════════════════════════════════════
 *  وحدة تحكّم المدفوعات
 * ═══════════════════════════════════════════════════════════
 *  ثلاثة ألسنة: البوابات، العمليات، أحداث التأكيد.
 */
import React, { useState } from "react";
import {
  CreditCard, Receipt, Webhook, Loader2, Check, Copy, ExternalLink,
  ShieldCheck, AlertTriangle, Banknote, RotateCcw,
} from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };
const n = (v) => Number(v || 0).toLocaleString("ar-SA");
const fmt = (d) => (d ? new Date(d).toLocaleString("ar-SA") : "—");

const TABS = [
  { key: "gateways", label: "البوابات", icon: CreditCard },
  { key: "payments", label: "العمليات", icon: Receipt },
  { key: "events", label: "أحداث التأكيد", icon: Webhook },
];

const STATUS = {
  pending:    { label: "معلّقة",  tone: T.warning },
  authorized: { label: "محجوزة",  tone: T.accent },
  paid:       { label: "مدفوعة",  tone: T.success },
  failed:     { label: "فاشلة",   tone: T.danger },
  refunded:   { label: "مستردّة", tone: T.muted },
  cancelled:  { label: "ملغاة",   tone: T.muted },
};

export default function PaymentsConsole({
  gateways: g0 = {}, gatewayList = [], methodLabels = {},
  payments: p0 = [], stats = {}, events = [], webhookBase = "", currency = "ر.س",
}) {
  const [tab, setTab] = useState("gateways");
  const [gateways, setGateways] = useState(g0);
  const [payments, setPayments] = useState(p0);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const card = { background: "#fff", border: `1px solid ${T.line}` };
  const field = "w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none";
  const fieldStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt };
  const label = "text-[10px] font-bold tracking-[.12em] uppercase mb-1.5 block";

  const setF = (code, k, v) => setForm((f) => ({ ...f, [code]: { ...(f[code] || {}), [k]: v } }));

  const call = async (payload) => {
    setBusy(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || "تعذّر التنفيذ."); return null; }
      if (d.gateways) setGateways(d.gateways);
      if (d.payments) setPayments(d.payments.map((p) => ({ ...p, amount: Number(p.amount || 0) })));
      setSaved(true); setTimeout(() => setSaved(false), 2200);
      return d;
    } finally { setBusy(false); }
  };

  const saveGateway = async (code) => {
    const cur = gateways[code] || {};
    const draft = form[code] || {};
    const payload = {
      action: "save-gateway", code,
      enabled: draft.enabled ?? cur.enabled ?? false,
      mode: draft.mode ?? cur.mode ?? "test",
      publishableKey: draft.publishableKey ?? "",
      secretKey: draft.secretKey ?? "",
      webhookSecret: draft.webhookSecret ?? "",
    };
    // بيانات التحويل البنكي ليست سرّية — تُحفظ كما هي
    if (code === "bank_transfer") {
      payload.extra = {
        bankName: draft.bankName ?? cur.extra?.bankName ?? "",
        accountName: draft.accountName ?? cur.extra?.accountName ?? "",
        iban: draft.iban ?? cur.extra?.iban ?? "",
      };
    }
    await call(payload);
    setForm((f) => ({ ...f, [code]: {} }));
  };

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key); setTimeout(() => setCopied(""), 2000);
  };

  const liveWithoutWebhook = gatewayList.filter(
    (g) => g.needsKeys && gateways[g.code]?.enabled && !gateways[g.code]?.hasWebhook
  );

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

      {liveWithoutWebhook.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: `${T.danger}0D`, border: `1px solid ${T.danger}44` }}>
          <AlertTriangle size={16} style={{ color: T.danger }} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: T.ink }}>
            <strong>{liveWithoutWebhook.map((g) => g.name).join("، ")}</strong> مفعّلة بلا سرّ webhook.
            بدونه لا يُقبل أي تأكيد دفع — ستبقى كل العمليات «معلّقة» حتى لو دفع العميل فعلًا.
          </p>
        </div>
      )}

      {/* ══════════ البوابات ══════════ */}
      {tab === "gateways" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: T.softTint, border: `1px solid ${T.line}` }}>
            <ShieldCheck size={16} style={{ color: T.success }} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: T.ink }}>
              <strong>الدفع عند الاستلام والتحويل البنكي يعملان بلا أي مفتاح</strong> — فعّلهما وابدأ اليوم.
              البوابات الإلكترونية تعمل فور إضافة مفاتيحها.
              <br />
              المفاتيح تُحفظ على الخادم وتُعرض مقنّعة، ولا تغادر القاعدة إلى المتصفح إطلاقًا.
            </p>
          </div>

          {gatewayList.map((g) => {
            const cur = gateways[g.code] || {};
            const draft = form[g.code] || {};
            const on = draft.enabled ?? cur.enabled ?? false;
            const hookUrl = `${webhookBase}${g.code}`;
            return (
              <div key={g.code} className="p-5 rounded-2xl flex flex-col gap-3" style={card}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold flex items-center gap-2 flex-wrap" style={{ color: T.primary }}>
                      {g.name}
                      {!g.needsKeys && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${T.success}18`, color: T.success }}>
                          بلا مفاتيح
                        </span>
                      )}
                      {on && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ background: `${T.success}18`, color: T.success }}>
                          مفعّلة{g.needsKeys ? ` · ${(draft.mode ?? cur.mode) === "live" ? "مباشر" : "اختبار"}` : ""}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: T.muted }}>{g.hint}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {g.methods.map((m) => (
                        <span key={m} className="text-[10px] px-2 py-0.5 rounded" style={{ background: T.surfaceAlt, color: T.muted }}>
                          {methodLabels[m] || m}
                        </span>
                      ))}
                    </div>
                  </div>
                  {g.docs && (
                    <a href={g.docs} target="_blank" rel="noopener noreferrer"
                       className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: T.surfaceAlt, color: T.muted }}><ExternalLink size={14} /></a>
                  )}
                </div>

                {/* بيانات التحويل البنكي */}
                {g.code === "bank_transfer" && (
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className={label} style={{ color: T.mutedLight }}>اسم البنك</label>
                      <input value={draft.bankName ?? cur.extra?.bankName ?? ""}
                             onChange={(e) => setF(g.code, "bankName", e.target.value)}
                             className={field} style={fieldStyle} />
                    </div>
                    <div>
                      <label className={label} style={{ color: T.mutedLight }}>اسم الحساب</label>
                      <input value={draft.accountName ?? cur.extra?.accountName ?? ""}
                             onChange={(e) => setF(g.code, "accountName", e.target.value)}
                             className={field} style={fieldStyle} />
                    </div>
                    <div>
                      <label className={label} style={{ color: T.mutedLight }}>الآيبان</label>
                      <input value={draft.iban ?? cur.extra?.iban ?? ""} dir="ltr"
                             onChange={(e) => setF(g.code, "iban", e.target.value)}
                             placeholder="SA00 0000 0000 0000"
                             className={`${field} text-right`} style={fieldStyle} />
                    </div>
                  </div>
                )}

                {g.needsKeys && (
                  <>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {g.fields.includes("publishableKey") && (
                        <div>
                          <label className={label} style={{ color: T.mutedLight }}>
                            المفتاح العام {cur.hasPublishable ? `(${cur.publishableKey})` : ""}
                          </label>
                          <input value={draft.publishableKey ?? ""} dir="ltr"
                                 onChange={(e) => setF(g.code, "publishableKey", e.target.value)}
                                 placeholder={cur.hasPublishable ? "اتركه فارغًا للإبقاء" : "pk_…"}
                                 className={`${field} text-right`} style={fieldStyle} />
                        </div>
                      )}
                      {g.fields.includes("secretKey") && (
                        <div>
                          <label className={label} style={{ color: T.mutedLight }}>
                            المفتاح السرّي {cur.hasSecret ? `(${cur.secretKey})` : ""}
                          </label>
                          <input value={draft.secretKey ?? ""} dir="ltr" type="password"
                                 onChange={(e) => setF(g.code, "secretKey", e.target.value)}
                                 placeholder={cur.hasSecret ? "اتركه فارغًا للإبقاء" : "sk_…"}
                                 className={`${field} text-right`} style={fieldStyle} />
                        </div>
                      )}
                      {g.fields.includes("webhookSecret") && (
                        <div>
                          <label className={label} style={{ color: T.mutedLight }}>
                            سرّ الـwebhook {cur.hasWebhook ? `(${cur.webhookSecret})` : ""}
                          </label>
                          <input value={draft.webhookSecret ?? ""} dir="ltr" type="password"
                                 onChange={(e) => setF(g.code, "webhookSecret", e.target.value)}
                                 placeholder={cur.hasWebhook ? "اتركه فارغًا للإبقاء" : "مطلوب لتأكيد الدفع"}
                                 className={`${field} text-right`} style={fieldStyle} />
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-xl" style={{ background: T.surfaceAlt }}>
                      <p className="text-[10px] font-bold mb-1.5" style={{ color: T.mutedLight }}>
                        رابط الـwebhook — الصقه في لوحة {g.name}
                      </p>
                      <div className="flex gap-2">
                        <input readOnly value={hookUrl} dir="ltr"
                               className="flex-1 px-3 py-2 rounded-lg text-[11px]"
                               style={{ border: `1px solid ${T.line}`, background: "#fff" }} />
                        <button onClick={() => copy(hookUrl, g.code)}
                                className="px-3 rounded-lg text-[11px] font-bold flex items-center gap-1.5"
                                style={{ background: copied === g.code ? T.success : T.primary, color: "#fff" }}>
                          <Copy size={12} /> {copied === g.code ? "نُسخ" : "نسخ"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={on}
                           onChange={(e) => setF(g.code, "enabled", e.target.checked)}
                           style={{ accentColor: T.accent }} />
                    <span className="text-[12px]" style={{ color: T.ink }}>مفعّلة للعملاء</span>
                  </label>
                  {g.needsKeys && (
                    <select value={draft.mode ?? cur.mode ?? "test"}
                            onChange={(e) => setF(g.code, "mode", e.target.value)}
                            className={`${field} w-36`} style={fieldStyle}>
                      <option value="test">اختبار</option>
                      <option value="live">مباشر</option>
                    </select>
                  )}
                  <button onClick={() => saveGateway(g.code)} disabled={busy}
                          className="px-5 py-2.5 rounded-xl text-[12px] font-bold"
                          style={{ background: T.primary, color: "#fff" }}>حفظ</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════ العمليات ══════════ */}
      {tab === "payments" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { l: "محاولات (٣٠ يومًا)", v: n(stats.attempts) },
              { l: "ناجحة", v: n(stats.paid) },
              { l: "نسبة النجاح", v: `${stats.successRate || 0}٪` },
              { l: "المحصّل", v: `${n(stats.revenue)} ${currency}` },
            ].map((s) => (
              <div key={s.l} className="p-4 rounded-2xl" style={{ background: T.softTint, border: `1px solid ${T.line}` }}>
                <p className="text-[11px] font-bold mb-1.5" style={{ color: T.muted }}>{s.l}</p>
                <p className="text-lg leading-none" style={{ color: T.primary, ...H }}>{s.v}</p>
              </div>
            ))}
          </div>

          {payments.length === 0 ? (
            <div className="p-10 rounded-2xl text-center" style={card}>
              <p className="text-sm" style={{ color: T.muted }}>لا عمليات بعد.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {payments.map((p) => {
                const st = STATUS[p.status] || STATUS.pending;
                return (
                  <div key={p.id} className="p-4 rounded-2xl flex flex-wrap items-center gap-3" style={card}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold flex items-center gap-2 flex-wrap" style={{ color: T.primary }}>
                        {gatewayList.find((g) => g.code === p.gateway)?.name || p.gateway}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                              style={{ background: `${st.tone}18`, color: st.tone }}>{st.label}</span>
                      </p>
                      <p className="text-[11px]" style={{ color: T.mutedLight }}>
                        {fmt(p.createdAt)}
                        {p.providerRef ? ` · ${p.providerRef}` : ""}
                        {p.failureReason ? ` · ${p.failureReason}` : ""}
                      </p>
                    </div>
                    <span className="num text-base shrink-0" style={{ color: T.primary, ...H }}>
                      {n(p.amount)} {currency}
                    </span>
                    {p.status !== "paid" && p.status !== "refunded" && (
                      <button onClick={() => call({ action: "mark-paid", paymentId: p.id, orderId: p.orderId })}
                              disabled={busy} title="تأكيد الاستلام يدويًا"
                              className="px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0"
                              style={{ background: `${T.success}15`, color: T.success }}>
                        <Banknote size={13} /> تأكيد الدفع
                      </button>
                    )}
                    {p.status === "paid" && (
                      <button onClick={() => call({ action: "mark-refunded", paymentId: p.id, orderId: p.orderId })}
                              disabled={busy} title="تعليم كمستردّة"
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: T.surfaceAlt, color: T.muted }}>
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════ الأحداث ══════════ */}
      {tab === "events" && (
        <div className="flex flex-col gap-4">
          <p className="text-[11px] px-4 py-3 rounded-xl leading-relaxed" style={{ background: T.surfaceAlt, color: T.muted }}>
            كل حدث يصل من بوابة يُسجَّل هنا بمعرّفه الفريد. الحدث المكرّر يُرفض تلقائيًا —
            البوابات تعيد الإرسال حتى تتلقّى ردًّا ناجحًا، وبلا هذا السجلّ يُعالَج الدفع مرتين.
          </p>
          {events.length === 0 ? (
            <div className="p-10 rounded-2xl text-center" style={card}>
              <Webhook size={22} style={{ color: T.mutedLight }} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: T.muted }}>لا أحداث بعد.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {events.map((e) => (
                <div key={e.id} className="p-3.5 rounded-xl flex items-center gap-3" style={card}>
                  <span className="text-[11px] px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: T.softTint, color: T.primary }}>{e.gateway}</span>
                  <span className="text-[12px] flex-1 truncate" dir="ltr" style={{ color: T.ink, textAlign: "right" }}>
                    {e.eventId}
                  </span>
                  <span className="text-[11px] shrink-0" style={{ color: T.mutedLight }}>{e.type}</span>
                  <span className="num text-[11px] shrink-0" style={{ color: T.mutedLight }}>{fmt(e.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
