import React from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { C } from "../../lib/colors.js";

/**
 * خريطة الموقع — تقبل ثلاث صيغ مما قد يضعه المسؤول في الإعدادات:
 *
 *   ١) نص عادي:        "حي النرجس، الرياض"
 *   ٢) إحداثيات:        "24.7136, 46.6753"
 *   ٣) رابط خرائط جوجل: "https://maps.app.goo.gl/..." أو "https://www.google.com/maps/..."
 *
 * الحالة الثالثة كانت تفشل سابقًا: الرابط كان يُمرَّر كنص بحث داخل
 * ?q= فتبحث خرائط جوجل عن الرابط ككلمات وتعرض موقعًا عشوائيًا.
 */

/** يستخرج الإحداثيات من رابط خرائط جوجل الطويل إن وُجدت. */
function extractCoords(url) {
  // صيغة /@24.7136,46.6753,15z
  const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return `${at[1]},${at[2]}`;

  // صيغة !3d24.7136!4d46.6753
  const bang = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (bang) return `${bang[1]},${bang[2]}`;

  // صيغة ?q=24.7136,46.6753
  const q = url.match(/[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (q) return `${q[1]},${q[2]}`;

  return null;
}

export default function StoreMap({ query }) {
  const raw = String(query || "").trim();
  if (!raw) return null;

  const isUrl = /^https?:\/\//i.test(raw);
  const isCoords = /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(raw);

  let embedSrc = null;
  let openHref = null;

  if (isCoords) {
    const clean = raw.replace(/\s/g, "");
    embedSrc = `https://maps.google.com/maps?q=${clean}&hl=ar&z=16&output=embed`;
    openHref = `https://maps.google.com/?q=${clean}`;
  } else if (isUrl) {
    const coords = extractCoords(raw);
    if (coords) {
      // استخرجنا الإحداثيات — نضمن دقة الموقع في الإطار
      embedSrc = `https://maps.google.com/maps?q=${coords}&hl=ar&z=16&output=embed`;
    }
    // الرابط المختصر (maps.app.goo.gl) لا يحمل إحداثيات ولا يمكن فكّه من الخادم،
    // فنعرض بطاقة بزر يفتح الخريطة بدل إطار يشير لموقع خاطئ.
    openHref = raw;
  } else {
    embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(raw)}&hl=ar&z=14&output=embed`;
    openHref = `https://maps.google.com/?q=${encodeURIComponent(raw)}`;
  }

  // إطار الخريطة متاح
  if (embedSrc) {
    return (
      <div className="rounded-3xl overflow-hidden relative" style={{ border: `1px solid ${C.line}`, minHeight: 260 }}>
        <iframe
          title="موقعنا على الخريطة"
          src={embedSrc}
          className="w-full h-full min-h-[260px] border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        {openHref && (
          <a
            href={openHref}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 left-3 btn px-3.5 py-2 text-[11px] shadow-lg"
            style={{ background: "#fff", color: C.navy }}
          >
            <ExternalLink size={12} /> فتح في الخرائط
          </a>
        )}
      </div>
    );
  }

  // رابط مختصر — بطاقة بديلة بزر واضح
  return (
    <a
      href={openHref}
      target="_blank"
      rel="noopener noreferrer"
      className="lift rounded-3xl p-6 flex items-center gap-4 group"
      style={{ background: C.mintTint, border: `1px solid ${C.teal}44` }}
    >
      <span className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#fff" }}>
        <MapPin size={22} color={C.teal} strokeWidth={1.9} />
      </span>
      <span className="flex flex-col flex-1 min-w-0">
        <span className="font-bold text-sm" style={{ color: C.navy }}>موقعنا على الخريطة</span>
        <span className="text-xs mt-0.5" style={{ color: C.slate }}>اضغط لفتح الاتجاهات في خرائط جوجل</span>
      </span>
      <ExternalLink size={16} color={C.navy} className="shrink-0" />
    </a>
  );
}
