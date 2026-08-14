import React from "react";
import { Droplet, Target, Eye, HeartHandshake, ShieldCheck, Wrench, Recycle } from "lucide-react";
import { getBanners } from "../../../lib/queries.js";
import { pickBanner } from "../../../lib/banners.js";
import { C, G, SH } from "../../../lib/colors.js";
import PageHero from "../../../components/site/PageHero.jsx";
import TrustStrip from "../../../components/site/TrustStrip.jsx";
import SectionHead from "../../../components/site/SectionHead.jsx";
import CtaBand from "../../../components/site/CtaBand.jsx";
import { STORE } from "../../../config/store.config.js";
import { ABOUT, ABOUT_PAGE } from "../../../config/content.config.js";

const VALUES = ABOUT.values.map((v) => ({ icon: v.icon, t: v.t, d: v.d }));

export const metadata = {
  title: "نبذة عن الشركة",
  description: `${STORE.name} — من نحن، رسالتنا، وقيمنا في خدمة السوق السعودي.`,
};



export default async function AboutPage() {
  const pageBanner = pickBanner(await getBanners({ placement: "about" }));

  return (
    <div>
      <PageHero
        title={`نبذة عن ${STORE.shortName}`}
        subtitle={ABOUT.subtitle}
        imageUrl={pageBanner?.imageUrl}
        ratio={pageBanner?.ratio}
        bannerCta={pageBanner?.ctaHref ? { label: pageBanner.ctaLabel, href: pageBanner.ctaHref } : undefined}
        icon="Droplet"
        color={C.navy}
      />

      <TrustStrip />

      {/* من نحن */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-5">
            <span className="eyebrow">من نحن</span>
            <h2 className="h-section font-display" style={{ color: C.navy }}>
              {ABOUT_PAGE.headline}
            </h2>
            <div className="flex flex-col gap-4 text-sm sm:text-base leading-loose" style={{ color: C.slate }}>
              <p>{ABOUT.paragraphs[0]}</p>
              <p>{ABOUT.paragraphs[1]}</p>
              
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-10 flex flex-col gap-6" style={{ background: G.deep }}>
            <span className="absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: C.teal }} />
            <div className="relative flex flex-col gap-6">
              {[
                { icon: Target, t: "رسالتنا", d: ABOUT.mission },
                { icon: Eye, t: "رؤيتنا", d: ABOUT.vision },
                { icon: Droplet, t: ABOUT_PAGE.specialtyLabel, d: STORE.tagline },
              ].map((b, i) => (
                <div key={i} className="flex gap-4">
                  <span className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,.1)" }}>
                    <b.icon size={20} color={C.mint} strokeWidth={1.9} />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm mb-1" style={{ color: "#fff" }}>{b.t}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,.72)" }}>{b.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* قيمنا */}
      <section style={{ background: C.offWhite }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
          <SectionHead
            align="center"
            eyebrow="ما نلتزم به"
            title="أربع قواعد لا نتنازل عنها"
            desc="ليست شعارات تسويقية — هذه المعايير التي نُقيّم بها أنفسنا داخليًا."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALUES.map((v, i) => (
              <div key={i} className="lift group p-6 rounded-2xl flex flex-col gap-3" style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: SH.sm }}>
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: G.aqua }}>
                  <v.icon size={21} color="#fff" strokeWidth={1.9} />
                </span>
                <h3 className="font-bold text-[15px]" style={{ color: C.navy }}>{v.t}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.slate }}>{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="نبدأ من سؤال"
        title="نحن هنا للمساعدة"
        desc="لديك سؤال؟ راسلنا ونرد خلال دقائق."
        primaryLabel="تصفّح المنتجات"
        primaryHref="/shop"
        whatsappMessage="السلام عليكم، أرغب في الاستفسار."
      />
    </div>
  );
}
