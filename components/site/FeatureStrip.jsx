import React from "react";
import { C, SH, FEATURE_ITEMS } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";

/**
 * شريط مميزات الشركة.
 *
 * على الجوال: صف أفقي مضغوط (أيقونة صغيرة + سطر واحد) — البطاقات
 * المربعة الكبيرة كانت تبتلع شاشة كاملة قبل أن يصل المستخدم للمنتجات.
 * على الشاشات الأكبر: أربع بطاقات بوصف كامل.
 */
export default function FeatureStrip() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-12">
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl"
        style={{ background: C.pearl, border: `1px solid ${C.line}`, boxShadow: SH.lg }}
      >
        {FEATURE_ITEMS.map((f, i) => {
          const Icon = getIcon(f.icon);
          return (
            <div
              key={i}
              className="lift flex items-center sm:flex-col sm:text-center gap-2.5 sm:gap-2 p-2.5 sm:p-5 rounded-xl sm:rounded-2xl"
              style={{ background: i % 2 === 0 ? C.mintTint : C.offWhite }}
            >
              <div
                className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: C.pearl, border: `1px solid ${C.teal}33` }}
              >
                <Icon size={15} color={C.teal} strokeWidth={2} className="sm:hidden" />
                <Icon size={21} color={C.teal} strokeWidth={1.9} className="hidden sm:block" />
              </div>

              <div className="min-w-0 flex flex-col sm:items-center">
                <h3 className="font-bold text-[11px] sm:text-sm leading-tight sm:leading-snug" style={{ color: C.navy }}>
                  {f.title}
                </h3>
                <p className="text-[11px] leading-relaxed mt-1 hidden lg:block" style={{ color: C.slate }}>
                  {f.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
