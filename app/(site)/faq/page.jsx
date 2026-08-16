import React from "react";
import { C } from "../../../lib/colors.js";
import PageHero from "../../../components/site/PageHero.jsx";
import { getBanners } from "../../../lib/queries.js";
import { pickBanner } from "../../../lib/banners.js";
import TrustStrip from "../../../components/site/TrustStrip.jsx";
import FaqAccordion from "../../../components/site/FaqAccordion.jsx";
import CtaBand from "../../../components/site/CtaBand.jsx";
import { ALL_FAQS as FAQS } from "../../../config/content.config.js";



export default async function FAQPage() {
  const pageBanner = pickBanner(await getBanners({ placement: "faq" }));

  return (
    <div>
      <PageHero
        imageUrl={pageBanner?.imageUrl}
        ratio={pageBanner?.ratio}
        bannerCta={pageBanner?.ctaHref ? { label: pageBanner.ctaLabel, href: pageBanner.ctaHref } : undefined}
        title="الأسئلة الشائعة"
        subtitle="كل ما تحتاج معرفته عن الطلب والتوصيل والعناية بالورد."
        eyebrow="مركز المساعدة"
        icon="Headset"
        compact
      />

      <TrustStrip />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <FaqAccordion items={FAQS} />
      </section>

      <CtaBand
        eyebrow="لم تجد إجابتك؟"
        title="اسألنا مباشرة"
        desc="فريقنا يرد على واتساب خلال دقائق في أوقات العمل."
        primaryLabel="تواصل معنا"
        primaryHref="/contact"
      />
    </div>
  );
}
