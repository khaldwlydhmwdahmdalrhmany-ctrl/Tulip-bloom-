import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { C } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";

/**
 * بطاقة تصنيف — طراز بوتيك.
 *
 * أُعيد تصميمها: حد شعري بدل الظل الثقيل، ولون التصنيف يظهر
 * كلمسة في الأيقونة والخط السفلي فقط لا كخلفية كاملة —
 * ثمانية تصنيفات بثماني خلفيات ملوّنة تُنتج فوضى بصرية.
 */
export default function CategoryCard({ category, compact = false }) {
  const Icon = getIcon(category.icon);
  const tone = category.color || C.teal;

  return (
    <Link
      href={`/category/${category.slug}`}
      className="card-boutique group relative overflow-hidden flex flex-col gap-3 p-6"
    >
      {/* هالة لونية خفيفة تظهر عند المرور */}
      <span
        className="absolute -top-12 -left-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none"
        style={{ background: tone }}
      />

      <span
        className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${tone}14`, color: tone }}
      >
        <Icon size={20} />
      </span>

      <div className="relative flex-1">
        <h3 className="h-card font-display mb-1.5" style={{ color: C.navy }}>
          {category.name}
        </h3>
        {!compact && category.tagline && (
          <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: C.slate }}>
            {category.tagline}
          </p>
        )}
      </div>

      <span
        className="relative flex items-center gap-1.5 text-[11px] font-bold pt-3"
        style={{ color: tone, borderTop: `1px solid ${C.lineSoft}` }}
      >
        تصفّح القسم <ArrowLeft size={13} className="arrow-slide" />
      </span>
    </Link>
  );
}
