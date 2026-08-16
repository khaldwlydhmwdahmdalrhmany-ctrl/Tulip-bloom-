import React from "react";
import PageHero from "../../../components/site/PageHero.jsx";
import CtaBand from "../../../components/site/CtaBand.jsx";
import ProductCard from "../../../components/site/ProductCard.jsx";
import SectionHead from "../../../components/site/SectionHead.jsx";
import { GiftFinder } from "../../../components/sections/TulipSections.jsx";
import { getProducts } from "../../../lib/queries.js";
import { STORE } from "../../../config/store.config.js";

export const revalidate = 300;

export const metadata = {
  title: "رشّح لي هدية",
  description: `ثلاثة أسئلة و${STORE.shortName} يرشّح لك الهدية المناسبة للمناسبة والميزانية.`,
};

export default async function GiftFinderPage() {
  const products = await getProducts();
  const picks = products.filter((p) => p.stock !== "out_of_stock").slice(0, 4);

  return (
    <div>
      <PageHero
        title="ثلاثة أسئلة ونرشّح لك"
        subtitle="أغلب من يغادر متجر ورد يغادر لأنه لم يعرف ماذا يختار — لا لأن السعر مرتفع."
        eyebrow="مساعد الاختيار"
        compact
      />

      <GiftFinder
        eyebrow="ابدأ من هنا"
        title="ما المناسبة؟"
        desc="إجاباتك تُرسل كرسالة واتساب جاهزة — لا نحفظ منها شيئًا."
      />

      {picks.length > 0 && (
        <section className="section-alt">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
            <SectionHead
              eyebrow="أو تصفّح مباشرة"
              title="اختيارات تصلح لأغلب المناسبات"
              href="/shop"
              hrefLabel="كل التشكيلة"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {picks.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      <CtaBand
        eyebrow="تفضّل المحادثة؟"
        title="راسلنا مباشرة"
        desc="اكتب المناسبة والميزانية ونرسل لك خيارات بالصور خلال دقائق."
        primaryLabel="تصفّح التشكيلة"
        primaryHref="/shop"
      />
    </div>
  );
}
