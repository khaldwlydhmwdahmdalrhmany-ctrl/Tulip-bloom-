import React from "react";
import { C, G } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";
import SectionHead from "./SectionHead.jsx";
import { WHY_US } from "../../config/content.config.js";

const REASONS = WHY_US.reasons;



export default function WhyUs() {
  return (
    <section style={{ background: C.offWhite }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <SectionHead
          align="center"
          eyebrow={WHY_US.eyebrow}
          title={WHY_US.title}
          desc={WHY_US.desc}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REASONS.map((r, i) => {
            const Icon = getIcon(r.icon);
            return (
              <div
                key={i}
                className="lift group p-6 rounded-2xl flex flex-col gap-3"
                style={{ background: C.pearl, border: `1px solid ${C.line}` }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: G.aqua }}
                >
                  <Icon size={22} color="#fff" strokeWidth={1.9} />
                </div>
                <h3 className="font-bold text-[15px] leading-snug" style={{ color: C.navy }}>{r.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.slate }}>{r.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
