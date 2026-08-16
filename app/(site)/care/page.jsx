import React from "react";
import { C } from "../../../lib/colors.js";
import PageHero from "../../../components/site/PageHero.jsx";
import CtaBand from "../../../components/site/CtaBand.jsx";
import FaqAccordion from "../../../components/site/FaqAccordion.jsx";
import SectionHead from "../../../components/site/SectionHead.jsx";
import { getIcon } from "../../../lib/iconMap.js";
import { CARE_STEPS } from "../../../config/content.config.js";
import { STORE } from "../../../config/store.config.js";

export const metadata = {
  title: "دليل العناية بالورد",
  description: `كيف تحافظ على الورد الطبيعي أطول مدة ممكنة — دليل عملي من ${STORE.shortName}.`,
};

/** أخطاء شائعة — الأثر أوضح حين يُعرض كخطأ لا كنصيحة. */
const MISTAKES = [
  { q: "إضافة ماء فوق القديم بدل تغييره", a: "الماء الراكد يبني بكتيريا تسدّ السيقان. أضفت ماءً نظيفًا فوق ماء ملوّث فبقيت المشكلة." },
  { q: "وضع الباقة تحت المكيّف مباشرة", a: "الهواء الجاف يسحب الرطوبة من البتلات أسرع مما تعوّضها الزهرة، فتذبل خلال يومين." },
  { q: "ترك الأوراق غاطسة في الماء", a: "الورقة الغاطسة تتعفّن وتلوّث الماء كله. انزع كل ورقة تحت مستوى الماء قبل وضع الباقة." },
  { q: "قصّ السيقان بشكل مستقيم", a: "القصّ المستقيم يجعل الساق تلتصق بقاع الفازة فتسدّ المجرى. اقصّ بزاوية ٤٥ درجة دائمًا." },
  { q: "وضعها بجانب سلة الفاكهة", a: "الفاكهة الناضجة تطلق غاز الإيثيلين الذي يسرّع نضج الزهرة وذبولها." },
];

export default function CarePage() {
  return (
    <div>
      <PageHero
        title="كيف يبقى الورد أطول"
        subtitle="أربع عادات تضيف يومين إلى ثلاثة لعمر أي باقة."
        eyebrow="بعد التسليم"
        compact
      />

      {/* الخطوات */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {CARE_STEPS.map((s, i) => {
            const Icon = getIcon(s.icon);
            return (
              <article key={s.t} className="card-boutique p-7 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: C.mintTint, color: C.teal }}>
                    <Icon size={20} />
                  </span>
                  <span className="step-numeral num">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h2 className="h-card font-display" style={{ color: C.navy }}>{s.t}</h2>
                <p className="text-sm leading-loose" style={{ color: C.slate }}>{s.d}</p>
                {s.tip && (
                  <p className="text-xs leading-relaxed px-4 py-3 rounded-xl"
                     style={{ background: C.pearl, color: C.slate, borderRight: `3px solid ${C.teal}` }}>
                    {s.tip}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* الأخطاء الشائعة */}
      <section className="section-alt">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 section-y">
          <SectionHead
            align="center"
            eyebrow="تجنّبها"
            title="خمسة أخطاء تختصر عمر الباقة"
            desc="أغلب حالات الذبول المبكر سببها واحد من هذه، لا جودة الورد."
          />
          <FaqAccordion items={MISTAKES} />
        </div>
      </section>

      <CtaBand
        eyebrow="سؤال عن باقتك؟"
        title="أرسل لنا صورة ونساعدك"
        desc="لو لاحظت ذبولًا مبكرًا، صوّرها وراسلنا — نحدّد السبب وننصحك."
        primaryLabel="تصفّح التشكيلة"
        primaryHref="/shop"
      />
    </div>
  );
}
