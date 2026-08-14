import React from "react";
import { detectPlatform, LINKEDIN, GENERIC } from "../../lib/brandIcons.js";

/**
 * أيقونة منصة — تُحدَّد من الرابط تلقائيًا.
 * المسارات رسمية من simple-icons، فتظهر العلامة الحقيقية لا شكلًا مقاربًا.
 */
export default function BrandIcon({ url, size = 18, color = "currentColor", className = "" }) {
  const p = detectPlatform(url) || GENERIC;

  // لينكدإن بلا مسار رسمي — نرسم حرفَي "in" داخل مربّع مستدير
  if (p.key === "linkedin" || (!p.path && p.key !== "generic")) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill={color} className={className} aria-hidden="true">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.55V9h3.57zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
      </svg>
    );
  }

  // نطاق غير معروف — أيقونة رابط محايدة
  if (!p.path) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color}
           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} className={className} aria-hidden="true">
      <path d={p.path} />
    </svg>
  );
}

/** اللون الرسمي للمنصة — يُستخدم في تلوين المرور. */
export function brandColor(url) {
  return (detectPlatform(url) || GENERIC).hex;
}

/** اسم المنصة العربي — يُستخدم في aria-label والعناوين. */
export function brandLabel(url) {
  return (detectPlatform(url) || GENERIC).label;
}
