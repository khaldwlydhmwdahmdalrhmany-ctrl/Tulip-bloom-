import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { C } from "../../lib/colors.js";

/**
 * ترويسة قسم موحّدة — تضمن تسلسلًا بصريًا متسقًا في كل الصفحات.
 * align="center" للأقسام المركزية، "start" (افتراضي) للأقسام العادية.
 */
export default function SectionHead({ eyebrow, title, desc, href, hrefLabel = "عرض الكل", align = "start" }) {
  const centered = align === "center";

  return (
    <div className={`mb-10 flex gap-4 ${centered ? "flex-col items-center text-center" : "flex-col sm:flex-row sm:items-end sm:justify-between"}`}>
      <div className={centered ? "max-w-2xl" : ""}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="h-section font-display mt-1.5" style={{ color: C.navy }}>{title}</h2>
        {desc && (
          <p className={`text-sm sm:text-base mt-3 leading-relaxed ${centered ? "mx-auto" : ""}`} style={{ color: C.slate }}>
            {desc}
          </p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="group shrink-0 inline-flex items-center gap-1.5 text-sm font-bold whitespace-nowrap"
          style={{ color: C.navy }}
        >
          {hrefLabel}
          <ArrowLeft size={15} className="arrow-slide" />
        </Link>
      )}
    </div>
  );
}
