"use client";
import React, { useState } from "react";
import { Droplets, Zap, Gauge, ThermometerSun, HelpCircle, AlertOctagon, Send, ChevronRight } from "lucide-react";
import { C, buildWhatsAppLink } from "../../lib/colors.js";
import { trackLead } from "../../lib/analytics.js";

// اختيار العطل بالأيقونة أسرع بكثير من كتابته نصًا —
// وفي حالة الطوارئ كل ثانية تُحدث فرقًا في معدل الإكمال.
const ISSUES = [
  { key: "leak",     icon: Droplets,      label: "تسريب مياه",        hint: "ماء يتسرب من الجهاز أو الوصلات" },
  { key: "no_water", icon: Gauge,         label: "لا يخرج ماء",        hint: "الجهاز يعمل لكن بلا إنتاج" },
  { key: "power",    icon: Zap,           label: "عطل كهربائي",        hint: "لا يشتغل أو يفصل فجأة" },
  { key: "taste",    icon: ThermometerSun,label: "تغيّر الطعم/الرائحة", hint: "طعم غريب أو رائحة" },
  { key: "noise",    icon: AlertOctagon,  label: "صوت أو اهتزاز",      hint: "ضجيج غير معتاد" },
  { key: "other",    icon: HelpCircle,    label: "عطل آخر",            hint: "أصفه بنفسي" },
];

const SEVERITY = [
  { key: "flooding", label: "تسريب مستمر الآن", color: C.danger,  note: "أوقف محبس المياه فورًا" },
  { key: "stopped",  label: "الجهاز متوقف كليًا", color: C.warning, note: "بلا مياه نقية" },
  { key: "partial",  label: "يعمل لكن بمشكلة",   color: C.cyan,    note: "أداء غير طبيعي" },
];

export default function UrgentForm() {
  const [issue, setIssue] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", city: "", device: "", note: "" });
  const [touched, setTouched] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const phoneOk = form.phone.replace(/\D/g, "").length >= 9;
  const valid = form.name.trim() && phoneOk && issue;

  const chosenIssue = ISSUES.find((i) => i.key === issue);
  const chosenSev = SEVERITY.find((s) => s.key === severity);

  const submit = () => {
    setTouched(true);
    if (!valid) return;

    const msg =
      `🚨 *طلب صيانة عاجلة*\n\n` +
      `• الاسم: ${form.name}\n` +
      `• الجوال: ${form.phone}\n` +
      (form.city ? `• المدينة: ${form.city}\n` : "") +
      (form.device ? `• الجهاز: ${form.device}\n` : "") +
      `• نوع العطل: ${chosenIssue?.label}\n` +
      (chosenSev ? `• الحالة: ${chosenSev.label}\n` : "") +
      (form.note.trim() ? `\n📝 ${form.note.trim()}` : "") +
      `\n\nأرجو التواصل بأسرع وقت.`;

    trackLead("urgent_maintenance", null);
    window.open(buildWhatsAppLink(msg), "_blank");
  };

  const field = "w-full px-4 py-3 rounded-xl text-sm outline-none";
  const border = (bad) => ({ border: `1.5px solid ${touched && bad ? C.danger : C.line}`, background: "#fff" });

  return (
    <div className="flex flex-col gap-7">
      {/* الخطوة ١ — نوع العطل */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: issue ? C.success : C.navy, color: "#fff" }}>١</span>
          <h3 className="font-bold text-sm" style={{ color: C.navy }}>ما نوع العطل؟</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {ISSUES.map((it) => {
            const on = issue === it.key;
            return (
              <button
                key={it.key}
                onClick={() => setIssue(it.key)}
                aria-pressed={on}
                className="lift p-4 rounded-2xl flex flex-col items-center text-center gap-2"
                style={{
                  background: on ? C.navy : "#fff",
                  border: `1.5px solid ${on ? C.navy : (touched && !issue ? C.danger : C.line)}`,
                }}
              >
                <it.icon size={22} color={on ? C.mint : C.teal} strokeWidth={1.9} />
                <span className="font-bold text-[12px] leading-tight" style={{ color: on ? "#fff" : C.navy }}>
                  {it.label}
                </span>
                <span className="text-[10px] leading-tight hidden sm:block"
                      style={{ color: on ? "rgba(255,255,255,.65)" : C.slateLight }}>
                  {it.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* الخطوة ٢ — درجة الخطورة */}
      {issue && (
        <div className="rise">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: severity ? C.success : C.navy, color: "#fff" }}>٢</span>
            <h3 className="font-bold text-sm" style={{ color: C.navy }}>ما مدى استعجال الحالة؟</h3>
          </div>

          <div className="grid sm:grid-cols-3 gap-2.5">
            {SEVERITY.map((s) => {
              const on = severity === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSeverity(s.key)}
                  className="p-4 rounded-2xl text-right transition-colors"
                  style={{ background: on ? `${s.color}14` : "#fff", border: `1.5px solid ${on ? s.color : C.line}` }}
                >
                  <span className="flex items-center gap-2 font-bold text-[13px]" style={{ color: s.color }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="block text-[11px] mt-1" style={{ color: C.slate }}>{s.note}</span>
                </button>
              );
            })}
          </div>

          {severity === "flooding" && (
            <div className="rise mt-3 p-4 rounded-2xl flex items-start gap-3"
                 style={{ background: `${C.danger}0F`, border: `1px solid ${C.danger}44` }}>
              <AlertOctagon size={20} color={C.danger} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: C.danger }}>افعل هذا الآن قبل أن ترسل</p>
                <ol className="text-xs leading-relaxed list-decimal pr-4" style={{ color: C.ink }}>
                  <li>أغلق محبس المياه الرئيسي المغذّي للجهاز.</li>
                  <li>افصل الكهرباء عن الجهاز إن كان قريبًا من الماء.</li>
                  <li>ضع وعاءً أو منشفة لامتصاص التسريب.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* الخطوة ٣ — بياناتك */}
      {issue && (
        <div className="rise">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: valid ? C.success : C.navy, color: "#fff" }}>٣</span>
            <h3 className="font-bold text-sm" style={{ color: C.navy }}>كيف نصل إليك؟</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="الاسم الكامل *" value={form.name} onChange={set("name")}
                   className={field} style={border(!form.name.trim())} />
            <input placeholder="رقم الجوال *" value={form.phone} onChange={set("phone")}
                   type="tel" inputMode="tel" dir="ltr"
                   className={`${field} text-right`} style={border(!phoneOk)} />
            <input placeholder="المدينة" value={form.city} onChange={set("city")}
                   className={field} style={border(false)} />
            <input placeholder="نوع الجهاز أو الموديل" value={form.device} onChange={set("device")}
                   className={field} style={border(false)} />
          </div>

          <textarea placeholder="تفاصيل إضافية (اختياري) — متى بدأ العطل؟ هل جرّبت شيئًا؟"
                    value={form.note} onChange={set("note")} rows={3}
                    className={`${field} resize-none mt-3`} style={border(false)} />

          {touched && !valid && (
            <p className="text-xs font-bold mt-3 px-3 py-2 rounded-lg"
               style={{ background: `${C.danger}12`, color: C.danger }}>
              {!issue ? "اختر نوع العطل أولًا." : !form.name.trim() ? "الاسم مطلوب." : "رقم الجوال غير مكتمل."}
            </p>
          )}

          <button onClick={submit} className="btn pulse-urgent w-full py-4 text-sm mt-4"
                  style={{ background: C.danger, color: "#fff" }}>
            <Send size={17} /> أرسل الطلب العاجل الآن
          </button>

          <p className="text-[11px] text-center mt-2.5" style={{ color: C.slateLight }}>
            يفتح واتساب برسالة جاهزة تحتوي كل التفاصيل — راجعها ثم أرسل.
          </p>
        </div>
      )}

      {!issue && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: C.slateLight }}>
          <ChevronRight size={13} /> اختر نوع العطل أعلاه لتظهر بقية الخطوات.
        </p>
      )}
    </div>
  );
}
