import React from "react";
import { C, TRUST_ITEMS } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";

/**
 * شريط عناصر الثقة — يُستخدم في جميع صفحات الموقع.
 * variant="light" (افتراضي) للخلفيات الفاتحة، "dark" للداكنة.
 */
export default function TrustStrip({ variant = "light", items = TRUST_ITEMS, className = "" }) {
  const dark = variant === "dark";
  const fg = dark ? "#fff" : C.navy;
  const iconColor = dark ? C.mint : C.teal;

  return (
    <section
      className={`border-y ${className}`}
      style={{
        borderColor: dark ? "rgba(255,255,255,.14)" : C.line,
        background: dark ? C.navyDeep : C.sand,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6 sm:gap-8 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible">
          {items.map((t, i) => {
            const Icon = getIcon(t.icon);
            return (
              <div key={i} className="flex items-center gap-2.5 shrink-0 sm:justify-center">
                <Icon size={19} color={iconColor} strokeWidth={1.9} className="shrink-0" />
                <span className="text-[12px] sm:text-[13px] font-semibold whitespace-nowrap sm:whitespace-normal" style={{ color: fg }}>
                  {t.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
