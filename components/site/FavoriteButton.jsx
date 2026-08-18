"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { C } from "../../lib/colors.js";
import { useFavorites } from "../../context/FavoritesContext.jsx";

/**
 * زر المفضّلة.
 *
 * غير المسجّل يرى الزر ويضغطه — ثم يُوجَّه لتسجيل الدخول.
 * إخفاء الزر عن الزائر يُخفي وجود الميزة أصلًا، فلا يعرف أن
 * التسجيل يمنحه شيئًا.
 */
export default function FavoriteButton({ productId, size = 16, floating = false }) {
  const { isFavorite, toggle, ready } = useFavorites();
  const router = useRouter();
  const [hint, setHint] = useState(false);

  const on = isFavorite(productId);

  const click = async (e) => {
    e.preventDefault();
    e.stopPropagation();   // البطاقة كلها رابط — بلا هذا ينتقل للمنتج
    const res = await toggle(productId);
    if (res?.needsAuth) {
      setHint(true);
      setTimeout(() => router.push("/account/login"), 900);
    }
  };

  const base = floating
    ? "absolute top-2.5 left-2.5 z-10 w-9 h-9 rounded-xl backdrop-blur"
    : "w-10 h-10 rounded-xl";

  return (
    <button
      onClick={click}
      aria-label={on ? "إزالة من المفضّلة" : "أضف إلى المفضّلة"}
      aria-pressed={on}
      title={hint ? "سجّل الدخول لحفظ المفضّلة" : on ? "في المفضّلة" : "أضف إلى المفضّلة"}
      className={`${base} flex items-center justify-center transition-all duration-200 hover:scale-110 shrink-0`}
      style={{
        background: floating ? "rgba(255,255,255,.88)" : C.pearl,
        border: `1px solid ${on ? C.accentAlt || C.teal : C.line}`,
        color: on ? C.teal : C.slateLight,
        opacity: ready ? 1 : 0.75,
      }}
    >
      <Heart size={size} fill={on ? "currentColor" : "none"} className={on ? "pop-in" : ""} />
    </button>
  );
}
