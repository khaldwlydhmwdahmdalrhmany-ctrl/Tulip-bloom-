"use client";
import React, { useState } from "react";
import { Check, X, Plus, Tag } from "lucide-react";
import { BADGES, BADGE_GROUPS, badgeColor, OFFER_BADGES } from "../lib/badges.js";

const C = { navy: "#0C1C77", slate: "#4A5A63", line: "#E1ECE8", teal: "#00C6C7", offWhite: "#F6FAF9" };

export default function BadgePicker({ value, onChange }) {
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const isCustom = value && !BADGES.some((b) => b.value === value);
  const inOffers = OFFER_BADGES.includes(value);

  const pick = (v) => onChange(value === v ? "" : v);

  const addCustom = () => {
    const v = custom.trim();
    if (!v) return;
    onChange(v);
    setCustom("");
    setShowCustom(false);
  };

  return (
    <div>
      <label className="text-xs font-bold flex items-center gap-2 mb-2" style={{ color: C.navy }}>
        <Tag size={13} /> شارة المنتج
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-[11px] font-bold mr-auto" style={{ color: "#D64545" }}>
            إزالة الشارة
          </button>
        )}
      </label>

      {/* الشارة الحالية */}
      {value && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: badgeColor(value) }}>
            {value}
          </span>
          {isCustom && <span className="text-[11px]" style={{ color: C.slate }}>شارة مخصّصة</span>}
          {inOffers && (
            <span className="text-[11px] font-bold px-2 py-1 rounded" style={{ background: "#FFF4E0", color: "#8A6200" }}>
              يظهر في صفحة العروض
            </span>
          )}
        </div>
      )}

      {/* الشارات الجاهزة مجمّعة */}
      <div className="flex flex-col gap-3">
        {BADGE_GROUPS.map((g) => (
          <div key={g}>
            <span className="text-[11px] font-bold block mb-1.5" style={{ color: C.slate }}>
              {g}
              {g === "ترويجية" && <span className="font-normal"> — تُدرج المنتج في صفحة العروض</span>}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {BADGES.filter((b) => b.group === g).map((b) => {
                const on = value === b.value;
                return (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => pick(b.value)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                    style={on
                      ? { background: b.color, color: "#fff" }
                      : { background: C.offWhite, color: b.color, border: `1px solid ${b.color}33` }}
                  >
                    {on && <Check size={11} />} {b.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* شارة مخصّصة */}
      <div className="mt-3">
        {showCustom ? (
          <div className="flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
              placeholder="اكتب نص الشارة…"
              maxLength={24}
              autoFocus
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: `1.5px solid ${C.teal}` }}
            />
            <button type="button" onClick={addCustom} className="btn px-4 py-2.5 text-xs" style={{ background: C.navy, color: "#fff" }}>
              <Check size={13} /> اعتماد
            </button>
            <button type="button" onClick={() => { setShowCustom(false); setCustom(""); }} className="btn px-3 py-2.5 text-xs" style={{ background: C.offWhite, color: C.slate }}>
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold"
            style={{ background: C.offWhite, color: C.navy, border: `1px dashed ${C.line}` }}
          >
            <Plus size={12} /> شارة مخصّصة
          </button>
        )}
      </div>
    </div>
  );
}
