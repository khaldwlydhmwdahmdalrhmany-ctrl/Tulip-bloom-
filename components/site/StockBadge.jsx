import React from "react";
import { C } from "../../lib/colors.js";

export const STOCK_LABELS = {
  in_stock:     { label: "متوفر",            color: C.success, dot: true },
  low_stock:    { label: "كمية محدودة",       color: C.warning, dot: true },
  out_of_stock: { label: "غير متوفر حاليًا",  color: C.danger,  dot: true },
  preorder:     { label: "حجز مسبق",          color: C.cyan,    dot: true },
};

export default function StockBadge({ stock = "in_stock", size = "sm" }) {
  const s = STOCK_LABELS[stock] || STOCK_LABELS.in_stock;
  const text = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold ${text}`} style={{ color: s.color }}>
      {s.dot && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
      )}
      {s.label}
    </span>
  );
}
