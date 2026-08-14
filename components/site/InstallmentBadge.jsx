import React from "react";
import { C, formatPrice } from "../../lib/colors.js";

export default function InstallmentBadge({ price, compact = false }) {
  if (!price || price < 100) return null;
  const installment = Math.ceil(price / 4);
  return (
    <div className={`flex items-center gap-2 flex-wrap ${compact ? "text-[11px]" : "text-xs"}`}>
      <span style={{ color: C.slate }}>أو 4 دفعات من {formatPrice(installment)} ر.س بدون فوائد مع</span>
      <span className="inline-flex items-center px-2 py-0.5 rounded font-bold" style={{ background: "#1E1E3F", color: "#fff", fontSize: compact ? 10 : 11 }}>tabby</span>
      <span className="inline-flex items-center px-2 py-0.5 rounded font-bold" style={{ background: "#25D07A", color: "#fff", fontSize: compact ? 10 : 11 }}>tamara</span>
    </div>
  );
}
