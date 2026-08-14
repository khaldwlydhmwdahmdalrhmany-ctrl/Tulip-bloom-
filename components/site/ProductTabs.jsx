"use client";
import React, { useState } from "react";
import { C } from "../../lib/colors.js";

/**
 * تبويبات محتوى المنتج — تقلّل كثافة النص وتحسّن التسلسل البصري
 * بدل صفّ كل المحتوى في عمود واحد طويل.
 */
export default function ProductTabs({ tabs }) {
  const available = tabs.filter((t) => t.content);
  const [active, setActive] = useState(0);

  if (available.length === 0) return null;

  return (
    <div>
      <div
        className="flex gap-1 overflow-x-auto no-scrollbar mb-6 p-1 rounded-full w-fit max-w-full"
        style={{ background: C.offWhite }}
        role="tablist"
      >
        {available.map((t, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className="shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-colors"
            style={active === i ? { background: C.navy, color: "#fff" } : { color: C.slate }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="rise">
        {available[active].content}
      </div>
    </div>
  );
}
