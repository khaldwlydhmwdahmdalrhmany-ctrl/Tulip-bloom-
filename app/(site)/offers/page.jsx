import React from "react";
import Link from "next/link";
import { getProducts, getBanners, getCategories } from "../../../lib/queries.js";
import { C, discountPercent, formatPrice } from "../../../lib/colors.js";
import { isOfferProduct } from "../../../lib/badges.js";
import { pickBanner } from "../../../lib/banners.js";
import PageHero from "../../../components/site/PageHero.jsx";
import TrustStrip from "../../../components/site/TrustStrip.jsx";
import ProductBrowser from "../../../components/site/ProductBrowser.jsx";
import ProductCard from "../../../components/site/ProductCard.jsx";
import SectionHead from "../../../components/site/SectionHead.jsx";
import OfferSpotlight from "../../../components/site/OfferSpotlight.jsx";
import SavingsSummary from "../../../components/site/SavingsSummary.jsx";
import CtaBand from "../../../components/site/CtaBand.jsx";
import { STORE } from "../../../config/store.config.js";

export default async function OffersPage() {
  const [products, categories, offerBanners] = await Promise.all([
    getProducts(),
    getCategories(),
    getBanners({ placement: "offers" }),
  ]);

  const pageBanner = pickBanner(offerBanners);

  // العروض = خصم سعري فعلي، أو شارة ترويجية اختارها المسؤول من لوحة التحكم
  // (بعض العروض حزم أو هدايا لا تخفيضات، فلا يكفي فرق السعر وحده)
  const onSale = products
    .filter(isOfferProduct)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // صفقة الصدارة = أكبر توفير بالريال، لا أعلى نسبة.
  // خصم 50% على 100 ريال يوفّر 50؛ خصم 20% على 2000 يوفّر 400.
  // الأولوية لما ثبّته المسؤول يدويًا، وإلا أكبر توفير بالريال
  const pinned = onSale.find((p) => p.featuredOffer);
  const spotlight = pinned || [...onSale]
    .filter((p) => p.oldPrice > p.price)
    .sort((a, b) => (b.oldPrice - b.price) - (a.oldPrice - a.price))[0] || onSale[0];

  const rest = onSale.filter((p) => p.id !== spotlight?.id);

  // تجميع حسب شريحة التوفير — يساعد من يبحث بميزانية محددة
  const tiers = [
    { key: "big",  label: "توفير 500 ر.س فأكثر", test: (p) => p.oldPrice - p.price >= 500 },
    { key: "mid",  label: "توفير 100 – 499 ر.س", test: (p) => { const s = p.oldPrice - p.price; return s >= 100 && s < 500; } },
    { key: "small",label: "توفير أقل من 100 ر.س", test: (p) => p.oldPrice - p.price < 100 },
  ].map((t) => ({ ...t, items: rest.filter((p) => p.oldPrice > p.price && t.test(p)) })).filter((t) => t.items.length > 0);

  return (
    <div>
      <PageHero
        title={`عروض ${STORE.shortName}`}
        subtitle="خصومات فعلية على أجهزة مختارة — كل سعر قديم معروض هنا هو سعر بِعنا به فعلًا."
        imageUrl={pageBanner?.imageUrl}
        ratio={pageBanner?.ratio}
        bannerCta={pageBanner?.ctaHref ? { label: pageBanner.ctaLabel, href: pageBanner.ctaHref } : undefined}
        icon="Tag"
        color={C.navy}
        count={onSale.length}
      />

      <TrustStrip />

      {onSale.length === 0 ? (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
          <div className="text-center py-20 rounded-3xl" style={{ background: C.offWhite }}>
            <p className="font-display text-xl mb-2" style={{ color: C.navy }}>لا توجد عروض نشطة حاليًا</p>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: C.slate }}>
              نفضّل ألا نخترع خصومات وهمية. حين ينزل عرض حقيقي ستجده هنا أولًا.
            </p>
            <Link href="/shop" className="btn px-7 py-3 text-sm" style={{ background: C.navy, color: "#fff" }}>
              تصفّح كل المنتجات
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* ملخّص التوفير — أرقام محسوبة لا مكتوبة */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16">
            <SavingsSummary products={onSale.filter((p) => p.oldPrice > p.price)} />
          </section>

          {/* صفقة الصدارة */}
          {spotlight && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
              <OfferSpotlight product={spotlight} />
            </section>
          )}

          {/* شرائح التوفير */}
          {tiers.length > 1 && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14">
              <SectionHead
                eyebrow="اختصر البحث"
                title="تصفّح حسب حجم التوفير"
                desc="بعض الأجهزة خصمها بالنسبة صغير لكن توفيرها بالريال كبير — والعكس."
              />
              <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                {tiers.map((t) => {
                  const sum = t.items.reduce((s, p) => s + (p.oldPrice - p.price), 0);
                  return (
                    <a
                      key={t.key}
                      href={`#tier-${t.key}`}
                      className="lift group p-5 rounded-2xl flex flex-col gap-1.5"
                      style={{ background: "#fff", border: `1px solid ${C.line}` }}
                    >
                      <span className="font-bold text-sm" style={{ color: C.navy }}>{t.label}</span>
                      <span className="text-xs" style={{ color: C.slate }}>
                        {t.items.length} منتج — بمجموع توفير {formatPrice(Math.round(sum))} ر.س
                      </span>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* كل العروض */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
            <SectionHead eyebrow="القائمة الكاملة" title="كل المنتجات المخفّضة" />
            <ProductBrowser categories={categories} products={onSale} activeCatSlug={null} />
          </section>

          {/* مراسي شرائح التوفير */}
          {tiers.map((t) => (
            <section key={t.key} id={`tier-${t.key}`} className="max-w-6xl mx-auto px-4 sm:px-6 pb-14 scroll-mt-24">
              <SectionHead eyebrow="شريحة توفير" title={t.label} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {t.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      <CtaBand
        eyebrow="قبل ما تطلب"
        title="تأكد من التوفّر"
        desc="بعض العروض بكميات محدودة. راسلنا على واتساب ونؤكد لك التوفر فورًا — بلا وعود مبالغ فيها."
        primaryLabel="كل المنتجات"
        primaryHref="/shop"
      />
    </div>
  );
}
