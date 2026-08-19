import { STORE } from "../config/store.config.js";
/**
 * توليد بيانات SEO تلقائيًا لكل منتج وتصنيف.
 *
 * المبدأ: لا يُطلب من المسؤول كتابة عنوان ووصف وبيانات منظّمة لكل منتج.
 * النظام يشتقّها من البيانات الموجودة أصلًا، ويحترم أي قيمة كتبها يدويًا.
 */

export const SITE = {
  // ⚠️ إصلاح خلل نواة: كانت مكتوبة "${STORE.name}" بين علامتَي اقتباس عاديتين،
  // فتُطبع حرفيًا في <title> وفي og:title لكل صفحة منتج وتصنيف.
  name: STORE.name,
  shortName: STORE.shortName,
  locale: "ar_SA",
  country: "SA",
  currency: "SAR",
};

/** الرابط الأساسي — يُقرأ من متغيّر البيئة ليعمل على الدومين الحقيقي بعد ربطه. */
export function siteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

const clean = (t = "") => String(t).replace(/\s+/g, " ").trim();

/** يقصّ عند حدود الكلمات لا في منتصفها. */
function truncate(text, max) {
  const t = clean(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/* ============ المنتج ============ */

export function productTitle(p) {
  if (p.metaTitle) return clean(p.metaTitle);
  const brand = p.brand ? ` ${p.brand}` : "";
  return truncate(`${clean(p.name)}${brand}`, 60);
}

export function productDescription(p) {
  if (p.metaDescription) return clean(p.metaDescription);

  // نبني وصفًا من البيانات الفعلية: النوع والسعر والمزايا الحقيقية
  const parts = [clean(p.description) || clean(p.name)];
  if (p.price) parts.push(`السعر ${Number(p.price).toLocaleString("ar-SA")} ريال`);

  const perks = [];
  if (p.freeShipping) perks.push("شحن مجاني");
  if (p.freeInstall) perks.push("تركيب مجاني");
  if (perks.length) parts.push(perks.join(" و"));
  parts.push("توصيل لجميع مناطق المملكة");

  return truncate(parts.join(". "), 155);
}

/** نص بديل للصورة — مهم للوصولية ولأرشفة الصور في جوجل. */
export function productImageAlt(p) {
  if (p.imageAlt) return clean(p.imageAlt);
  const cat = p.category?.name ? ` — ${p.category.name}` : "";
  return truncate(`${clean(p.name)}${cat}`, 110);
}

export const productUrl = (p) => `${siteUrl()}/product/${p.id}`;
export const categoryUrl = (c) => `${siteUrl()}/category/${c.slug}`;

/* ============ البيانات المنظّمة (JSON-LD) ============ */

const AVAILABILITY = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/LimitedAvailability",
  out_of_stock: "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
};

export function productSchema(p) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: clean(p.name),
    description: productDescription(p),
    url: productUrl(p),
    sku: p.id,
    offers: {
      "@type": "Offer",
      url: productUrl(p),
      price: Number(p.price),
      priceCurrency: SITE.currency,
      availability: AVAILABILITY[p.stock] || AVAILABILITY.in_stock,
      seller: { "@type": "Organization", name: SITE.name },
    },
  };

  if (p.imageUrl) schema.image = [p.imageUrl];
  if (p.brand) schema.brand = { "@type": "Brand", name: clean(p.brand) };
  if (p.category?.name) schema.category = clean(p.category.name);

  // التقييم يُدرج فقط إن كان حقيقيًا — بيانات تقييم مفبركة تُعرّض
  // الموقع لعقوبة يدوية من جوجل وتُخالف إرشادات المراجعات
  if (p.rating > 0 && p.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(p.rating),
      reviewCount: Number(p.reviewCount),
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

/**
 * مسار التنقّل (BreadcrumbList).
 *
 * قاعدتان يفرضهما جوجل وكان الكود يخالفهما:
 *
 * ١) `item` يجب أن يكون رابطًا **مطلقًا**. تمرير مسار نسبي مثل "/shop"
 *    يُنتج تحذير «عنوان URL غير صالح في الحقل id».
 *
 * ٢) `name` إلزامي لكل عنصر. حين يكون التصنيف غير موجود يصير
 *    `product.category?.name` قيمة undefined فيسقط الحقل، وينتج خطأ
 *    «يجب تحديد name» الذي يُبطل الشيما كاملة.
 *
 * لذلك: نحوّل كل رابط إلى مطلق، ونستبعد أي عنصر بلا اسم صالح.
 */
export function breadcrumbSchema(trail) {
  const base = siteUrl();

  const toAbsolute = (u) => {
    if (!u) return null;
    const raw = String(u).trim();
    if (/^https?:\/\//i.test(raw)) return raw;
    // ترميز الأجزاء العربية — جوجل يرفض المحارف غير المُرمّزة في الروابط
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    const encoded = path
      .split("/")
      .map((seg) => (seg ? encodeURIComponent(decodeURIComponent(seg)) : seg))
      .join("/");
    return `${base}${encoded}`;
  };

  const items = trail
    .filter((item) => item && typeof item.name === "string" && item.name.trim())
    .map((item) => ({ name: clean(item.name), url: toAbsolute(item.url) }))
    .filter((item) => item.url);

  // مسار بعنصر واحد لا قيمة له — جوجل يتجاهله على أي حال
  if (items.length < 2) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function organizationSchema(settings = {}) {
  const url = siteUrl();
  const socials = Object.entries(settings)
    .filter(([k, v]) => k.startsWith("social_") && v)
    .map(([, v]) => v);

  /**
   * ⚠️ ترقية من `Store` العام إلى نوع محدّد.
   *
   * `Florist` نوع فرعي من `LocalBusiness` تعرفه Google، وهو ما
   * يؤهّل المتجر لبطاقة النشاط المحلي وخريطة النتائج — بينما
   * `Store` العام لا يفعل. يُضبط من /admin/seo لأن النواة تخدم
   * مجالات مختلفة.
   */
  const org = {
    "@context": "https://schema.org",
    "@type": settings.seo_business_type || "Store",
    name: settings.store_name || SITE.name,
    url,
    image: settings.store_logo || `${url}/icon.png`,
    description: settings.store_description ||
      STORE.description,
    areaServed: { "@type": "Country", name: "المملكة العربية السعودية" },
    currenciesAccepted: SITE.currency,
  };

  if (settings.store_logo) org.logo = settings.store_logo;
  if (socials.length) org.sameAs = socials;
  if (settings.contact_phone) org.telephone = settings.contact_phone;
  if (settings.contact_email) org.email = settings.contact_email;
  if (settings.contact_address) {
    org.address = { "@type": "PostalAddress", addressCountry: "SA", streetAddress: settings.contact_address };
  }
  if (settings.contact_hours) org.openingHours = settings.contact_hours;
  if (settings.seo_opening_hours) org.openingHours = settings.seo_opening_hours;
  if (settings.seo_price_range) org.priceRange = settings.seo_price_range;

  /**
   * الإحداثيات: بطاقة النشاط المحلي تحتاجها لتربط المتجر بموقع
   * على الخريطة. بدونها يبقى المخطّط صحيحًا لكنه لا يؤهّل للظهور
   * المحلي.
   */
  const lat = Number(settings.seo_geo_lat);
  const lng = Number(settings.seo_geo_lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng)) {
    org.geo = { "@type": "GeoCoordinates", latitude: lat, longitude: lng };
  }

  return org;
}

export function websiteSchema() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url,
    inLanguage: "ar",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${url}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: clean(f.q),
      acceptedAnswer: { "@type": "Answer", text: clean(f.a) },
    })),
  };
}

export function itemListSchema(products, name) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 30).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: productUrl(p),
      name: clean(p.name),
    })),
  };
}

/** يبني وسوم Metadata كاملة لصفحة منتج. */
export function productMetadata(p) {
  const title = productTitle(p);
  const description = productDescription(p);
  const url = productUrl(p);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url,
      type: "website",
      locale: SITE.locale,
      siteName: SITE.name,
      images: p.imageUrl ? [{ url: p.imageUrl, alt: productImageAlt(p) }] : undefined,
    },
    twitter: {
      card: p.imageUrl ? "summary_large_image" : "summary",
      title, description,
      images: p.imageUrl ? [p.imageUrl] : undefined,
    },
  };
}

export function categoryMetadata(c, count = 0) {
  const title = c.metaTitle || `${clean(c.name)} — ${SITE.shortName}`;
  const description = c.metaDescription ||
    truncate(`${clean(c.tagline || c.name)}. ${count} منتج متوفر بأسعار تنافسية مع ضمان وتوصيل لجميع مناطق المملكة.`, 155);
  const url = categoryUrl(c);

  return {
    title, description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: "website",
      locale: SITE.locale, siteName: SITE.name,
      images: c.bannerUrl ? [{ url: c.bannerUrl, alt: clean(c.name) }] : undefined,
    },
  };
}

/** مكوّن حقن JSON-LD. */
/**
 * حقن بيانات منظّمة.
 * لا نطبع شيئًا إن كانت البيانات فارغة — وسم يحوي "null" شيما معطوبة
 * تُبلغ عنها Search Console كخطأ.
 */
export function JsonLd({ data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
