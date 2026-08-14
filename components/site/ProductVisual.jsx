import React from "react";
import { C } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";

export default function ProductVisual({ product, heightClass = "h-44 sm:h-48" }) {
  const catColor = product.category?.color || C.navy;
  const Icon = getIcon(product.category?.icon);
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  return (
    <div className={`relative w-full ${heightClass} overflow-hidden`} style={{ background: product.imageUrl ? C.offWhite : `linear-gradient(160deg, ${catColor}14 0%, ${C.offWhite} 75%)` }}>
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${catColor}15`, border: `1px solid ${catColor}45` }}>
            <Icon size={28} color={catColor} strokeWidth={1.5} />
          </div>
        </div>
      )}
      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
        {product.badge && (
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: C.navy, color: C.pearl }}>{product.badge}</span>
        )}
        {hasDiscount && (
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: "#D64545", color: C.pearl }}>
            خصم {Math.round(100 - (product.price / product.oldPrice) * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}
