import React from "react";
import { C, formatPrice } from "../../lib/colors.js";
import { TrendingDown, Package, Percent } from "lucide-react";

/**
 * ملخّص التوفير — أرقام مشتقّة حسابيًا من المنتجات المخفّضة فعليًا،
 * لا أرقام تسويقية مكتوبة يدويًا. تتغيّر تلقائيًا مع كل تعديل على الأسعار.
 */
export default function SavingsSummary({ products }) {
  if (!products?.length) return null;   // لا عروض سعرية — نخفي الملخّص بدل عرض أصفار

  const totalSaving = products.reduce((s, p) => s + (p.oldPrice - p.price), 0);
  const biggestPct = Math.max(...products.map((p) => Math.round(100 - (p.price / p.oldPrice) * 100)));

  const stats = [
    { icon: Package, value: products.length, unit: "منتج", label: "عليه خصم الآن" },
    { icon: TrendingDown, value: formatPrice(Math.round(totalSaving)), unit: "ر.س", label: "مجموع التوفير المتاح" },
    { icon: Percent, value: biggestPct, unit: "%", label: "أعلى نسبة خصم" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {stats.map((s, i) => (
        <div
          key={i}
          className="p-4 sm:p-6 rounded-2xl flex flex-col items-center text-center gap-1.5"
          style={{ background: "#fff", border: `1px solid ${C.line}` }}
        >
          <s.icon size={20} color={C.teal} strokeWidth={1.9} />
          <span className="font-display text-xl sm:text-3xl leading-none" style={{ color: C.navy }}>
            {s.value}<span className="text-xs sm:text-base font-normal"> {s.unit}</span>
          </span>
          <span className="text-[11px] sm:text-xs leading-snug" style={{ color: C.slate }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
