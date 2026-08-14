import React from "react";
import { C } from "../../lib/colors.js";
import { activeSocials } from "../../lib/settings.js";
import BrandIcon, { brandColor, brandLabel } from "./BrandIcon.jsx";

/**
 * أيقونات التواصل — الأيقونة واللون يُشتقّان من الرابط نفسه،
 * فأي منصة تضيفها تظهر بعلامتها الحقيقية بلا إعداد إضافي.
 *
 * التلوين بـ CSS خالص عبر متغيّر `--soc`، لا بمعالجات JavaScript،
 * ليبقى المكوّن مكوّن خادم (تمرير onMouseEnter من مكوّن خادم يرمي خطأ
 * ويُسقط كل صفحات الموقع لأن الفوتر في التخطيط العام).
 */
export default function SocialLinks({ settings, variant = "dark", size = 17 }) {
  const socials = activeSocials(settings);
  if (socials.length === 0) return null;

  const onDark = variant === "dark";
  const baseBg = onDark ? "rgba(255,255,255,.1)" : C.offWhite;
  const baseBorder = onDark ? "rgba(255,255,255,.14)" : C.line;

  return (
    <>
      <style>{`
        .soc-link {
          background: var(--soc-bg);
          border: 1px solid var(--soc-border);
          transition: background-color .25s ease, border-color .25s ease, transform .25s ease;
        }
        .soc-link:hover { background: var(--soc); border-color: var(--soc); transform: translateY(-3px); }
        .soc-link:hover .soc-icon { color: var(--soc-fg); }
      `}</style>

      <div className="flex flex-wrap items-center gap-2">
        {socials.map((s) => {
          const color = brandColor(s.href);
          const label = brandLabel(s.href);
          // سناب أصفر فاقع — الأيقونة البيضاء عليه غير مقروءة
          const hoverFg = color.toUpperCase() === "#FFFC00" ? "#111" : "#fff";

          return (
            <a
              key={s.key}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="soc-link w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                "--soc": color,
                "--soc-fg": hoverFg,
                "--soc-bg": baseBg,
                "--soc-border": baseBorder,
              }}
            >
              <BrandIcon
                url={s.href}
                size={size}
                color={onDark ? "#fff" : C.navy}
                className="soc-icon transition-colors duration-250"
              />
            </a>
          );
        })}
      </div>
    </>
  );
}
