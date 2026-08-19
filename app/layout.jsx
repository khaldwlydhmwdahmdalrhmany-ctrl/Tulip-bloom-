import "./globals.css";
import { getSettings } from "../lib/queries.js";
import AnalyticsScripts, { GtmNoScript } from "../components/site/AnalyticsScripts.jsx";
import { organizationSchema, websiteSchema, JsonLd, siteUrl } from "../lib/seo.jsx";
import { STORE } from "../config/store.config.js";
import { themeColors, themeCssVars, TYPOGRAPHY } from "../config/theme.config.js";

/** العنوان والوصف والأيقونة — كلها من لوحة التحكم مع قيم افتراضية. */
export async function generateMetadata() {
  const s = await getSettings().catch(() => ({}));
  // ⚠️ إصلاح خلل نواة: كان النص الافتراضي "{STORE.name}" حرفيًا لا مرجعًا
  const name = (s.store_name || STORE.name).trim();
  const short = (s.store_short_name || STORE.shortName).trim();
  const desc = (s.store_description ||
    STORE.description).trim();
  const ogImage = (s.store_og_image || "").trim();
  const favicon = (s.store_favicon || "").trim();

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: name, template: `%s | ${short}` },
    description: desc,
    keywords: STORE.keywords || [],
    ...(favicon ? { icons: { icon: favicon, apple: favicon } } : {}),
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "ar_SA",
      siteName: name,
      title: name,
      description: desc,
      url: siteUrl(),
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: name }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: name,
      description: desc,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

export const viewport = {
  // ⚠️ إصلاح خلل نواة: كان اللون مثبّتًا على أزرق ثيم aqua بغض النظر عن الثيم النشط
  themeColor: themeColors().primary,
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  const settings = await getSettings().catch(() => ({}));

  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* preconnect يوفّر جولة ذهاب وإياب كاملة قبل طلب ملف الخط */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* ⚠️ إصلاح خلل نواة: الرابط كان مثبّتًا على خط واحد ويتجاهل التهيئة */}
        <link href={TYPOGRAPHY.googleFontUrl} rel="stylesheet" />
        {/*
          ⚠️ إصلاح خلل نواة: `themeCssVars()` كانت معرّفة في theme.config.js
          ولا تُستدعى في أي مكان، فبقيت متغيّرات globals.css مثبّتة على
          ألوان ثيم aqua — شريط التمرير وحلقة التركيز وظلّ البطاقات
          وتظليل النص. حقنها هنا يربط الورقة كلها بالثيم النشط.
        */}
        <style dangerouslySetInnerHTML={{ __html: themeCssVars() }} />

        {settings.gsc_verification && (
          <meta name="google-site-verification" content={settings.gsc_verification} />
        )}
        {settings.bing_verification && (
          <meta name="msvalidate.01" content={settings.bing_verification} />
        )}
      </head>
      <body>
        <GtmNoScript settings={settings} />
        <AnalyticsScripts settings={settings} />
        <JsonLd data={organizationSchema(settings)} />
        <JsonLd data={websiteSchema()} />
        {children}
      </body>
    </html>
  );
}
