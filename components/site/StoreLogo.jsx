import React from "react";
import { C } from "../../lib/colors.js";
import PetalLogo from "./PetalLogo.jsx";
import { STORE } from "../../config/store.config.js";

/**
 * شعار المتجر — يستخدم الصورة المرفوعة من لوحة التحكم إن وُجدت،
 * وإلا يعود للشعار المتجهي المدمج. هكذا لا يظهر فراغ أبدًا.
 */
export default function StoreLogo({ settings = {}, size = 34, showText = true, dark = false }) {
  const logo = (settings.store_logo || "").trim();
  const name = (settings.store_short_name || settings.store_name || STORE.shortName).trim();
  const tagline = (settings.store_tagline ?? STORE.tagline).trim();

  return (
    <span className="flex items-center gap-2">
      {logo ? (
        <img
          src={logo}
          alt={name}
          width={size}
          height={size}
          className="object-contain shrink-0"
          style={{ height: size, width: "auto", maxWidth: size * 3 }}
        loading="lazy" decoding="async" />
      ) : (
        <PetalLogo size={size} />
      )}

      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-display" style={{ color: dark ? "#fff" : C.navy, fontSize: size * 0.5 }}>
            {name}
          </span>
          {tagline && (
            <span className="text-[10px] font-medium" style={{ color: dark ? "rgba(255,255,255,.6)" : C.slate }}>
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
