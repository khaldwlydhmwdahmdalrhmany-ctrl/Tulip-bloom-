import React from "react";
import Link from "next/link";
import { C } from "../../../lib/colors.js";
import PageHero from "../../../components/site/PageHero.jsx";
import CtaBand from "../../../components/site/CtaBand.jsx";
import ProductCard from "../../../components/site/ProductCard.jsx";
import SectionHead from "../../../components/site/SectionHead.jsx";
import { getProducts } from "../../../lib/queries.js";
import { getIcon } from "../../../lib/iconMap.js";
import { buildWhatsAppLink } from "../../../lib/colors.js";
import { OCCASIONS, SIZE_TIERS } from "../../../config/content.config.js";
import { STORE } from "../../../config/store.config.js";

export const revalidate = 300;

export const metadata = {
  title: "تسوّق حسب المناسبة",
  description: `اختر المناسبة ودع ${STORE.shortName} يرشّح لك — عيد ميلاد، تخرّج، خطوبة، مولود جديد، شكر، أو افتتاح.`,
};

export default async function OccasionsPage() {
  const products = await getProducts();
  const featured = products.slice(0, 4);

  return (
    <div>
      <PageHero
        title="ما هي المناسبة؟"
        subtitle="ابدأ من السبب لا من نوع الزهرة — نرشّح لك ما يناسبه فعلًا."
        eyebrow="تسوّق حسب المناسبة"
        compact
      />

      {/* شبكة المناسبات */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {OCCASIONS.map((o) => {
            const Icon = getIcon(o.icon);
            return (
              <a
                key={o.label}
                href={buildWhatsAppLink(o.msg)}
                target="_blank"
                rel="noopener noreferrer"
                className="card-boutique group p-7 flex flex-col gap-4"
              >
                <span className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: C.mintTint, color: C.teal }}>
                  <Icon size={22} />
                </span>
                <div>
                  <h2 className="h-card font-display mb-1.5" style={{ color: C.navy }}>{o.label}</h2>
                  <p className="text-sm leading-relaxed" style={{ color: C.slate }}>
                    أرسل التفاصيل على واتساب ونرجع لك بثلاثة خيارات بالصور.
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* المقاس المناسب لكل مناسبة */}
      <section className="section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
          <SectionHead
            eyebrow="أي مقاس أطلب؟"
            title="المقاس يتبع المناسبة لا الميزانية"
            desc="القاعدة العملية: كلما زاد عدد الحضور كبر المقاس المطلوب."
          />
          <div className="grid sm:grid-cols-3 gap-4">
            {SIZE_TIERS.map((t) => (
              <div key={t.key} className="card-boutique p-6 flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-xl" style={{ color: C.navy }}>{t.name}</span>
                  {t.popular && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: C.teal, color: "#fff" }}>الأكثر طلبًا</span>
                  )}
                </div>
                <p className="text-sm" style={{ color: C.slate }}>{t.fit}</p>
                <p className="num text-xs pt-2" style={{ color: C.slateLight, borderTop: `1px solid ${C.lineSoft}` }}>
                  {t.stems} · {t.range}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* مقترحات */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
          <SectionHead
            eyebrow="يصلح لأغلب المناسبات"
            title="اختيارات آمنة"
            href="/shop"
            hrefLabel="كل التشكيلة"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <CtaBand
        eyebrow="مناسبة غير مذكورة؟"
        title="اكتب لنا وسنتصرّف"
        desc="ننفّذ تنسيقات مخصّصة للأعراس والافتتاحات والمكاتب."
        primaryLabel="تصفّح التشكيلة"
        primaryHref="/shop"
      />
    </div>
  );
}
