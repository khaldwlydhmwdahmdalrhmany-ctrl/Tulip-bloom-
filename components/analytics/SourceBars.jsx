import React from "react";
import { labelSource, labelMedium, isPaid } from "../../lib/attribution.js";

const C = { navy: "#0C1C77", slate: "#4A5A63", line: "#E1ECE8", teal: "#00C6C7", gold: "#F2B01E", success: "#1B9C68" };

const SOURCE_COLORS = {
  google: "#4285F4", meta: "#0866FF", instagram: "#E4405F", tiktok: "#25F4EE",
  snapchat: "#FFC800", microsoft: "#00A4EF", x: "#111111", youtube: "#FF0000",
  whatsapp: "#25D366", linkedin: "#0A66C2", direct: "#8899A6",
};

export default function SourceBars({ rows = [], valueKey = "sessions", showMedium }) {
  if (!rows.length) {
    return <p className="text-xs py-6 text-center" style={{ color: C.slate }}>لا توجد بيانات بعد لهذه الفترة.</p>;
  }

  const max = Math.max(...rows.map((r) => Number(r[valueKey]) || 0), 1);

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r, i) => {
        const val = Number(r[valueKey]) || 0;
        const pct = (val / max) * 100;
        const color = SOURCE_COLORS[r.source] || C.teal;
        const paid = showMedium && isPaid(r.medium);

        return (
          <li key={i} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="font-bold truncate" style={{ color: C.navy }}>{labelSource(r.source)}</span>
                {showMedium && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={paid
                      ? { background: "#FFF4E0", color: "#8A6200" }
                      : { background: "#E7F7EF", color: C.success }}
                  >
                    {labelMedium(r.medium)}
                  </span>
                )}
              </span>
              <span className="font-bold shrink-0" style={{ color: C.navy }}>
                {val.toLocaleString("ar-SA")}
                {r.revenue !== undefined && Number(r.revenue) > 0 && (
                  <span className="font-normal mr-2" style={{ color: C.slate }}>
                    · {Number(r.revenue).toLocaleString("ar-SA")} ر.س
                  </span>
                )}
              </span>
            </div>

            <div className="h-2 rounded-full overflow-hidden" style={{ background: C.line }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
