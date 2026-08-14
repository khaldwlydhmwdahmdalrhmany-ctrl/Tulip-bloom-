import React from "react";
import { C } from "../../lib/colors.js";

/**
 * جدول مواصفات — يقرأ من نص المنتج بصيغة "المفتاح: القيمة" في كل سطر.
 * لا يخترع مواصفات غير موجودة؛ يعرض فقط ما كتبه المسؤول فعلًا.
 */
export function parseSpecs(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.includes(":") && l.length < 120)
    .map((l) => {
      const i = l.indexOf(":");
      return { key: l.slice(0, i).trim(), value: l.slice(i + 1).trim() };
    })
    .filter((s) => s.key && s.value);
}

export default function SpecsList({ specs }) {
  if (!specs || specs.length === 0) return null;

  return (
    <dl className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
      {specs.map((s, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-5 py-3.5"
          style={{ background: i % 2 === 0 ? C.offWhite : "#fff" }}
        >
          <dt className="text-xs font-bold sm:w-56 shrink-0" style={{ color: C.navy }}>{s.key}</dt>
          <dd className="text-sm" style={{ color: C.slate }}>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
