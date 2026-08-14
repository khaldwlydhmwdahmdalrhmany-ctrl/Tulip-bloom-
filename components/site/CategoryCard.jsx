import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { C, SH } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";

/**
 * بطاقة تصنيف — البطاقة بالكامل قابلة للنقر (Link هو الجذر)
 * مع حركة hover: رفع + توهّج لوني + انزلاق السهم.
 */
export default function CategoryCard({ category }) {
  const Icon = getIcon(category.icon);
  const color = category.color || C.navy;
  const count = category._count?.products ?? 0;

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group lift relative flex flex-col items-center text-center gap-3 p-5 sm:p-6 rounded-2xl overflow-hidden"
      style={{ background: C.pearl, border: `1px solid ${C.line}`, boxShadow: SH.sm }}
    >
      {/* توهّج لوني يظهر عند المرور */}
      <span
        className="absolute inset-x-0 top-0 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}22, transparent 70%)` }}
      />

      <div
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon size={24} color={color} strokeWidth={1.8} />
      </div>

      <div className="relative">
        <h3 className="font-bold text-[13px] sm:text-sm leading-snug" style={{ color: C.ink }}>
          {category.name}
        </h3>
        {count > 0 && (
          <span className="block text-[11px] mt-1" style={{ color: C.slateLight }}>
            {count} منتج
          </span>
        )}
      </div>

      <span
        className="relative inline-flex items-center gap-1 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ color }}
      >
        تصفّح <ArrowLeft size={12} className="arrow-slide" />
      </span>
    </Link>
  );
}
