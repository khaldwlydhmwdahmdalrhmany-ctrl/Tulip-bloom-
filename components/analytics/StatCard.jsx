import React from "react";

const C = { navy: "#0C1C77", slate: "#4A5A63", line: "#E1ECE8", teal: "#00C6C7" };

export default function StatCard({ icon: Icon, label, value, unit, hint, accent = C.teal }) {
  return (
    <div className="relative p-5 rounded-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <span className="absolute -top-10 -left-8 w-28 h-28 rounded-full blur-2xl opacity-[0.13] pointer-events-none" style={{ background: accent }} />
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}18` }}>
            <Icon size={16} color={accent} strokeWidth={2} />
          </span>
          <span className="text-[11px] font-bold" style={{ color: C.slate }}>{label}</span>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="font-display text-2xl sm:text-3xl leading-none" style={{ color: C.navy, fontWeight: 800 }}>{value}</span>
          {unit && <span className="text-xs mb-0.5" style={{ color: C.slate }}>{unit}</span>}
        </div>
        {hint && <span className="text-[11px] leading-snug" style={{ color: C.slate }}>{hint}</span>}
      </div>
    </div>
  );
}
