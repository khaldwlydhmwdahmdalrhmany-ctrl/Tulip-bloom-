import React from "react";
import { C } from "../../lib/colors.js";

import { STORE } from "../../config/store.config.js";

const DEFAULT_ITEMS = STORE.ticker || [];

/**
 * الشريط المتحرك — نصّه يُدار من لوحة التحكم (مفصولًا بالرمز ✦).
 * تركه فارغًا في الإعدادات يخفي الشريط بالكامل.
 */
export default function Ticker({ settings = {} }) {
  const raw = (settings.store_ticker || "").trim();

  // نص فارغ عمدًا = إخفاء الشريط، لا العودة للنص الافتراضي
  const items = settings.store_ticker !== undefined && raw === ""
    ? []
    : raw
      ? raw.split("✦").map((t) => t.trim()).filter(Boolean)
      : DEFAULT_ITEMS;

  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden whitespace-nowrap py-2" style={{ background: C.navy }}>
      <div className="ticker-track inline-block">
        {Array.from({ length: 2 }).map((_, r) => (
          <span key={r} className="inline-flex items-center gap-8 text-xs font-semibold px-6" style={{ color: C.mint }}>
            {items.map((t, i) => (<span key={i}>✦ {t}</span>))}
          </span>
        ))}
      </div>
    </div>
  );
}

/** شريط إعلان مؤقت — أبرز من التيكر، لإجازة أو ظرف طارئ. */
export function AnnouncementBar({ settings = {} }) {
  const text = (settings.announcement || "").trim();
  if (!text) return null;

  return (
    <div className="px-4 py-2.5 text-center text-xs font-bold" style={{ background: C.gold, color: "#3D2A00" }}>
      {text}
    </div>
  );
}
