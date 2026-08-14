"use client";
import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Check, MessageCircle, ArrowLeft } from "lucide-react";
import { C, G, formatPrice } from "../../lib/colors.js";
import { useCart } from "../../context/CartContext.jsx";

/**
 * شاشة تأكيد الطلب — تظهر بعد فتح واتساب.
 * الغرض منها طمأنة العميل بأن طلبه سُجّل فعلًا، وإعطاؤه رقمًا يرجع به.
 * كثير من المتاجر تكتفي بفتح واتساب فيبقى العميل غير متأكد أن شيئًا حدث.
 */
export default function OrderConfirmation() {
  const { confirmation, closeConfirmation } = useCart();
  const [copied, setCopied] = useState(false);

  if (!confirmation) return null;
  const { orderNumber, total, name, link } = confirmation;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(7,18,51,.72)" }}>
      <div className="rise w-full max-w-md rounded-3xl overflow-hidden" style={{ background: "#fff" }}>
        {/* رأس الشاشة */}
        <div className="relative px-6 py-9 text-center overflow-hidden" style={{ background: G.deep }}>
          <span className="absolute -top-20 -left-16 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: C.teal }} />

          <div className="relative inline-flex items-center justify-center mb-4">
            {/* حلقة تتمدّد حول علامة الصح */}
            <span className="absolute w-16 h-16 rounded-full ring-out" style={{ background: C.mint }} />
            <span className="relative w-16 h-16 rounded-full flex items-center justify-center pop-in" style={{ background: C.mint }}>
              <CheckCircle2 size={32} color={C.navyDeep} strokeWidth={2.2} />
            </span>
          </div>

          <h3 className="font-display text-xl mb-1.5" style={{ color: "#fff" }}>
            تم تسجيل طلبك{name ? `، ${name.split(" ")[0]}` : ""}
          </h3>
          <p className="text-sm" style={{ color: "rgba(255,255,255,.75)" }}>
            فتحنا لك واتساب لإتمام الطلب مع فريقنا.
          </p>
        </div>

        {/* التفاصيل */}
        <div className="p-6 flex flex-col gap-4">
          {orderNumber && (
            <div className="p-4 rounded-2xl flex items-center justify-between gap-3" style={{ background: C.mintTint }}>
              <div className="min-w-0">
                <span className="block text-[11px] mb-0.5" style={{ color: C.slate }}>رقم طلبك</span>
                <span className="font-display text-lg tracking-wide" dir="ltr" style={{ color: C.navy }}>
                  {orderNumber}
                </span>
              </div>
              <button
                onClick={copy}
                className="btn shrink-0 px-3 py-2 text-[11px]"
                style={{ background: copied ? C.success : "#fff", color: copied ? "#fff" : C.navy }}
              >
                {copied ? <><Check size={13} /> نُسخ</> : <><Copy size={13} /> نسخ</>}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-sm px-1">
            <span style={{ color: C.slate }}>إجمالي الطلب</span>
            <span className="font-display text-lg" style={{ color: C.navy }}>{formatPrice(total)} ر.س</span>
          </div>

          <p className="text-xs leading-relaxed p-3 rounded-xl" style={{ background: C.offWhite, color: C.slate }}>
            احتفظ برقم الطلب — يسهّل على فريقنا متابعة طلبك في أي وقت.
            {orderNumber && " وقد أُرفق تلقائيًا في رسالة واتساب."}
          </p>

          <div className="flex flex-col gap-2.5 pt-1">
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer" className="btn w-full py-3.5 text-sm" style={{ background: "#25D366", color: "#fff" }}>
                <MessageCircle size={16} /> لم يفتح واتساب؟ اضغط هنا
              </a>
            )}
            <Link href="/shop" onClick={closeConfirmation} className="btn group w-full py-3.5 text-sm" style={{ background: C.navy, color: "#fff" }}>
              متابعة التسوّق <ArrowLeft size={15} className="arrow-slide" />
            </Link>
            <button onClick={closeConfirmation} className="text-xs font-bold py-1" style={{ color: C.slate }}>
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
