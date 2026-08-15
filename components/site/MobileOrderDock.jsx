"use client";
/**
 * ═══════════════════════════════════════════════════════════
 *  شريط الطلب اللاصق — الجوال فقط
 * ═══════════════════════════════════════════════════════════
 *
 *  ملف مضاف. لا يعدّل ProductActions ولا CartContext ولا أي
 *  منطق سلة — يستدعي `addToCart` نفسها التي يستدعيها الزر الأصلي.
 *
 *  السبب في وجوده: صفحة المنتج طويلة (مواصفات + تبويبات +
 *  منتجات مشابهة)، وزر الشراء يختفي بعد أول تمرير. على الجوال
 *  هذا يعني أن أغلب من قرأ المواصفات كاملة لا يجد زرًّا أمامه.
 *
 *  يظهر بعد تمرير ٤٠٠ بكسل فقط — قبل ذلك الزر الأصلي مرئي
 *  أصلًا، وإظهاره فورًا يحجب المحتوى بلا فائدة.
 */

import React, { useState, useEffect } from "react";
import { ShoppingCart, MessageCircle, Check } from "lucide-react";
import { C, formatPrice, buildWhatsAppLink } from "../../lib/colors.js";
import { useCart } from "../../context/CartContext.jsx";

export default function MobileOrderDock({ product }) {
  const { addToCart } = useCart();
  const [show, setShow] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!product) return null;

  const soldOut = product.stock === "out_of_stock";

  const handleAdd = () => {
    addToCart(product.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const msg = soldOut
    ? `السلام عليكم، أرغب أن تخبروني عند توفّر:\n\n• ${product.name}`
    : `السلام عليكم، أرغب في طلب:\n\n• ${product.name}\n• السعر: ${formatPrice(product.price)} ر.س\n\nأرجو تأكيد التوفّر وموعد التسليم.`;

  return (
    <div
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-300"
      style={{
        transform: show ? "translateY(0)" : "translateY(110%)",
        background: "rgba(255,255,255,.94)",
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${C.line}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center gap-2.5 px-4 py-3">
        {/* السعر */}
        <div className="min-w-0 shrink-0">
          <p className="text-[10px] leading-none mb-1" style={{ color: C.slateLight }}>
            {soldOut ? "غير متوفر" : "السعر"}
          </p>
          <p className="num text-base font-bold leading-none" style={{ color: C.navy }}>
            {formatPrice(product.price)}
            <span className="text-[10px] font-normal mr-1">ر.س</span>
          </p>
        </div>

        {/* واتساب */}
        <a
          href={buildWhatsAppLink(msg)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="اطلب عبر واتساب"
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: C.mintTint, color: C.navy, border: `1px solid ${C.line}` }}
        >
          <MessageCircle size={19} />
        </a>

        {/* الإضافة للسلة */}
        <button
          onClick={handleAdd}
          disabled={soldOut}
          className="btn flex-1 py-3 text-sm"
          style={{
            background: soldOut ? C.line : added ? C.success : C.navy,
            color: soldOut ? C.slateLight : "#fff",
            cursor: soldOut ? "not-allowed" : "pointer",
          }}
        >
          {soldOut ? (
            "نفدت الكمية"
          ) : added ? (
            <>
              <Check size={17} /> أُضيف للسلة
            </>
          ) : (
            <>
              <ShoppingCart size={17} /> أضف للسلة
            </>
          )}
        </button>
      </div>
    </div>
  );
}
