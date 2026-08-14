"use client";
import React from "react";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";
import { C } from "../../lib/colors.js";

/**
 * زر موحّد — اللون يتبع *معنى* الفعل لا مزاج التصميم:
 *
 *   primary   كحلي  → الفعل الأساسي (أضف للسلة، إرسال)
 *   urgent    أحمر  → ما فيه استعجال حقيقي (صيانة عاجلة، بلاغ عطل)
 *   whatsapp  أخضر  → يغادر الموقع إلى واتساب
 *   success   أخضر  → تأكيد نجاح
 *   soft      نعناعي→ فعل ثانوي منخفض الالتزام
 *   ghost     شفاف  → تنقّل، ليس التزامًا
 *
 * الأحمر مقصور على الاستعجال الحقيقي فقط. لو صُبغ كل زر بالأحمر
 * فقد الأحمر معناه ولم يعد يلفت الانتباه حين يهم فعلًا.
 */

const VARIANTS = {
  primary:  { bg: C.navy,      fg: "#fff",   ring: `${C.navy}33` },
  urgent:   { bg: C.danger,    fg: "#fff",   ring: `${C.danger}40` },
  whatsapp: { bg: "#25D366",   fg: "#fff",   ring: "#25D36640" },
  success:  { bg: C.success,   fg: "#fff",   ring: `${C.success}40` },
  soft:     { bg: C.mintTint,  fg: C.navy,   ring: `${C.teal}33` },
  ghost:    { bg: "transparent", fg: C.navy, ring: `${C.navy}22`, border: `1.5px solid ${C.line}` },
  onDark:   { bg: "#fff",      fg: C.navy,   ring: "#ffffff44" },
};

const SIZES = {
  xs: "px-3 py-2 text-[11px] gap-1",
  sm: "px-4 py-2.5 text-xs gap-1.5",
  md: "px-6 py-3 text-sm gap-2",
  lg: "px-7 py-3.5 text-sm gap-2",
};

export default function ActionButton({
  variant = "primary",
  size = "md",
  href,
  external,
  loading,
  done,
  doneLabel,
  disabled,
  icon: Icon,
  children,
  className = "",
  pulse,
  ...rest
}) {
  const v = VANT(variant, done);
  const cls = `btn relative overflow-hidden ${SIZES[size] || SIZES.md} ${className} ${pulse ? "pulse-urgent" : ""}`;

  const style = {
    background: v.bg,
    color: v.fg,
    border: v.border || "none",
    boxShadow: `0 0 0 0 ${v.ring}`,
  };

  const inner = (
    <>
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : done ? (
        <Check size={15} />
      ) : Icon ? (
        <Icon size={15} />
      ) : null}
      <span>{done && doneLabel ? doneLabel : children}</span>
    </>
  );

  if (href && !disabled) {
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style} {...rest}>
        {inner}
      </a>
    ) : (
      <Link href={href} className={cls} style={style} {...rest}>{inner}</Link>
    );
  }

  return (
    <button className={cls} style={style} disabled={disabled || loading} {...rest}>
      {inner}
    </button>
  );
}

function VANT(variant, done) {
  if (done) return VARIANTS.success;
  return VARIANTS[variant] || VARIANTS.primary;
}
