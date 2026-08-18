"use client";
/**
 * إعادة الطلب.
 *
 * يضيف عناصر طلب سابق إلى السلة الحالية باستدعاء `addToCart`
 * نفسها — لا مسار API جديد ولا تعديل في CartContext.
 *
 * ⚠️ العناصر التي حُذفت من الكتالوج أو نفدت لا تُضاف: نعتمد على
 * `addToCart` التي تبحث عن المنتج بمعرّفه. لو لم يعد موجودًا
 * يُتجاهل بصمت بدل كسر السلة.
 */
import React, { useState } from "react";
import { RotateCcw, Check } from "lucide-react";
import { C } from "../../lib/colors.js";
import { useCart } from "../../context/CartContext.jsx";

export default function ReorderButton({ items = [] }) {
  const { addToCart, setCartOpen } = useCart();
  const [done, setDone] = useState(false);

  const reorder = () => {
    let added = 0;
    items.forEach((it) => {
      if (!it?.id) return;
      try { addToCart(it.id, Number(it.qty) || 1); added++; } catch {}
    });
    setDone(true);
    setTimeout(() => setDone(false), 2200);
    if (added > 0) setCartOpen(true);
  };

  const usable = items.some((i) => i?.id);
  if (!usable) return null;

  return (
    <button onClick={reorder} className="btn shrink-0 px-4 py-2.5 text-[12px]"
            style={{ background: done ? C.success : C.mintTint, color: done ? "#fff" : C.navy }}>
      {done ? <Check size={14} /> : <RotateCcw size={14} />}
      {done ? "أُضيف للسلة" : "اطلبه مجددًا"}
    </button>
  );
}
