"use client";
import React, { useState } from "react";
import { Send, Loader2, CheckCircle2, Copy, Check, MessageCircle, ChevronLeft } from "lucide-react";
import { C, G, buildWhatsAppLink } from "../../lib/colors.js";
import { trackLead } from "../../lib/analytics.js";
import { SERVICE_OPTIONS } from "../../config/content.config.js";

const DEVICE_TYPES = SERVICE_OPTIONS.deviceTypes;
const ISSUES = SERVICE_OPTIONS.issues;
const TIMES = SERVICE_OPTIONS.timeSlots;





export default function TechnicianForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    device: "", issue: "", city: "", district: "", name: "", phone: "", time: TIMES[0], notes: "",
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canNext = [
    () => form.device,
    () => form.issue,
    () => form.city.trim() && form.name.trim() && form.phone.replace(/\D/g, "").length >= 9,
  ];

  const submit = async () => {
    if (!canNext[2]()) { setError("أكمل الاسم والجوال والمدينة."); return; }
    setError(""); setSending(true);

    const items = [{ id: "svc", name: `طلب فني — ${form.issue}`, qty: 1, price: 0 }];
    let ref = null;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerPhone: form.phone,
          customerCity: `${form.city}${form.district ? " — " + form.district : ""}`,
          items, total: 0,
        }),
      });
      if (res.ok) ref = (await res.json())?.orderNumber || null;
    } catch {}

    const msg =
      `طلب زيارة فني 🛠️\n\n` +
      (ref ? `رقم الطلب: ${ref}\n\n` : "") +
      `• الجهاز: ${form.device}\n• المشكلة: ${form.issue}\n` +
      `• المدينة: ${form.city}${form.district ? " — " + form.district : ""}\n` +
      `• الوقت المفضّل: ${form.time}\n` +
      `• الاسم: ${form.name}\n• الجوال: ${form.phone}` +
      (form.notes.trim() ? `\n\nملاحظات: ${form.notes.trim()}` : "");

    setSending(false);
    setDone({ ref, link: buildWhatsAppLink(msg) });
    trackLead("technician_request", null);
    window.open(buildWhatsAppLink(msg), "_blank");
  };

  const copyRef = async () => {
    try { await navigator.clipboard.writeText(done.ref); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const field = "w-full px-4 py-3 rounded-xl text-sm outline-none";
  const fStyle = { border: `1.5px solid ${C.line}`, background: "#fff" };

  // ═══ شاشة النجاح ═══
  if (done) {
    return (
      <div className="rise p-8 rounded-3xl text-center flex flex-col items-center gap-4" style={{ background: G.deep }}>
        <div className="relative inline-flex items-center justify-center">
          <span className="absolute w-16 h-16 rounded-full ring-out" style={{ background: C.mint }} />
          <span className="relative w-16 h-16 rounded-full flex items-center justify-center pop-in" style={{ background: C.mint }}>
            <CheckCircle2 size={32} color={C.navyDeep} strokeWidth={2.2} />
          </span>
        </div>

        <h3 className="font-display text-xl" style={{ color: "#fff" }}>وصلنا طلبك</h3>
        <p className="text-sm max-w-sm" style={{ color: "rgba(255,255,255,.75)" }}>
          فتحنا لك واتساب لتأكيد الموعد مع فريق الصيانة.
        </p>

        {done.ref && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,.12)" }}>
            <span className="text-xs" style={{ color: "rgba(255,255,255,.7)" }}>رقم الطلب</span>
            <span className="font-display text-base tracking-wide" dir="ltr" style={{ color: "#fff" }}>{done.ref}</span>
            <button onClick={copyRef} className="btn px-2.5 py-1.5 text-[11px]" style={{ background: copied ? C.success : "#fff", color: copied ? "#fff" : C.navy }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        )}

        <a href={done.link} target="_blank" rel="noopener noreferrer" className="btn px-6 py-3 text-sm mt-1" style={{ background: "#25D366", color: "#fff" }}>
          <MessageCircle size={16} /> لم يفتح واتساب؟ اضغط هنا
        </a>
      </div>
    );
  }

  const STEPS = ["نوع الجهاز", "المشكلة", "بياناتك"];

  return (
    <div className="p-6 sm:p-8 rounded-3xl" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      {/* مؤشر الخطوات */}
      <div className="flex items-center gap-2 mb-7">
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors duration-300"
                style={i <= step ? { background: C.navy, color: "#fff" } : { background: C.offWhite, color: C.slateLight }}
              >
                {i < step ? <Check size={13} /> : i + 1}
              </span>
              <span className="text-[11px] font-bold hidden sm:block" style={{ color: i <= step ? C.navy : C.slateLight }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="flex-1 h-0.5 rounded-full transition-colors duration-300" style={{ background: i < step ? C.teal : C.line }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* الخطوة ١ */}
      {step === 0 && (
        <div className="rise flex flex-col gap-3">
          <h3 className="font-bold text-sm mb-1" style={{ color: C.navy }}>ما نوع الجهاز؟</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {DEVICE_TYPES.map((d) => (
              <button
                key={d}
                onClick={() => { set("device", d); setStep(1); }}
                className="px-4 py-3.5 rounded-xl text-xs sm:text-[13px] font-bold text-right transition-all duration-200"
                style={form.device === d
                  ? { background: C.navy, color: "#fff" }
                  : { background: C.offWhite, color: C.navy, border: `1.5px solid ${C.line}` }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* الخطوة ٢ */}
      {step === 1 && (
        <div className="rise flex flex-col gap-3">
          <h3 className="font-bold text-sm mb-1" style={{ color: C.navy }}>ما المشكلة التي تواجهها؟</h3>
          <div className="flex flex-col gap-2">
            {ISSUES.map((iss) => (
              <button
                key={iss}
                onClick={() => { set("issue", iss); setStep(2); }}
                className="group px-4 py-3 rounded-xl text-[13px] font-semibold text-right flex items-center justify-between transition-all duration-200"
                style={form.issue === iss
                  ? { background: C.navy, color: "#fff" }
                  : { background: C.offWhite, color: C.ink, border: `1.5px solid ${C.line}` }}
              >
                {iss}
                <ChevronLeft size={15} className="arrow-slide opacity-40" />
              </button>
            ))}
          </div>
          <button onClick={() => setStep(0)} className="text-xs font-bold self-start mt-2" style={{ color: C.slate }}>← رجوع</button>
        </div>
      )}

      {/* الخطوة ٣ */}
      {step === 2 && (
        <div className="rise flex flex-col gap-4">
          <h3 className="font-bold text-sm" style={{ color: C.navy }}>أين نصلك ومتى؟</h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="المدينة *" className={field} style={fStyle} />
            <input value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="الحي (اختياري)" className={field} style={fStyle} />
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="الاسم *" className={field} style={fStyle} />
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} type="tel" inputMode="tel" dir="ltr" placeholder="05XXXXXXXX *" className={`${field} text-right`} style={fStyle} />
          </div>

          <div>
            <label className="text-xs font-bold block mb-2" style={{ color: C.navy }}>الوقت المفضّل للزيارة</label>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((t) => (
                <button
                  key={t}
                  onClick={() => set("time", t)}
                  className="px-3.5 py-2 rounded-full text-[11px] font-bold transition-colors duration-200"
                  style={form.time === t ? { background: C.teal, color: "#fff" } : { background: C.offWhite, color: C.slate }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="تفاصيل إضافية (اختياري) — متى بدأ العطل، موديل الجهاز…" className={`${field} resize-none`} style={fStyle} />

          {error && <p className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: `${C.danger}12`, color: C.danger }}>{error}</p>}

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="btn px-5 py-3.5 text-sm" style={{ background: C.offWhite, color: C.slate }}>رجوع</button>
            <button onClick={submit} disabled={sending} className="btn flex-1 py-3.5 text-sm" style={{ background: C.navy, color: "#fff" }}>
              {sending ? <><Loader2 size={16} className="animate-spin" /> جارٍ الإرسال…</> : <><Send size={16} /> أرسل طلب الفني</>}
            </button>
          </div>

          <p className="text-[11px] text-center" style={{ color: C.slateLight }}>
            يُسجَّل الطلب برقم مرجعي ثم يفتح واتساب لتأكيد الموعد.
          </p>
        </div>
      )}
    </div>
  );
}
