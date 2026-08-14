import React from "react";
import Link from "next/link";
import { Phone, Clock, MapPin, ShieldCheck, Wrench, MessageCircle, ArrowLeft } from "lucide-react";
import { getBanners } from "../../../../lib/queries.js";
import { pickBanner } from "../../../../lib/banners.js";
import { C, SH, WHATSAPP_NUMBER, buildWhatsAppLink } from "../../../../lib/colors.js";
import PageHero from "../../../../components/site/PageHero.jsx";
import UrgentForm from "../../../../components/site/UrgentForm.jsx";
import SectionHead from "../../../../components/site/SectionHead.jsx";

const PROMISES = [
  { icon: Clock, t: "رد خلال دقائق", d: "فريق الطوارئ يتابع واتساب طوال أوقات العمل." },
  { icon: Wrench, t: "فني معتمد لا وسيط", d: "من فريقنا مباشرة، يعرف أجهزتنا عن ظهر قلب." },
  { icon: ShieldCheck, t: "قطع أصلية في السيارة", d: "أغلب الأعطال تُحلّ في الزيارة الأولى." },
  { icon: MapPin, t: "تغطية المدن الرئيسية", d: "الرياض وجدة والدمام والمدن المجاورة." },
];

const TIMELINE = [
  { n: "١", t: "ترسل الطلب", d: "دقيقة واحدة عبر النموذج" },
  { n: "٢", t: "نتصل بك", d: "نشخّص العطل هاتفيًا ونحدد الحل" },
  { n: "٣", t: "نجدول الزيارة", d: "أقرب موعد متاح حسب حالتك" },
  { n: "٤", t: "نُصلح ونضمن", d: "إصلاح بقطع أصلية مع ضمان على العمل" },
];

export default async function UrgentMaintenancePage() {
  const pageBanner = pickBanner(await getBanners({ placement: "urgent" }));

  return (
    <div>
      <PageHero
        title="صيانة عاجلة"
        subtitle="تسريب، توقف مفاجئ، أو عطل لا يحتمل الانتظار؟ صف المشكلة في دقيقة واحدة ويتواصل معك فني خلال دقائق."
        imageUrl={pageBanner?.imageUrl}
        ratio={pageBanner?.ratio}
        bannerCta={pageBanner?.ctaHref ? { label: pageBanner.ctaLabel, href: pageBanner.ctaHref } : undefined}
        icon="AlertOctagon"
        color={C.danger}
        compact
      />

      {/* شريط الطوارئ — أوضح مسار للحالات الحرجة */}
      <section style={{ background: C.danger }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-bold flex items-center gap-2 text-center sm:text-right" style={{ color: "#fff" }}>
            <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: "#fff" }} />
            حالة حرجة ولا تحتمل النموذج؟ اتصل مباشرة
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <a href={`tel:+${WHATSAPP_NUMBER}`} className="btn flex-1 sm:flex-none px-5 py-2.5 text-sm"
               style={{ background: "#fff", color: C.danger }}>
              <Phone size={15} /> اتصال فوري
            </a>
            <a href={buildWhatsAppLink("🚨 عندي حالة صيانة عاجلة وأحتاج تواصل فوري.")}
               target="_blank" rel="noopener noreferrer"
               className="btn flex-1 sm:flex-none px-5 py-2.5 text-sm"
               style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}>
              <MessageCircle size={15} /> واتساب
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
          {/* النموذج */}
          <div className="lg:col-span-3 p-6 sm:p-8 rounded-3xl"
               style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: SH.md }}>
            <h2 className="h-card font-display mb-1" style={{ color: C.navy }}>صف لنا العطل</h2>
            <p className="text-sm mb-6" style={{ color: C.slate }}>
              ثلاث خطوات سريعة — كلما كانت التفاصيل أدق، وصل الفني ومعه القطعة الصحيحة.
            </p>
            <UrgentForm />
          </div>

          {/* الوعود */}
          <aside className="lg:col-span-2 flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="p-6 rounded-3xl flex flex-col gap-5" style={{ background: C.navyDeep }}>
              <h2 className="h-card font-display" style={{ color: "#fff" }}>ما الذي نضمنه لك</h2>
              <ul className="flex flex-col gap-4">
                {PROMISES.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "rgba(255,255,255,.1)" }}>
                      <p.icon size={16} color={C.mint} strokeWidth={1.9} />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-bold" style={{ color: "#fff" }}>{p.t}</span>
                      <span className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,.62)" }}>{p.d}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-3xl" style={{ background: C.mintTint, border: `1px solid ${C.teal}33` }}>
              <p className="text-xs leading-relaxed" style={{ color: C.navy }}>
                <strong>نصيحة توفّر عليك:</strong> أغلب حالات «لا يخرج ماء» سببها فلتر مسدود لا عطل حقيقي.
                اشترك في الصيانة الدورية وتجنّب أغلب هذه المواقف من الأساس.
              </p>
              <Link href="/maintenance" className="group inline-flex items-center gap-1.5 text-xs font-bold mt-3"
                    style={{ color: C.navy }}>
                باقات الصيانة الدورية <ArrowLeft size={13} className="arrow-slide" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* ماذا يحدث بعد الإرسال */}
      <section style={{ background: C.offWhite }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
          <SectionHead align="center" eyebrow="بعد الإرسال" title="ماذا يحدث بالضبط" />
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIMELINE.map((s) => (
              <li key={s.n} className="p-6 rounded-2xl flex flex-col gap-2"
                  style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                <span className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: C.danger, color: "#fff" }}>{s.n}</span>
                <h3 className="font-bold text-sm mt-1" style={{ color: C.navy }}>{s.t}</h3>
                <p className="text-xs leading-relaxed" style={{ color: C.slate }}>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
