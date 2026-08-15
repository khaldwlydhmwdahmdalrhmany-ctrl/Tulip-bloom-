import React from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { C, SH, discountPercent, buildWhatsAppLink } from "../../lib/colors.js";
import {
  TESTIMONIALS,
  CTA as CTA_CONTENT,
  // ── ثوابت متجر توليب بلوم ──
  EDITORIAL_HERO,
  CARE_STEPS,
  SIZE_TIERS,
  SIZE_NOTE,
  OCCASIONS,
  ORDER_STEPS,
} from "../../config/content.config.js";
import { getIcon } from "../../lib/iconMap.js";

import HeroBanners from "../site/HeroBanners.jsx";
import FeatureStrip from "../site/FeatureStrip.jsx";
import TrustStrip from "../site/TrustStrip.jsx";
import CategoryCard from "../site/CategoryCard.jsx";
import ProductCard from "../site/ProductCard.jsx";
import SectionHead from "../site/SectionHead.jsx";
import WhyUs from "../site/WhyUs.jsx";
import FaqAccordion from "../site/FaqAccordion.jsx";
import CtaBand from "../site/CtaBand.jsx";

// ── أقسام تفاعلية خاصة بتوليب بلوم (مكوّنات عميل) ──
import { DeliveryCountdown, GiftFinder, CareGuide } from "./TulipSections.jsx";

/**
 * ═══════════════════════════════════════════════════════════
 *  سجل الأقسام
 * ═══════════════════════════════════════════════════════════
 *
 * كل قسم دالة تستقبل (props, data) وتعيد JSX.
 * `data` يحوي ما جلبته الصفحة: products, categories, banners, settings.
 *
 * لإضافة قسم جديد:
 *   ١. اكتب دالته هنا
 *   ٢. أضف مفتاحه إلى SECTIONS
 *   ٣. استخدمه في config/sections.config.js
 *
 * لا يحتاج القسم الجديد أي تعديل في ملفات الصفحات.
 */

/** خلفية القسم — tint ملوّنة خفيفة · alt رمادية · افتراضي شفاف. */
const bg = (v) => (v === "tint" ? C.mintTint : v === "alt" ? C.offWhite : undefined);

/** غلاف موحّد يضمن تباعدًا متسقًا بين الأقسام. */
function Wrap({ background, children, first }) {
  const color = bg(background);
  const inner = (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 ${first ? "" : "section-y"}`}>
      {children}
    </div>
  );
  return color ? <section style={{ background: color }}>{inner}</section> : <section>{inner}</section>;
}

/** يختار المنتجات حسب `source` — منطق واحد لكل شبكات المنتجات. */
function pickProducts(source, data, limit) {
  const all = data.products || [];
  let list = all;

  if (source === "offers") {
    list = all
      .filter((p) => discountPercent(p.price, p.oldPrice) > 0)
      .sort((a, b) => discountPercent(b.price, b.oldPrice) - discountPercent(a.price, a.oldPrice));
  } else if (source === "bestSellers") {
    const flagged = all.filter((p) => p.badge && /الأكثر/.test(p.badge));
    list = flagged.length >= 4 ? flagged : all;
  } else if (source === "newest") {
    list = [...all].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (source?.startsWith("category:")) {
    const slug = source.split(":")[1];
    list = all.filter((p) => p.categorySlug === slug);
  }

  return list.slice(0, limit || 8);
}

export const SECTIONS = {
  /* ── الهيرو ── */
  hero: (props, data) => {
    const banners = (data.banners || []).filter((b) => b.active && b.placement === (props.placement || "home"));
    return <HeroBanners banners={banners} />;
  },

  /* ── شريط المميزات ── */
  features: () => <FeatureStrip />,

  /* ── شريط الثقة ── */
  trust: (props) => <TrustStrip variant={props.variant} />,

  /* ── شبكة التصنيفات ── */
  categories: (props, data) => {
    const cats = data.categories || [];
    if (!cats.length) return null;
    const cols = props.columns || 6;
    return (
      <Wrap background={props.background}>
        <SectionHead eyebrow={props.eyebrow} title={props.title} desc={props.desc} href={props.href} />
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${cols} gap-3 sm:gap-4`}>
          {cats.map((c) => (<CategoryCard key={c.id} category={c} />))}
        </div>
      </Wrap>
    );
  },

  /* ── شبكة منتجات ── */
  productGrid: (props, data) => {
    const items = pickProducts(props.source, data, props.limit);
    if (!items.length) return null;
    return (
      <Wrap background={props.background}>
        <SectionHead
          eyebrow={props.eyebrow} title={props.title} desc={props.desc}
          href={props.href} hrefLabel={props.hrefLabel}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((p) => (<ProductCard key={p.id} product={p} />))}
        </div>
      </Wrap>
    );
  },

  /* ── بنر مستقل ── */
  banner: (props, data) => {
    const list = (data.banners || []).filter((b) => b.active && b.placement === (props.placement || "home"));
    const b = list[props.index || 0];
    if (!b) return null;
    return (
      <Wrap background={props.background}>
        <Link
          href={b.linkCategorySlug ? `/category/${b.linkCategorySlug}` : props.href || "/shop"}
          className="lift zoom-wrap block rounded-3xl overflow-hidden"
          style={b.imageUrl ? { border: `1px solid ${C.line}` } : { background: `linear-gradient(135deg, ${C.navy}, ${C.teal})` }}
        >
          {b.imageUrl ? (
            <img src={b.imageUrl} alt={b.title} className="zoom-img w-full h-auto" loading="lazy" />
          ) : (
            <div className="p-10 flex flex-col gap-2 text-center" style={{ color: "#fff" }}>
              <span className="font-display text-2xl">{b.title}</span>
              {b.subtitle && <span className="text-sm opacity-90">{b.subtitle}</span>}
            </div>
          )}
        </Link>
      </Wrap>
    );
  },

  /* ── لماذا نحن ── */
  whyUs: () => <WhyUs />,

  /* ── آراء العملاء ── */
  testimonials: (props) => {
    // يختفي تلقائيًا حين لا توجد آراء حقيقية — لا نعرض شهادات مفبركة
    if (!TESTIMONIALS.length) return null;
    return (
      <Wrap background={props.background}>
        <SectionHead align="center" eyebrow={props.eyebrow} title={props.title} />
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
          {TESTIMONIALS.map((t, i) => (
            <figure key={i} className="lift p-6 rounded-2xl flex flex-col gap-3"
                    style={{ background: C.pearl, border: `1px solid ${C.line}`, boxShadow: SH.sm }}>
              <div className="flex gap-0.5" aria-label={`تقييم ${t.rating || 5} من 5`}>
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} size={14} fill={C.gold} color={C.gold} />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed flex-1" style={{ color: C.ink }}>«{t.text}»</blockquote>
              <figcaption className="text-xs font-bold" style={{ color: C.navy }}>
                {t.name} {t.city && <span style={{ color: C.slateLight }}>— {t.city}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </Wrap>
    );
  },

  /* ── الأسئلة الشائعة ── */
  faq: (props) => (
    <Wrap background={props.background || "alt"}>
      <SectionHead align="center" eyebrow={props.eyebrow} title={props.title} desc={props.desc} />
      <FaqAccordion items={props.items} />
      {props.href && (
        <div className="text-center mt-8">
          <Link href={props.href} className="group inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: C.navy }}>
            كل الأسئلة <ArrowLeft size={15} className="arrow-slide" />
          </Link>
        </div>
      )}
    </Wrap>
  ),

  /* ── دعوة لاتخاذ إجراء ── */
  cta: (props) => (
    <CtaBand
      eyebrow={props.eyebrow || CTA_CONTENT.eyebrow}
      title={props.title || CTA_CONTENT.title}
      desc={props.desc || CTA_CONTENT.desc}
      primaryLabel={props.primaryLabel || CTA_CONTENT.primaryLabel}
      primaryHref={props.primaryHref || CTA_CONTENT.primaryHref}
      whatsappMessage={props.whatsappMessage || CTA_CONTENT.whatsappMessage}
    />
  ),

  /* ── فاصل بصري ── */
  spacer: (props) => <div style={{ height: props.height || "3rem" }} />,

  /* ═══════════════════════════════════════════════════════════
   *  أقسام مضافة لمتجر توليب بلوم — إضافة فقط، بلا لمس ما سبق
   * ═══════════════════════════════════════════════════════════ */

  /**
   * ── مقارنة المقاسات ──
   * يحلّ محل حقل `sizes` في المخطط: يشرح للزائر ما يعنيه كل مقاس
   * قبل أن يختار المنتج، بدل إضافة عمود يفرض تعديل النواة كلها.
   * المصدر: SIZE_TIERS في config/content.config.js
   */
  sizeGuide: (props) => {
    const tiers = props.tiers || SIZE_TIERS;
    if (!tiers?.length) return null;

    const rows = [
      { label: "عدد الأزهار", k: "stems" },
      { label: "الارتفاع التقريبي", k: "height" },
      { label: "النطاق السعري", k: "range" },
      { label: "يناسب", k: "fit" },
    ];

    return (
      <Wrap background={props.background}>
        <SectionHead
          align="center"
          eyebrow={props.eyebrow || "قبل ما تطلب"}
          title={props.title || "دليل المقاسات"}
          desc={props.desc || "ثلاثة مقاسات — اختر بحسب المناسبة لا بحسب السعر وحده."}
        />

        {/* بطاقات على الجوال — الجدول الأفقي لا يُقرأ على شاشة ضيقة */}
        <div className="grid gap-3 sm:hidden">
          {tiers.map((t) => (
            <div
              key={t.key}
              className="rounded-2xl p-5 flex flex-col gap-2"
              style={{
                background: t.popular ? C.mintTint : C.pearl,
                border: `1px solid ${t.popular ? C.teal : C.line}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg" style={{ color: C.navy }}>
                  {t.name}
                </span>
                {t.popular && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: C.teal, color: "#fff" }}
                  >
                    الأكثر طلبًا
                  </span>
                )}
              </div>
              {rows.map((r) => (
                <div key={r.k} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-xs font-bold shrink-0" style={{ color: C.slateLight }}>
                    {r.label}
                  </span>
                  <span className="text-left" style={{ color: C.slate }}>{t[r.k]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* جدول مقارنة على الشاشات الأكبر */}
        <div
          className="hidden sm:block rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${C.line}` }}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-right text-xs font-bold w-44" style={{ background: C.offWhite, color: C.slateLight }}>
                  المقاس
                </th>
                {tiers.map((t) => (
                  <th
                    key={t.key}
                    className="p-4 text-center"
                    style={{ background: t.popular ? C.mintTint : C.offWhite }}
                  >
                    <span className="font-display text-lg block" style={{ color: C.navy }}>{t.name}</span>
                    {t.popular && (
                      <span className="text-[10px] font-bold" style={{ color: C.teal }}>الأكثر طلبًا</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.k} style={{ background: i % 2 === 0 ? "#fff" : C.offWhite }}>
                  <td className="p-4 text-xs font-bold" style={{ color: C.navy }}>{r.label}</td>
                  {tiers.map((t) => (
                    <td key={t.key} className="p-4 text-center" style={{ color: C.slate }}>
                      {t[r.k]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(props.note || SIZE_NOTE) && (
          <p className="mt-4 text-xs text-center leading-relaxed" style={{ color: C.slateLight }}>
            {props.note || SIZE_NOTE}
          </p>
        )}
      </Wrap>
    );
  },

  /**
   * ── شبكة المناسبات ──
   * مدخل تصفّح موازٍ للتصنيفات: الزائر يفكّر بالمناسبة لا بنوع المنتج.
   * المصدر: OCCASIONS في config/content.config.js
   */
  occasions: (props) => {
    const items = props.items || OCCASIONS;
    if (!items?.length) return null;

    return (
      <Wrap background={props.background}>
        <SectionHead
          eyebrow={props.eyebrow || "تسوّق حسب المناسبة"}
          title={props.title || "ما هي المناسبة؟"}
          desc={props.desc}
          href={props.href}
          hrefLabel={props.hrefLabel}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {items.map((o) => {
            const Icon = getIcon(o.icon);
            return (
              <a
                key={o.label}
                href={o.msg ? buildWhatsAppLink(o.msg) : o.href}
                target={o.msg ? "_blank" : undefined}
                rel={o.msg ? "noopener noreferrer" : undefined}
                className="lift group rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
                style={{ background: C.pearl, border: `1px solid ${C.line}`, boxShadow: SH.sm }}
              >
                <span
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: C.softTint || C.mintTint, color: C.teal }}
                >
                  <Icon size={20} />
                </span>
                <span className="text-sm font-bold leading-tight" style={{ color: C.navy }}>
                  {o.label}
                </span>
              </a>
            );
          })}
        </div>
      </Wrap>
    );
  },

  /**
   * ── خطوات الطلب ──
   * بديل مستقل عن components/site/HowItWorks.jsx الذي يحمل نصًّا
   * ثابتًا خاصًّا بمجال آخر. هذا يقرأ من التهيئة.
   * المصدر: ORDER_STEPS في config/content.config.js
   */
  orderSteps: (props) => {
    const steps = props.steps || ORDER_STEPS;
    if (!steps?.length) return null;

    return (
      <Wrap background={props.background}>
        <SectionHead
          align="center"
          eyebrow={props.eyebrow || "رحلة الطلب"}
          title={props.title || "كيف تصل هديتك"}
          desc={props.desc}
        />
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {steps.map((s) => {
            const Icon = getIcon(s.icon);
            return (
              <li
                key={s.n}
                className="lift group rounded-2xl p-6 flex flex-col gap-3"
                style={{ background: C.pearl, border: `1px solid ${C.line}`, boxShadow: SH.sm }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ background: C.navy, color: "#fff" }}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="font-display text-2xl" style={{ color: C.lineSoft }}>{s.n}</span>
                </div>
                <span className="font-bold text-sm" style={{ color: C.navy }}>{s.t}</span>
                <p className="text-sm leading-relaxed" style={{ color: C.slate }}>{s.d}</p>
              </li>
            );
          })}
        </ol>
      </Wrap>
    );
  },

  /* ═══════════════════════════════════════════════════════════
   *  أقسام إضافية — توليب بلوم (إضافة فقط)
   * ═══════════════════════════════════════════════════════════ */

  /* ── عدّاد قطع الطلب ── */
  deliveryCountdown: (props) => (
    <DeliveryCountdown cutoffHour={props.cutoffHour ?? 18} background={props.background} />
  ),

  /* ── مُرشِّح الهدايا ── */
  giftFinder: (props) => (
    <GiftFinder
      eyebrow={props.eyebrow}
      title={props.title}
      desc={props.desc}
      background={props.background}
    />
  ),

  /* ── دليل العناية ── */
  careGuide: (props) => (
    <CareGuide
      eyebrow={props.eyebrow}
      title={props.title}
      desc={props.desc}
      steps={props.steps || CARE_STEPS}
      background={props.background}
    />
  ),

  /**
   * ── هيرو تحريري ──
   * بديل شريط البنرات: طباعة كبيرة على جهة، ولوحة بلاطات
   * غير متساوية الارتفاع على الأخرى. الغرض كسر التناظر الذي
   * يجعل كل متجر مبني على النواة يشبه الآخر.
   */
  editorialHero: (props) => {
    const h = { ...EDITORIAL_HERO, ...props };
    return (
      <section style={{ background: bg(props.background) || C.pearl }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12 sm:pt-16 sm:pb-20">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">

            {/* النص */}
            <div className="flex flex-col gap-6 rise">
              {h.eyebrow && <span className="eyebrow">{h.eyebrow}</span>}
              <h1 className="h-display font-display" style={{ color: C.navy }}>
                {h.title}
                {h.titleAccent && (
                  <>
                    <br />
                    <span style={{ color: C.teal }}>{h.titleAccent}</span>
                  </>
                )}
              </h1>
              <p className="text-base leading-loose max-w-md" style={{ color: C.slate }}>
                {h.desc}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link href={h.primaryHref || "/shop"} className="btn px-7 py-3.5 text-sm"
                      style={{ background: C.navy, color: "#fff" }}>
                  {h.primaryLabel} <ArrowLeft size={16} className="arrow-slide" />
                </Link>
                {h.secondaryLabel && (
                  <Link href={h.secondaryHref || "/offers"} className="btn px-7 py-3.5 text-sm"
                        style={{ background: "transparent", color: C.navy, border: `1px solid ${C.line}` }}>
                    {h.secondaryLabel}
                  </Link>
                )}
              </div>

              {h.points?.length > 0 && (
                <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                  {h.points.map((pt) => {
                    const I = getIcon(pt.icon);
                    return (
                      <li key={pt.label} className="flex items-center gap-2 text-xs font-bold"
                          style={{ color: C.slate }}>
                        <I size={14} style={{ color: C.teal }} /> {pt.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* لوحة بصرية غير متناظرة */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {(h.tiles || []).map((t, i) => {
                const I = getIcon(t.icon);
                const lead = i === 0;
                return (
                  <Link
                    key={t.label}
                    href={t.href || "/shop"}
                    className="lift group relative rounded-2xl overflow-hidden flex flex-col justify-end p-5"
                    style={{
                      // البلاطة الأولى تمتد صفّين — الارتفاع المتفاوت هو ما يكسر الشبكة
                      minHeight: lead ? "17rem" : "8rem",
                      gridRow: lead ? "span 2" : "span 1",
                      background: lead ? C.navy : C.mintTint,
                      border: lead ? "none" : `1px solid ${C.line}`,
                    }}
                  >
                    <span
                      className="absolute -top-10 -left-8 w-40 h-40 rounded-full blur-3xl opacity-25 pointer-events-none"
                      style={{ background: lead ? C.teal : C.soft }}
                    />
                    <span className="relative mb-2" style={{ color: lead ? C.teal : C.navy }}>
                      <I size={lead ? 26 : 20} />
                    </span>
                    <span className="relative font-display text-base leading-tight"
                          style={{ color: lead ? "#fff" : C.navy }}>
                      {t.label}
                    </span>
                    {t.note && (
                      <span className="relative text-xs mt-1"
                            style={{ color: lead ? "#ffffffAA" : C.slate }}>
                        {t.note}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  },

  /**
   * ── لوك بوك ──
   * شبكة تحريرية: أول منتج يمتد عمودين. تكسر رتابة الشبكة
   * المتساوية دون أي تغيير في بطاقة المنتج نفسها.
   */
  lookbook: (props, data) => {
    // نفس آلية productGrid — لا مصدر بيانات موازٍ
    const items = pickProducts(props.source || "bestSellers", data, props.limit || 5);
    if (!items.length) return null;
    return (
      <Wrap background={props.background}>
        <SectionHead
          eyebrow={props.eyebrow}
          title={props.title}
          desc={props.desc}
          href={props.href}
          hrefLabel={props.hrefLabel}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((p, i) => (
            <div key={p.id} className={i === 0 ? "lookbook-wide" : ""}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </Wrap>
    );
  },
};

/** أسماء الأقسام المتاحة — مفيد للتوثيق ولوحة تحكم مستقبلية. */
export const SECTION_TYPES = Object.keys(SECTIONS);
