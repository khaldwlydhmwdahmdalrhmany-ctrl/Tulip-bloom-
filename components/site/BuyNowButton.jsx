"use client";
import React, { useState } from "react";
import { Zap, Loader2, Check } from "lucide-react";
import { C, formatPrice, buildWhatsAppLink, isQuoteProduct } from "../../lib/colors.js";
import { resolveAttribution } from "../../lib/attribution.js";
import { trackPurchase } from "../../lib/analytics.js";

/**
 * زر «اشترِ الآن» — يسجّل الطلب في القاعدة قبل فتح واتساب.
 *
 * قبل هذا المكوّن كان الزر رابط <a> يفتح واتساب مباشرة، فلا يُسجَّل الطلب
 * في لوحة التحكم ولا يُطلق حدث purchase — أي أن كل مبيعات الشراء المباشر
 * كانت غير محسوبة تسويقيًا وغير موثّقة إداريًا.
 *
 * لو فشل التسجيل (انقطاع شبكة مثلًا) نكمل إلى واتساب على أي حال:
 * إتمام العميل لطلبه أهم من اكتمال سجلّنا.
 */
export default function BuyNowButton({
  product,
  qty = 1,
  className = "",
  style = {},
  label,
  disabled = false,
}) {
  const [busy, setBusy] = useState(false);
  const quoteMode = isQuoteProduct(product);
  const btnLabel = label || (quoteMode ? "اطلب عرض سعر" : "اشترِ الآن");
  const [done, setDone] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (busy || disabled) return;

    setBusy(true);
    const attr = resolveAttribution();
    const total = Number(product.price) * qty;

    let orderNumber = null;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // الاسم والجوال يُجمعان في واتساب — نضع علامة واضحة للمسؤول
          quickOrder: true,   // يُعفي الطلب من تحقّق رقم الجوال في الخادم
          customerName: "طلب سريع (اشترِ الآن)",
          customerPhone: "بانتظار التأكيد",
          customerCity: null,
          items: [{ id: product.id, name: product.name, qty, price: Number(product.price) }],
          total,
          source: attr?.source,
          medium: attr?.medium,
          campaign: attr?.campaign,
          landingPath: attr?.landingPath,
        }),
      });
      if (res.ok) {
        orderNumber = (await res.json())?.orderNumber || null;
      } else {
        // تسجيل السبب في وحدة التحكم — الفشل الصامت أخفى خللًا حقيقيًا سابقًا
        const err = await res.json().catch(() => ({}));
        console.error("[buy-now] رُفض تسجيل الطلب:", res.status, err.error);
      }
    } catch (e) {
      console.error("[buy-now] تعذّر الاتصال بالخادم:", e.message);
    }

    if (orderNumber) {
      trackPurchase(orderNumber, [{ product, qty }], total, attr, "buy_now");
    }

    const quote = isQuoteProduct(product);
    const msg = quote
      ? (orderNumber ? `رقم الطلب: ${orderNumber}\n\n` : "") +
        `السلام عليكم، أرغب في طلب عرض سعر لـ:\n\n• ${product.name}\n\n` +
        `أرجو تزويدي بالسعر والمواصفات المناسبة.`
      : (orderNumber ? `رقم الطلب: ${orderNumber}\n\n` : "") +
        `السلام عليكم، أرغب في طلب:\n\n` +
        `• ${product.name}\n` +
        (qty > 1 ? `• الكمية: ${qty}\n` : "") +
        `• السعر: ${formatPrice(total)} ر.س\n\n` +
        `أرجو تأكيد التوفر وطريقة التوصيل.`;

    setBusy(false);
    setDone(true);
    setTimeout(() => setDone(false), 2500);

    window.open(buildWhatsAppLink(msg), "_blank");
  };

  return (
    <button
      onClick={handle}
      disabled={busy || disabled}
      className={`btn ${className}`}
      style={style}
      aria-label={`${btnLabel} — ${product.name}`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" />
        : done ? <Check size={14} className="pop-in" />
        : <Zap size={14} />}
      {busy ? "جارٍ التسجيل…" : done ? "تم" : btnLabel}
    </button>
  );
}
