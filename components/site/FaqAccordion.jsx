"use client";
import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { C } from "../../lib/colors.js";

export { HOME_FAQS } from "../../config/content.config.js";
import { HOME_FAQS as DEFAULT_FAQS } from "../../config/content.config.js";

export default function FaqAccordion({ items = DEFAULT_FAQS }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className="rounded-2xl overflow-hidden transition-colors duration-300"
            style={{
              background: isOpen ? C.mintTint : C.pearl,
              border: `1px solid ${isOpen ? `${C.teal}44` : C.line}`,
            }}
          >
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-right"
            >
              <span className="font-bold text-sm sm:text-[15px] leading-snug" style={{ color: C.navy }}>
                {item.q}
              </span>
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300"
                style={{ background: isOpen ? C.teal : C.mintTint, color: isOpen ? "#fff" : C.navy }}
              >
                {isOpen ? <Minus size={15} /> : <Plus size={15} />}
              </span>
            </button>

            <div
              className="grid transition-all duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-4 sm:px-5 pb-5 text-sm leading-relaxed" style={{ color: C.slate }}>
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
