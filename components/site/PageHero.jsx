import React from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { C, buildWhatsAppLink } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";
import { getRatioCss } from "../../lib/banners.js";

/**
 * ترويسة صفحة موحّدة.
 *
 * وضع الصورة:
 *  - ratio="auto" (افتراضي): تُعرض الصورة بأبعادها الطبيعية كاملة، بلا قص إطلاقًا.
 *    هذا يحل مشكلة "البنر يظهر مضغوط": المشكلة كانت ارتفاعًا ثابتًا مع object-cover
 *    يقصّ أعلى الصورة وأسفلها.
 *  - أي نسبة أخرى: تُفرض النسبة ويُقصّ الفائض بتوسيط ذكي.
 *
 * النص يُعرض فوق الصورة فقط عند فرض نسبة؛ أما في الوضع التلقائي فيوضع
 * أسفلها حتى لا يغطي تصميم البنر الذي رفعه المستخدم.
 */
export default function PageHero({
  title,
  subtitle,
  imageUrl,
  ratio = "auto",
  icon,
  color = C.navy,
  count,
  cta,
  whatsapp,
  compact = false,
  bannerCta,     // { label, href } من لوحة التحكم
}) {
  const Icon = getIcon(icon);
  const ratioCss = getRatioCss(ratio);
  const hasImage = Boolean(imageUrl);

  const actions = (cta || whatsapp || bannerCta) && (
    <div className="flex flex-col sm:flex-row gap-3 mt-4">
      {bannerCta?.href && (
        <Link href={bannerCta.href} className="btn group px-6 py-3 text-sm" style={{ background: C.teal, color: "#fff" }}>
          {bannerCta.label || "اعرف المزيد"} <ArrowLeft size={15} className="arrow-slide" />
        </Link>
      )}
      {cta && (
        <Link href={cta.href} className="btn group px-6 py-3 text-sm" style={{ background: "#fff", color: C.navy }}>
          {cta.label} <ArrowLeft size={15} className="arrow-slide" />
        </Link>
      )}
      {whatsapp && (
        <a href={buildWhatsAppLink(whatsapp)} target="_blank" rel="noopener noreferrer"
           className="btn px-6 py-3 text-sm" style={{ background: "#25D366", color: "#fff" }}>
          <MessageCircle size={16} /> تواصل عبر واتساب
        </a>
      )}
    </div>
  );

  // ═══ صورة بأبعادها الطبيعية — بلا قص ═══
  if (hasImage && !ratioCss) {
    return (
      <section className="w-full">
        <div className="w-full" style={{ background: C.navyDeep }}>
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-auto block"
            style={{ maxHeight: "82vh", objectFit: "contain", margin: "0 auto" }}
          loading="lazy" decoding="async" />
        </div>

        {(title || subtitle || actions) && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col gap-3 max-w-2xl">
              <h1 className="h-display font-display" style={{ color: C.navy }}>{title}</h1>
              {subtitle && (
                <p className="text-sm sm:text-lg leading-relaxed" style={{ color: C.slate }}>{subtitle}</p>
              )}
              {typeof count === "number" && (
                <span className="inline-block w-fit text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: C.mintTint, color: C.navy }}>
                  {count} منتج
                </span>
              )}
              {actions}
            </div>
          </div>
        )}
      </section>
    );
  }

  // ═══ نسبة مفروضة، أو بلا صورة ═══
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: hasImage ? C.navyDeep : `linear-gradient(120deg, ${color}, ${C.navyDeep})`,
        ...(hasImage && ratioCss ? { aspectRatio: ratioCss, minHeight: 220 } : {}),
      }}
    >
      {hasImage && (
        <>
          <img src={imageUrl} alt="" aria-hidden="true"
               className="absolute inset-0 w-full h-full object-cover object-center" loading="lazy" decoding="async" />
          <span className="absolute inset-0"
                style={{ background: "linear-gradient(90deg, rgba(7,18,51,.92) 0%, rgba(7,18,51,.7) 45%, rgba(7,18,51,.3) 100%)" }} />
        </>
      )}

      {!hasImage && (
        <span className="absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: C.teal }} />
      )}

      <div
        className={`relative max-w-6xl mx-auto px-4 sm:px-6 ${compact ? "py-12 sm:py-16" : "py-16 sm:py-24"}`}
        style={hasImage && ratioCss ? { position: "absolute", inset: 0, display: "flex", alignItems: "center" } : {}}
      >
        <div className="flex items-start gap-4 max-w-2xl">
          {!hasImage && (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 mt-1"
                 style={{ background: "rgba(255,255,255,0.15)" }}>
              <Icon size={26} color="#fff" strokeWidth={1.8} />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h1 className="h-display font-display" style={{ color: "#fff" }}>{title}</h1>
            {subtitle && (
              <p className="text-sm sm:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,.82)" }}>{subtitle}</p>
            )}
            {typeof count === "number" && (
              <span className="inline-block w-fit text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                {count} منتج
              </span>
            )}
            {actions}
          </div>
        </div>
      </div>
    </section>
  );
}
