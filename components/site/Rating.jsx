import React from "react";
import { Star } from "lucide-react";
import { C } from "../../lib/colors.js";

/**
 * تقييم المنتج — يُعرض فقط إذا كان هناك تقييم فعلي مُدخل.
 * لا نعرض أصفارًا أو نجومًا فارغة لمنتج بلا تقييمات،
 * لأن ذلك يوحي بتقييم سيئ بدل "لا يوجد تقييم بعد".
 */
export default function Rating({ rating, reviewCount, size = 13, showCount = true }) {
  if (!rating || rating <= 0) return null;

  const full = Math.floor(rating);
  const half = rating - full >= 0.5;

  return (
    <div className="flex items-center gap-1.5" aria-label={`تقييم ${rating} من 5`}>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full || (i === full && half);
          return (
            <Star
              key={i}
              size={size}
              fill={filled ? C.gold : "transparent"}
              color={filled ? C.gold : `${C.slateLight}66`}
              strokeWidth={1.6}
            />
          );
        })}
      </div>
      <span className="text-[11px] font-bold" style={{ color: C.ink }}>
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount > 0 && (
        <span className="text-[11px]" style={{ color: C.slateLight }}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
