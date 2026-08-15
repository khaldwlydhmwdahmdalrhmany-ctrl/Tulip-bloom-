"use client";
/**
 * ═══════════════════════════════════════════════════════════
 *  أقسام تفاعلية — توليب بلوم
 * ═══════════════════════════════════════════════════════════
 *
 *  ملف مضاف. لم يُلمس أي مكوّن نواة.
 *
 *  هذه الأقسام تحتاج حالة أو مؤقّتًا في المتصفح، فهي مكوّنات عميل.
 *  `registry.jsx` مكوّن خادم، لذلك تُستورد منه وتُستهلك كأي قسم آخر.
 */

import React, { useState, useEffect, useMemo } from "react";
import { C, SH, buildWhatsAppLink } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";

/* ═══════════════════════════════════════════════════════════
 *  ١) عدّاد قطع الطلب
 * ═══════════════════════════════════════════════════════════
 *  «اطلب خلال ٣ س ١٢ د ليصل اليوم».
 *
 *  السبب في وجوده: الورد سلعة موقوتة — قرار الشراء يتأجّل بسهولة،
 *  والعدّاد يحوّل التأجيل إلى تكلفة مرئية. وهو صادق لا مصطنع:
 *  يعكس موعد قطع تجهيز فعليًا، ويتحوّل تلقائيًا إلى رسالة
 *  «التسليم غدًا» بعد انقضائه بدل أن يكذب.
 */
export function DeliveryCountdown({ cutoffHour = 18, background }) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setHours(cutoffHour, 0, 0, 0);
      setLeft(cutoff > now ? cutoff - now : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cutoffHour]);

  // لا نعرض شيئًا قبل أن يعمل المؤقّت — يمنع اختلاف الخادم عن المتصفح
  if (left === null) return null;

  const open = left > 0;
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const pad = (v) => String(v).padStart(2, "0");

  const Unit = ({ v, label }) => (
    <span className="flex flex-col items-center gap-0.5">
      <span
        className="num text-xl sm:text-2xl font-bold tabular-nums px-2.5 py-1 rounded-lg"
        style={{ background: "#fff", color: C.navy, minWidth: "2.6rem" }}
      >
        {pad(v)}
      </span>
      <span className="text-[9px]" style={{ color: C.slate }}>{label}</span>
    </span>
  );

  return (
    <section style={{ background: background === "alt" ? C.offWhite : "transparent" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div
          className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-center sm:text-right"
          style={{ background: C.mintTint, border: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${open ? "beat" : ""}`}
                  style={{ background: open ? C.teal : C.slateLight }} />
            <p className="text-sm font-bold leading-snug" style={{ color: C.navy }}>
              {open ? "اطلب الآن ليصلك اليوم" : "انتهى وقت التوصيل لليوم"}
            </p>
          </div>

          {open ? (
            <div className="flex items-center gap-2" dir="ltr">
              <Unit v={h} label="ساعة" />
              <Unit v={m} label="دقيقة" />
              <Unit v={s} label="ثانية" />
            </div>
          ) : (
            <p className="text-xs" style={{ color: C.slate }}>
              الطلبات الواردة الآن تُسلَّم غدًا — راسلنا لو الأمر مستعجل.
            </p>
          )}

          <p className="text-xs leading-relaxed max-w-xs" style={{ color: C.slate }}>
            آخر موعد للطلبات المُسلَّمة في نفس اليوم داخل الرياض هو {cutoffHour}:00 مساءً.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
 *  ٢) مُرشِّح الهدايا
 * ═══════════════════════════════════════════════════════════
 *  ثلاثة أسئلة تنتهي برسالة واتساب مُعبّأة بالكامل.
 *
 *  السبب: أكبر سبب لمغادرة متجر ورد هو التردّد لا السعر —
 *  «ما أدري وش يناسب». هذا يحوّل التردّد إلى محادثة مؤهَّلة.
 *  لا يمسّ السلة ولا الطلبات؛ مخرجه رسالة نصية فقط.
 */
const QUIZ = [
  {
    key: "occasion",
    q: "ما المناسبة؟",
    opts: ["عيد ميلاد", "تخرّج", "خطوبة أو زواج", "مولود جديد", "شكر أو اعتذار", "افتتاح أو عمل"],
  },
  {
    key: "budget",
    q: "الميزانية التقريبية؟",
    opts: ["أقل من ٢٥٠ ر.س", "٢٥٠ – ٤٥٠ ر.س", "٤٥٠ – ٧٠٠ ر.س", "أكثر من ٧٠٠ ر.س"],
  },
  {
    key: "when",
    q: "متى تريد التسليم؟",
    opts: ["اليوم", "غدًا", "خلال هذا الأسبوع", "تاريخ محدّد"],
  },
];

export function GiftFinder({ eyebrow, title, desc, background }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const done = step >= QUIZ.length;
  const current = QUIZ[step];

  const message = useMemo(() => {
    if (!done) return "";
    return (
      "السلام عليكم، أبغى ترشيح هدية.\n" +
      `المناسبة: ${answers.occasion}\n` +
      `الميزانية: ${answers.budget}\n` +
      `موعد التسليم: ${answers.when}`
    );
  }, [done, answers]);

  const pick = (val) => {
    setAnswers((a) => ({ ...a, [current.key]: val }));
    setStep((s) => s + 1);
  };

  const reset = () => { setAnswers({}); setStep(0); };

  return (
    <section style={{ background: background === "alt" ? C.offWhite : "transparent" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 section-y">
        <div
          className="rounded-3xl p-6 sm:p-10 flex flex-col gap-6"
          style={{ background: C.pearl, border: `1px solid ${C.line}`, boxShadow: SH.sm }}
        >
          <div className="flex flex-col gap-2 text-center">
            <span className="eyebrow mx-auto">{eyebrow || "مساعد الاختيار"}</span>
            <h2 className="h-section font-display" style={{ color: C.navy }}>
              {title || "ثلاثة أسئلة ونرشّح لك"}
            </h2>
            {desc && <p className="text-sm mx-auto" style={{ color: C.slate }}>{desc}</p>}
          </div>

          {/* مؤشّر التقدّم */}
          <div className="flex items-center gap-2 justify-center">
            {QUIZ.map((_, i) => (
              <span
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? "2.5rem" : "1.25rem",
                  background: i <= step ? C.teal : C.line,
                }}
              />
            ))}
          </div>

          {!done ? (
            <div className="flex flex-col gap-4">
              <p className="text-center font-bold" style={{ color: C.navy }}>{current.q}</p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {current.opts.map((o) => (
                  <button
                    key={o}
                    onClick={() => pick(o)}
                    className="px-4 py-3.5 rounded-xl text-sm font-bold text-right transition-all hover:-translate-y-0.5"
                    style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.navy }}
                  >
                    {o}
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button onClick={() => setStep((s) => s - 1)}
                        className="text-xs mx-auto" style={{ color: C.slate }}>
                  رجوع
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-center text-center pop-in">
              <p className="text-sm leading-relaxed max-w-md" style={{ color: C.slate }}>
                جاهز. سنرسل لك ثلاثة خيارات بالصور تناسب
                {" "}<strong style={{ color: C.navy }}>{answers.occasion}</strong>{" "}
                ضمن <strong style={{ color: C.navy }}>{answers.budget}</strong>،
                للتسليم <strong style={{ color: C.navy }}>{answers.when}</strong>.
              </p>
              <a
                href={buildWhatsAppLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn px-7 py-3.5 text-sm"
                style={{ background: C.navy, color: "#fff" }}
              >
                أرسل الطلب على واتساب
              </a>
              <button onClick={reset} className="text-xs" style={{ color: C.slate }}>
                ابدأ من جديد
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
 *  ٣) دليل العناية
 * ═══════════════════════════════════════════════════════════
 *  تبويبات تُظهر خطوة واحدة في كل مرة.
 *  قيمته الحقيقية: يقلّل شكاوى «الورد ذبل بسرعة» — وهي أكثر
 *  شكوى في هذا المجال وأكثرها ضررًا على التقييمات.
 */
export function CareGuide({ eyebrow, title, desc, steps, background }) {
  const items = steps?.length ? steps : [];
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  const cur = items[active];
  const Icon = getIcon(cur.icon);

  return (
    <section style={{ background: background === "alt" ? C.offWhite : "transparent" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <div className="flex flex-col gap-3 mb-8">
          <span className="eyebrow">{eyebrow || "بعد التسليم"}</span>
          <h2 className="h-section font-display" style={{ color: C.navy }}>
            {title || "كيف يبقى الورد أطول"}
          </h2>
          {desc && <p className="text-sm max-w-xl" style={{ color: C.slate }}>{desc}</p>}
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-5">
          {/* التبويبات */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar">
            {items.map((it, i) => (
              <button
                key={it.t}
                onClick={() => setActive(i)}
                className="shrink-0 lg:shrink text-right px-4 py-3 rounded-xl text-sm transition-all whitespace-nowrap lg:whitespace-normal"
                style={
                  i === active
                    ? { background: C.navy, color: "#fff", fontWeight: 700 }
                    : { background: "#fff", border: `1px solid ${C.line}`, color: C.slate }
                }
              >
                <span className="num opacity-60 text-xs ml-1.5">{String(i + 1).padStart(2, "0")}</span>
                {it.t}
              </button>
            ))}
          </div>

          {/* المحتوى */}
          <div
            key={active}
            className="rise rounded-2xl p-6 sm:p-8 flex flex-col gap-4"
            style={{ background: C.pearl, border: `1px solid ${C.line}` }}
          >
            <span className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: C.mintTint, color: C.teal }}>
              <Icon size={22} />
            </span>
            <h3 className="h-card font-display" style={{ color: C.navy }}>{cur.t}</h3>
            <p className="text-sm leading-loose" style={{ color: C.slate }}>{cur.d}</p>
            {cur.tip && (
              <p className="text-xs leading-relaxed px-4 py-3 rounded-xl"
                 style={{ background: "#fff", color: C.slate, borderRight: `3px solid ${C.teal}` }}>
                {cur.tip}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
