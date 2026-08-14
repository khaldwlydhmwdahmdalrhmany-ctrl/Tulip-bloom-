"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, ArrowLeft } from "lucide-react";
import { C } from "../../lib/colors.js";
import { getRatioCss } from "../../lib/banners.js";
import PetalLogo from "./PetalLogo.jsx";
import { STORE } from "../../config/store.config.js";
import { HERO_FALLBACK } from "../../config/content.config.js";

// بنر بصورة أو بدونها (متدرج لوني بديل)
function BannerSlide({ banner, fit = "cover" }) {
  const href = banner.linkCategorySlug ? `/category/${banner.linkCategorySlug}` : "/shop";
  if (banner.imageUrl) {
    return (
      <Link href={href} className="absolute inset-0 w-full h-full block">
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-full h-full"
          style={{ objectFit: fit, objectPosition: "center" }}
        loading="lazy" decoding="async" />
      </Link>
    );
  }
  return (
    <Link href={href} className="absolute inset-0 w-full h-full flex items-center justify-center text-center px-6" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.teal})` }}>
      <div>
        <h2 className="font-display text-2xl sm:text-4xl mb-2" style={{ color: "#fff" }}>{banner.title}</h2>
        {banner.subtitle && <p className="text-sm sm:text-base" style={{ color: "rgba(255,255,255,0.85)" }}>{banner.subtitle}</p>}
      </div>
    </Link>
  );
}

function DefaultHero() {
  const router = useRouter();
  return (
    <section className="relative overflow-hidden" style={{ background: C.pearl }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col gap-6 text-center lg:text-right items-center lg:items-start order-2 lg:order-1">
          <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: C.mintTint, color: C.navy }}>
            {HERO_FALLBACK.badge}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl leading-tight max-w-xl" style={{ color: C.navy }}>
            {STORE.shortName}
            <span style={{ color: C.teal }}> {STORE.tagline}</span>
          </h1>
          <p className="max-w-lg text-sm sm:text-base" style={{ color: C.slate }}>
            {STORE.description}
          </p>
          <button onClick={() => router.push("/shop")} className="px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2" style={{ background: C.navy, color: C.pearl }}>
            {HERO_FALLBACK.ctaLabel} <ArrowLeft size={16} />
          </button>
        </div>
        <div className="order-1 lg:order-2 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full blur-3xl opacity-30" style={{ background: `radial-gradient(circle, ${C.mint}, transparent 70%)` }} />
          <PetalLogo size={220} spin />
        </div>
      </div>
    </section>
  );
}

export default function HeroBanners({ banners }) {
  const [slide, setSlide] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => setSlide((s) => (s + 1) % banners.length), 6000);
    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  if (!banners || banners.length === 0) return <DefaultHero />;

  const goTo = (i) => setSlide(i);
  const next = () => setSlide((s) => (s + 1) % banners.length);
  const prev = () => setSlide((s) => (s - 1 + banners.length) % banners.length);

  // النسبة تؤخذ من أول بنر؛ "auto" تعني احترام أبعاد الصورة الأصلية
  const ratioCss = getRatioCss(banners[0]?.ratio) || "1774 / 887";
  const fit = banners[0]?.ratio && banners[0].ratio !== "auto" ? "cover" : "contain";

  return (
    <section className="relative w-full overflow-hidden" style={{ aspectRatio: ratioCss, background: C.navyDeep }}>
      {banners.map((b, i) => (
        <div key={b.id} className="hero-fade absolute inset-0 w-full h-full" style={{ opacity: i === slide ? 1 : 0, pointerEvents: i === slide ? "auto" : "none" }}>
          <BannerSlide banner={b} fit={fit} />
        </div>
      ))}
      {banners.length > 1 && (
        <>
          <button onClick={prev} aria-label="السابق" className="absolute top-1/2 -translate-y-1/2 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: "rgba(255,255,255,0.85)", color: C.navy }}>
            <ChevronRight size={20} />
          </button>
          <button onClick={next} aria-label="التالي" className="absolute top-1/2 -translate-y-1/2 left-4 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: "rgba(255,255,255,0.85)", color: C.navy }}>
            <ChevronLeft size={20} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} aria-label={`الشريحة ${i + 1}`} className="rounded-full transition-all" style={{ width: i === slide ? 22 : 8, height: 8, background: i === slide ? C.pearl : "rgba(255,255,255,0.55)" }} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
