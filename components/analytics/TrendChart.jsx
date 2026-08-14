"use client";
import React, { useState } from "react";

const C = { navy: "#0C1C77", slate: "#4A5A63", line: "#E1ECE8", teal: "#00C6C7", gold: "#F2B01E" };

/**
 * رسم بياني خطّي بـ SVG خالص — بلا مكتبات رسم.
 * إضافة recharts كانت ستزيد الحزمة بأكثر من 400 كيلوبايت مقابل رسم واحد.
 */
export default function TrendChart({ data = [], height = 190 }) {
  const [hover, setHover] = useState(null);
  if (!data.length) return null;

  const W = 720, H = height, pad = { t: 14, r: 12, b: 26, l: 12 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

  const visits = data.map((d) => Number(d.visits) || 0);
  const orders = data.map((d) => Number(d.orders) || 0);
  const maxV = Math.max(...visits, 1);
  const maxO = Math.max(...orders, 1);

  const x = (i) => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const yV = (v) => pad.t + ih - (v / maxV) * ih;
  const yO = (v) => pad.t + ih - (v / maxO) * ih * 0.75;

  const path = (vals, fn) => vals.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${fn(v).toFixed(1)}`).join(" ");
  const area = `${path(visits, yV)} L ${x(data.length - 1)} ${pad.t + ih} L ${x(0)} ${pad.t + ih} Z`;
  const fmtDay = (d) => String(d || "").slice(5).replace("-", "/");

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="vArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.teal} stopOpacity="0.28" />
            <stop offset="100%" stopColor={C.teal} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={pad.l} x2={W - pad.r} y1={pad.t + ih * f} y2={pad.t + ih * f} stroke={C.line} strokeWidth="1" strokeDasharray="3 4" />
        ))}

        <path d={area} fill="url(#vArea)" />
        <path d={path(visits, yV)} fill="none" stroke={C.teal} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={path(orders, yO)} fill="none" stroke={C.gold} strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />

        {data.map((d, i) => (
          <g key={i}>
            <rect x={x(i) - iw / data.length / 2} y={pad.t} width={iw / data.length} height={ih} fill="transparent"
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            {hover === i && (
              <>
                <line x1={x(i)} x2={x(i)} y1={pad.t} y2={pad.t + ih} stroke={C.navy} strokeWidth="1" opacity="0.25" />
                <circle cx={x(i)} cy={yV(visits[i])} r="4.5" fill={C.teal} stroke="#fff" strokeWidth="2" />
                <circle cx={x(i)} cy={yO(orders[i])} r="4" fill={C.gold} stroke="#fff" strokeWidth="2" />
              </>
            )}
          </g>
        ))}
      </svg>

      {hover !== null && (
        <div className="absolute -top-1 px-3 py-2 rounded-xl text-[11px] pointer-events-none whitespace-nowrap shadow-lg"
             style={{ background: C.navy, color: "#fff", left: `${(hover / Math.max(data.length - 1, 1)) * 100}%`, transform: "translateX(-50%)" }}>
          <div className="font-bold mb-0.5">{fmtDay(data[hover].day)}</div>
          <div>الزوار: {visits[hover]}</div>
          <div>الطلبات: {orders[hover]}</div>
        </div>
      )}

      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex gap-4 text-[11px]" style={{ color: C.slate }}>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ background: C.teal }} /> زوار</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ background: C.gold }} /> طلبات</span>
        </div>
        <div className="flex gap-6 text-[10px]" style={{ color: C.slate }}>
          <span>{fmtDay(data[0]?.day)}</span>
          <span>{fmtDay(data[data.length - 1]?.day)}</span>
        </div>
      </div>
    </div>
  );
}
