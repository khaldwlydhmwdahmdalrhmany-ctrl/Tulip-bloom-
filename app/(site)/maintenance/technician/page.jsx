import React from "react";
import { Clock, ShieldCheck, Wrench, MapPin, Wallet } from "lucide-react";
import { getBanners } from "../../../../lib/queries.js";
import { pickBanner } from "../../../../lib/banners.js";
import { C, SH } from "../../../../lib/colors.js";
import PageHero from "../../../../components/site/PageHero.jsx";
import TrustStrip from "../../../../components/site/TrustStrip.jsx";
import TechnicianForm from "../../../../components/site/TechnicianForm.jsx";
import SectionHead from "../../../../components/site/SectionHead.jsx";
import FaqAccordion from "../../../../components/site/FaqAccordion.jsx";

export const metadata = {
  title: "طلب فني صيانة",
  description: "احجز زيارة فني معتمد للصيانة أو التركيب — في جميع مناطق المملكة.",
};

const PROMISES = [
  { icon: Clock, t: "تأكيد خلال دقائق", d: "نتصل بك لتحديد الموعد فور وصول الطلب." },
  { icon: Wrench, t: "فني من فريقنا", d: "موظف لدينا، لا مقاول من الباطن." },
  { icon: ShieldCheck, t: "ضمان على العمل", d: "إن تكرّر العطل نفسه، نعود بلا رسوم." },
  { icon: Wallet, t: "سعر معلوم مسبقًا", d: "نخبرك بالتكلفة قبل الزيارة، بلا مفاجآت." },
];

const TECH_FAQS = [
  { q: "كم تكلفة زيارة الفني؟", a: "تُحدَّد حسب نوع العطل والمدينة، ونخبرك بها هاتفيًا قبل تأكيد الموعد. لا نرسل فنيًا قبل موافقتك على التكلفة." },
  { q: "هل تخدمون خارج المدن الرئيسية؟", a: "نغطي الرياض وجدة والدمام والمدن المجاورة مباشرة، ونرتّب زيارات للمناطق الأخرى حسب الجدولة — راسلنا لنؤكد التغطية في مدينتك." },
  { q: "هل تصلحون أجهزة لم أشترها منكم؟", a: "نعم، نصون أغلب الموديلات الشائعة في السوق السعودي، بشرط توفر قطع الغيار المناسبة لها." },
  { q: "كم تستغرق الزيارة؟", a: "أغلب أعمال الصيانة الدورية تُنجز خلال 30 إلى 60 دقيقة." },
];

export default async function TechnicianPage() {
  const pageBanner = pickBanner(await getBanners({ placement: "technician" }));

  return (
    <div>
      <PageHero
        title="طلب فني صيانة"
        subtitle="احجز زيارة فني معتمد لصيانة جهازك أو تركيبه — ثلاث خطوات لا تتجاوز دقيقة."
        imageUrl={pageBanner?.imageUrl}
        ratio={pageBanner?.ratio}
        bannerCta={pageBanner?.ctaHref ? { label: pageBanner.ctaLabel, href: pageBanner.ctaHref } : undefined}
        icon="Wrench"
        color={C.teal}
        cta={{ label: "عطل عاجل؟", href: "/maintenance/urgent" }}
      />

      <TrustStrip />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-3">
            <TechnicianForm />
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="p-6 rounded-3xl flex flex-col gap-5" style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: SH.sm }}>
              <h2 className="h-card font-display" style={{ color: C.navy }}>ما الذي نضمنه لك</h2>
              <ul className="flex flex-col gap-4">
                {PROMISES.map((p, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.mintTint }}>
                      <p.icon size={18} color={C.teal} strokeWidth={1.9} />
                    </span>
                    <div>
                      <h3 className="font-bold text-[13px] mb-0.5" style={{ color: C.navy }}>{p.t}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: C.slate }}>{p.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-3xl flex items-start gap-3" style={{ background: C.mintTint }}>
              <MapPin size={19} color={C.navy} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed" style={{ color: C.navy }}>
                نخدم الرياض وجدة والدمام والمدن المجاورة مباشرة. لبقية المناطق نرتّب الزيارة حسب الجدولة —
                أرسل الطلب ونؤكد لك التغطية.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: C.offWhite }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
          <SectionHead align="center" eyebrow="أسئلة الصيانة" title="ما يسأله أغلب العملاء" />
          <FaqAccordion items={TECH_FAQS} />
        </div>
      </section>
    </div>
  );
}
