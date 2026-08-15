import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Truck, Wrench, Wallet, ChevronLeft } from "lucide-react";
import { getProductById, getProducts } from "../../../../lib/queries.js";
import { C, SH, formatPrice, discountPercent, isQuoteProduct } from "../../../../lib/colors.js";
import ProductVisual from "../../../../components/site/ProductVisual.jsx";
import ProductCard from "../../../../components/site/ProductCard.jsx";
import InstallmentBadge from "../../../../components/site/InstallmentBadge.jsx";
import ProductActions from "../../../../components/site/ProductActions.jsx";
import MobileOrderDock from "../../../../components/site/MobileOrderDock.jsx";
import ProductViewTracker from "../../../../components/site/ProductViewTracker.jsx";
import {
  productMetadata, productSchema, breadcrumbSchema, faqSchema,
  productImageAlt, JsonLd,
} from "../../../../lib/seo.jsx";
import Rating from "../../../../components/site/Rating.jsx";
import StockBadge from "../../../../components/site/StockBadge.jsx";
import ProductTabs from "../../../../components/site/ProductTabs.jsx";
import SpecsList, { parseSpecs } from "../../../../components/site/SpecsList.jsx";
import SectionHead from "../../../../components/site/SectionHead.jsx";
import TrustStrip from "../../../../components/site/TrustStrip.jsx";
import FaqAccordion from "../../../../components/site/FaqAccordion.jsx";
import CtaBand from "../../../../components/site/CtaBand.jsx";
import { PRODUCT_PAGE } from "../../../../config/content.config.js";
import { getIcon } from "../../../../lib/iconMap.js";

const PRODUCT_FAQS = PRODUCT_PAGE.faqs;

/** عنوان ووصف وبطاقة مشاركة — تُشتق تلقائيًا من بيانات المنتج. */
export async function generateMetadata({ params }) {
  const product = await getProductById(params.id);
  if (!product) return { title: "المنتج غير موجود" };
  return productMetadata(product);
}

export default async function ProductPage({ params }) {
  const product = await getProductById(params.id);
  if (!product) notFound();

  const siblings = await getProducts({ categorySlug: product.category?.slug });
  const related = siblings.filter((p) => p.id !== product.id).slice(0, 4);

  const off = discountPercent(product.price, product.oldPrice);
  const specs = parseSpecs(product.fullDescription);
  const catColor = product.category?.color || C.navy;

  // الشارات السريعة تُقرأ من التهيئة — `when` يحدّد شرط الظهور
  const shows = {
    always: true,
    freeShipping: !!product.freeShipping,
    freeInstall: !!product.freeInstall,
    priced: product.price >= 100,
  };
  const quickFeatures = PRODUCT_PAGE.quickFeatures
    .filter((f) => shows[f.when ?? "always"])
    .map((f) => ({ icon: getIcon(f.icon), label: f.label, on: true }));

  return (
    <div>
      <ProductViewTracker product={product} />

      {/* بيانات منظّمة — تُمكّن جوجل من عرض السعر والتوفّر في نتائج البحث */}
      <JsonLd data={productSchema(product)} />
      <JsonLd data={breadcrumbSchema([
        { name: "الرئيسية", url: "/" },
        { name: "المنتجات", url: "/shop" },
        { name: product.category?.name, url: `/category/${product.category?.slug}` },
        { name: product.name, url: `/product/${product.id}` },
      ])} />
      <JsonLd data={faqSchema(PRODUCT_FAQS)} />

      {/* مسار التنقل */}
      <nav aria-label="مسار التنقل" className="max-w-6xl mx-auto px-4 sm:px-6 py-5 text-xs flex items-center gap-1 flex-wrap" style={{ color: C.slateLight }}>
        <Link href="/" className="hover:underline">الرئيسية</Link>
        <ChevronLeft size={12} />
        <Link href="/shop" className="hover:underline">المنتجات</Link>
        <ChevronLeft size={12} />
        <Link href={`/category/${product.category?.slug}`} className="hover:underline">{product.category?.name}</Link>
        <ChevronLeft size={12} />
        <span style={{ color: C.ink }} className="font-semibold">{product.name}</span>
      </nav>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* الصورة */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${C.line}`, boxShadow: SH.md }}>
            <ProductVisual product={product} heightClass="h-80 sm:h-[28rem]" />
          </div>
        </div>

        {/* التفاصيل */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <Link href={`/category/${product.category?.slug}`} className="text-xs font-bold" style={{ color: catColor }}>
              {product.category?.name}
            </Link>
            {product.brand && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: C.offWhite, color: C.slate }}>
                {product.brand}
              </span>
            )}
          </div>

          <h1 className="h-display font-display" style={{ color: C.navy, fontSize: "clamp(1.5rem,3.2vw,2.25rem)" }}>
            {product.name}
          </h1>

          {/* ١ — التقييم */}
          <div className="flex items-center gap-4 flex-wrap">
            <Rating rating={product.rating} reviewCount={product.reviewCount} size={16} />
            <StockBadge stock={product.stock} size="md" />
          </div>

          {/* ٢ — السعر */}
          <div className="p-5 rounded-2xl flex flex-col gap-3" style={{ background: C.offWhite }}>
            <div className="flex items-end gap-3 flex-wrap">
              {isQuoteProduct(product) ? (
                <span className="font-display text-2xl leading-tight" style={{ color: C.teal }}>
                  السعر حسب المواصفات
                </span>
              ) : (
                <span className="font-display text-3xl leading-none" style={{ color: C.navy }}>
                  {formatPrice(product.price)} <span className="text-sm font-normal">ر.س</span>
                </span>
              )}
              {off > 0 && (
                <>
                  <span className="text-sm line-through font-semibold" style={{ color: C.oldPrice }}>
                    {formatPrice(product.oldPrice)} ر.س
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: C.danger, color: "#fff" }}>
                    وفّر {off}%
                  </span>
                </>
              )}
            </div>

            {/* ٣ — المميزات السريعة أسفل السعر مباشرة */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {quickFeatures.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold" style={{ color: C.navy }}>
                  <f.icon size={14} color={C.teal} className="shrink-0" /> {f.label}
                </span>
              ))}
            </div>

            <div className="pt-1"><InstallmentBadge price={product.price} compact /></div>
          </div>

          {/* ٤ + ٥ — الكمية والأزرار */}
          <ProductActions product={product} />

          {/* ٦ — نبذة */}
          {product.description && (
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: C.slate }}>
              {product.description}
            </p>
          )}
        </div>
      </section>

      <TrustStrip />

      {/* ٧ + ٨ — المواصفات والتفاصيل */}
      {(product.fullDescription || specs.length > 0) && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
          <ProductTabs
            tabs={[
              {
                label: "الوصف الكامل",
                content: product.fullDescription ? (
                  <div className="text-sm sm:text-base leading-loose whitespace-pre-line max-w-3xl" style={{ color: C.slate }}>
                    {product.fullDescription}
                  </div>
                ) : null,
              },
              {
                label: "المواصفات",
                content: specs.length > 0 ? <SpecsList specs={specs} /> : null,
              },
              {
                label: PRODUCT_PAGE.assurances.title,
                content: (
                  <div className="grid sm:grid-cols-3 gap-4 max-w-4xl">
                    {[
                      { icon: Truck, t: "الشحن", d: product.freeShipping ? PRODUCT_PAGE.assurances.shippingFree : PRODUCT_PAGE.assurances.shippingPaid },
                      { icon: Wrench, t: PRODUCT_PAGE.assurances.secondTitle, d: PRODUCT_PAGE.assurances.second },
                      { icon: ShieldCheck, t: PRODUCT_PAGE.assurances.warrantyTitle, d: PRODUCT_PAGE.assurances.warranty },
                    ].map((b, i) => (
                      <div key={i} className="p-5 rounded-2xl flex flex-col gap-2" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                        <b.icon size={20} color={C.teal} strokeWidth={1.9} />
                        <h4 className="font-bold text-sm" style={{ color: C.navy }}>{b.t}</h4>
                        <p className="text-xs leading-relaxed" style={{ color: C.slate }}>{b.d}</p>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </section>
      )}

      {/* ٩ — الأسئلة الشائعة */}
      <section style={{ background: C.offWhite }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
          <SectionHead align="center" eyebrow="قبل ما تطلب" title="أسئلة شائعة عن هذا المنتج" />
          <FaqAccordion items={PRODUCT_FAQS} />
        </div>
      </section>

      {/* ١٠ — منتجات مشابهة */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
          <SectionHead
            eyebrow="قد يعجبك أيضًا"
            title="منتجات مشابهة"
            href={`/category/${product.category?.slug}`}
            hrefLabel={`كل ${product.category?.name}`}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {related.map((p) => (<ProductCard key={p.id} product={p} />))}
          </div>
        </section>
      )}

      <CtaBand
        eyebrow={PRODUCT_PAGE.cta.eyebrow}
        title={PRODUCT_PAGE.cta.title}
        desc={PRODUCT_PAGE.cta.desc}
        primaryLabel={PRODUCT_PAGE.cta.primaryLabel}
        primaryHref={`/category/${product.category?.slug}`}
        whatsappMessage={`السلام عليكم، عندي استفسار عن: ${product.name}`}
      />

      {/* شريط الطلب اللاصق — الجوال فقط، يظهر بعد التمرير */}
      <MobileOrderDock product={product} />
    </div>
  );
}
