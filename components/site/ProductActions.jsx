"use client";
import React, { useState } from "react";
import { ShoppingCart, Plus, Minus, MessageCircle, Zap, Check } from "lucide-react";
import { C, formatPrice, buildWhatsAppLink } from "../../lib/colors.js";
import BuyNowButton from "./BuyNowButton.jsx";
import { useCart } from "../../context/CartContext.jsx";

export default function ProductActions({ product }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const soldOut = product.stock === "out_of_stock";

  const handleAdd = () => {
    addToCart(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const orderMessage = () =>
    `السلام عليكم، أرغب في طلب:\n\n• ${product.name}\n• الكمية: ${qty}\n• السعر: ${formatPrice(product.price * qty)} ر.س\n\nأرجو تأكيد التوفر وطريقة التوصيل.`;

  const askMessage = () =>
    `السلام عليكم، عندي استفسار عن:\n\n• ${product.name}\n• السعر: ${formatPrice(product.price)} ر.س`;

  if (soldOut) {
    return (
      <div className="flex flex-col gap-3">
        <div className="p-4 rounded-2xl text-center" style={{ background: `${C.danger}10`, border: `1px solid ${C.danger}33` }}>
          <p className="font-bold text-sm mb-1" style={{ color: C.danger }}>هذا المنتج غير متوفر حاليًا</p>
          <p className="text-xs" style={{ color: C.slate }}>راسلنا وسنخبرك فور توفره.</p>
        </div>
        <a
          href={buildWhatsAppLink(`السلام عليكم، أرغب بإشعاري عند توفّر: ${product.name}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn w-full py-3.5 text-sm"
          style={{ background: "#25D366", color: "#fff" }}
        >
          <MessageCircle size={17} /> أشعرني عند التوفّر
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* الكمية */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold" style={{ color: C.slate }}>الكمية</span>
        <div className="flex items-center gap-1 rounded-full p-1" style={{ border: `1.5px solid ${C.line}` }}>
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="إنقاص الكمية"
            className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: C.mintTint, color: C.navy }}
          >
            <Minus size={15} />
          </button>
          <span className="w-10 text-center font-bold text-sm" aria-live="polite">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            aria-label="زيادة الكمية"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: C.mintTint, color: C.navy }}
          >
            <Plus size={15} />
          </button>
        </div>
        {qty > 1 && (
          <span className="text-sm font-bold mr-auto" style={{ color: C.navy }}>
            الإجمالي: {formatPrice(product.price * qty)} ر.س
          </span>
        )}
      </div>

      {/* الزر الرئيسي */}
      <button
        onClick={handleAdd}
        className="btn w-full py-4 text-sm"
        style={{ background: added ? C.success : C.navy, color: "#fff" }}
      >
        {added ? (<><Check size={18} /> أُضيف إلى السلة</>) : (<><ShoppingCart size={17} /> أضف إلى السلة</>)}
      </button>

      {/* الأزرار الثانوية */}
      <div className="grid grid-cols-2 gap-3">
        <BuyNowButton
          product={product}
          qty={qty}
          className="py-3.5 text-sm"
          style={{ border: `1.5px solid ${C.navy}`, color: C.navy, background: "#fff" }}
        />
        <a
          href={buildWhatsAppLink(askMessage())}
          target="_blank"
          rel="noopener noreferrer"
          className="btn py-3.5 text-sm"
          style={{ background: "#25D366", color: "#fff" }}
        >
          <MessageCircle size={16} /> استفسار
        </a>
      </div>

      <p className="text-[11px] text-center" style={{ color: C.slateLight }}>
        «اشترِ الآن» ينقلك مباشرة إلى واتساب لإتمام الطلب مع فريقنا.
      </p>
    </div>
  );
}
