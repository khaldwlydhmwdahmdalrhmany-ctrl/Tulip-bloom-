import React from "react";
import { Search, MessageCircle, Truck, Sparkles } from "lucide-react";
import { C, G } from "../../lib/colors.js";
import SectionHead from "./SectionHead.jsx";

const STEPS = [
  { n: "٠١", icon: Search, t: "اختر منتجك", d: "تصفّح الأقسام وأضف ما يناسب منزلك إلى السلة، أو اسألنا نرشّح لك." },
  { n: "٠٢", icon: MessageCircle, t: "أكّد الطلب عبر واتساب", d: "أدخل بياناتك وأرسل الطلب مباشرة لفريقنا — بلا تسجيل ولا بطاقة." },
  { n: "٠٣", icon: Truck, t: "نوصّل ونركّب", d: "نشحن لعنوانك، وفني معتمد يركّب الجهاز ويشرح لك تشغيله." },
  { n: "٠٤", icon: Sparkles, t: "استمتع بالنقاء", d: "نذكّرك بموعد الصيانة، وقطع الغيار الأصلية متوفرة دائمًا." },
];

export default function HowItWorks() {
  return (
    <section style={{ background: C.mintTint }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <SectionHead
          align="center"
          eyebrow="رحلة الطلب"
          title="كيف تصلك منتجاتنا"
          desc="أربع خطوات بسيطة من الاختيار حتى أول كوب ماء نقي."
        />

        <div className="relative">
          {/* خط الربط بين الخطوات — يظهر على الشاشات الكبيرة فقط */}
          <span
            className="hidden lg:block absolute top-12 right-[12%] left-[12%] h-0.5 pointer-events-none"
            style={{ background: `linear-gradient(90deg, ${C.teal}00, ${C.teal}55, ${C.teal}00)` }}
          />

          <ol className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="lift group p-6 rounded-2xl flex flex-col gap-3 text-center items-center"
                style={{ background: C.pearl }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: G.aqua }}
                >
                  <s.icon size={24} color="#fff" strokeWidth={1.9} />
                </div>

                <span className="font-display text-2xl leading-none" style={{ color: `${C.navy}26` }}>
                  {s.n}
                </span>

                <h3 className="font-bold text-[15px]" style={{ color: C.navy }}>{s.t}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.slate }}>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
