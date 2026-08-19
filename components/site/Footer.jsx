import React from "react";
import Link from "next/link";
import { Phone, MapPin, MessageCircle, Mail, Clock } from "lucide-react";
import { C } from "../../lib/colors.js";
import StoreLogo from "./StoreLogo.jsx";
import SocialLinks from "./SocialLinks.jsx";
import { STORE, MODULES } from "../../config/store.config.js";
import { NAV_LINKS } from "../../config/content.config.js";

export default function Footer({ settings = {}, legalPages = [], customPages = [], navItems = [] }) {
  // نفس منطق الهيدر: قائمة اللوحة تفوز، والفراغ يعني الافتراضي
  const navLinks = navItems.length
    ? navItems.map((n) => ({ to: n.href, label: n.label }))
    : NAV_LINKS.filter((l) => !l.module || MODULES[l.module]);
  const phone = settings.contact_phone || "+966 53 254 0595";
  const address = settings.contact_address || "المملكة العربية السعودية";
  const email = settings.contact_email;
  const hours = settings.contact_hours;

  const dim = `${C.pearl}99`;

  return (
    <footer style={{ background: C.navyDeep, color: C.pearl }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="mb-3">
            <StoreLogo settings={settings} size={28} dark />
          </div>
          <p className="text-sm mb-5" style={{ color: dim }}>
            {STORE.description}
          </p>
          <SocialLinks settings={settings} variant="dark" />
        </div>

        <div>
          <h4 className="font-bold mb-3 text-sm">روابط سريعة</h4>
          <ul className="space-y-2 text-sm" style={{ color: dim }}>
            <li><Link href="/" className="hover:underline">الرئيسية</Link></li>
            <li><Link href="/shop" className="hover:underline">المنتجات</Link></li>
            <li><Link href="/occasions" className="hover:underline">تسوّق حسب المناسبة</Link></li>
            <li><Link href="/offers" className="hover:underline">العروض</Link></li>
            <li><Link href="/about" className="hover:underline">نبذة عنا</Link></li>
          </ul>
        </div>

        <div>
          {/*
            ⚠️ إصلاح خلل نواة: كان هذا العمود يسرد روابط الصيانة الثلاثة
            حرفيًا ويتجاهل MODULES — فتظهر في متجر لا علاقة له بالصيانة.
            الآن يقرأ من NAV_LINKS المفلترة بالوحدات.
          */}
          <h4 className="font-bold mb-3 text-sm">المساعدة</h4>
          <ul className="space-y-2 text-sm" style={{ color: dim }}>
            {navLinks.filter((l) => !["/", "/offers", "/about"].includes(l.to)).map((l) => (
              <li key={l.to}>
                <Link href={l.to} className="hover:underline">{l.label}</Link>
              </li>
            ))}
            <li><Link href="/faq" className="hover:underline">الأسئلة الشائعة</Link></li>
            {/* صفحات مخصّصة مُعلَّمة «إظهار في الفوتر» */}
            {customPages.filter((p) => p.inFooter).map((p) => (
              <li key={p.slug}>
                <Link href={`/p/${p.slug}`} className="hover:underline">{p.title}</Link>
              </li>
            ))}
            <li><Link href="/privacy" className="hover:underline">سياسة الخصوصية</Link></li>
            {legalPages.map((p) => (
              <li key={p.slug}>
                <Link href={`/legal/${p.slug}`} className="hover:underline">{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-3 text-sm">تواصل معنا</h4>
          <ul className="space-y-2 text-sm" style={{ color: dim }}>
            <li>
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:underline">
                <Phone size={14} className="shrink-0" /> <span dir="ltr">{phone}</span>
              </a>
            </li>
            {email && (
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-2 hover:underline">
                  <Mail size={14} className="shrink-0" /> <span dir="ltr">{email}</span>
                </a>
              </li>
            )}
            <li className="flex items-center gap-2"><MapPin size={14} className="shrink-0" /> {address}</li>
            {hours && <li className="flex items-center gap-2"><Clock size={14} className="shrink-0" /> {hours}</li>}
            <li className="flex items-center gap-2"><MessageCircle size={14} className="shrink-0" /> الرد عبر واتساب خلال دقائق</li>
          </ul>
        </div>
      </div>

      <div className="text-center text-xs py-4 border-t" style={{ borderColor: `${C.pearl}22`, color: `${C.pearl}66` }}>
        © {new Date().getFullYear()} {STORE.name}. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
