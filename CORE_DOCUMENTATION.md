# STORE CORE — التوثيق الكامل
### نواة متجر إلكتروني عربي قابلة لإعادة الاستخدام

---

# ١. بنية المشروع

```
store-core/
├── config/                    ⭐ ابدأ من هنا لأي متجر جديد
│   ├── store.config.js        الهوية · التواصل · الوحدات · الحدود
│   ├── theme.config.js        ٥ ثيمات · الخطوط · الأشكال · الحركة
│   ├── content.config.js      المميزات · الثقة · FAQ · CTA · من نحن
│   └── sections.config.js     ترتيب أقسام الصفحات
│
├── database/
│   ├── schema.sql             ⭐ المخطط الكامل + RLS + الفهارس
│   ├── seed.sql               بيانات تجريبية محايدة (اختياري)
│   └── reset.sql              حذف البيانات التجريبية
│
├── app/
│   ├── layout.jsx             الجذر: بيانات وصفية · تتبّع · شيما
│   ├── globals.css            نظام التصميم والحركات
│   ├── sitemap.js             خريطة الموقع — تتولّد من القاعدة
│   ├── robots.js              robots.txt
│   ├── feed.xml/ feed.csv/    كتالوج المنتجات للمنصات الإعلانية
│   ├── (site)/                واجهة المتجر
│   ├── admin/                 لوحة التحكم
│   └── api/                   ٢٤ مسارًا
│
├── components/
│   ├── sections/              ⭐ محرّك الأقسام
│   │   ├── registry.jsx       سجل الأقسام (١١ نوعًا)
│   │   └── SectionRenderer.jsx محرّك العرض
│   ├── site/                  مكوّنات الواجهة
│   ├── analytics/             بطاقات ورسوم لوحة التحليلات
│   └── *.jsx                  نماذج لوحة التحكم
│
├── context/CartContext.jsx    حالة السلة والطلب والإسناد
└── lib/                       ١٨ ملفًا — منطق النواة
```

---

# ٢. معمارية النواة

## طبقات المشروع

```
التهيئة (config/)         ← ما تعدّله لكل عميل
      ↓
منطق النواة (lib/)        ← لا يُلمس
      ↓
المكوّنات (components/)    ← تُستهلك عبر السجل
      ↓
الصفحات (app/)            ← تجلب البيانات وتسلّمها للمحرّك
```

## مسؤولية ملفات `lib/`

| الملف | المسؤولية |
|---|---|
| `db.js` | يوجّه إلى Postgres أو SQLite حسب `DATABASE_URL` |
| `db.pg.js` | **قلب المشروع** — كل استعلامات Postgres والترحيلات |
| `db.sqlite.js` | نسخة مطابقة للتطوير المحلي بلا خادم |
| `queries.js` | قراءات الواجهة مغلّفة بتخزين مؤقت موسوم |
| `cache.js` | أوسمة الكاش ودوال الإبطال |
| `auth.js` | جلسات موقّعة HMAC |
| `rateLimit.js` | تحديد معدّل الطلبات |
| `seo.jsx` | بيانات وصفية + ١٧ نوع شيما + نصوص بديلة |
| `analytics.js` | ١٦ حدث تتبّع + قيم التحويلات |
| `attribution.js` | تحديد مصدر الزيارة وحفظه ٣٠ يومًا |
| `settings.js` | مفاتيح الإعدادات القابلة للتحرير |
| `colors.js` | نظام الألوان (مشتق من الثيم) + دوال التسعير |
| `badges.js` | الشارات ومنطق صفحة العروض |
| `banners.js` | مواضع البنرات ونسبها |
| `brandIcons.js` | ١٤ أيقونة منصة رسمية + كشف تلقائي |
| `imageProcessing.js` | ضغط وتحويل WebP في المتصفح |
| `iconMap.js` | خريطة أيقونات lucide |
| `seedData.js` | بيانات بذر محايدة |

## مبدأ الكاش الموسوم

القراءات مغلّفة بأوسمة، والكاش **يُبطَل عند التعديل فقط** لا بعد مدة عشوائية:

| الوسم | يُبطَل عند |
|---|---|
| `products` | إضافة/تعديل/حذف منتج |
| `categories` | تعديل تصنيف |
| `banners` | تعديل بنر |
| `settings` | حفظ الإعدادات |

## نسخة المخطط

`lib/db.pg.js` يحوي `SCHEMA_VERSION`. عند البدء يُقرأ رقم النسخة من `settings` باستعلام واحد (0.087 مللي ثانية):

- **مطابق** → تُتخطّى الترحيلات كلها
- **مختلف** → تُنفَّذ ٣٢ عبارة `IF NOT EXISTS` ثم يُسجَّل الرقم

**لإضافة عمود:** أضف `ADD COLUMN IF NOT EXISTS` في `runMigrations` ← **ارفع `SCHEMA_VERSION`** ← حدّث `createProduct`/`updateProduct`/`LIST_COLS` ← طبّق نفسه في `db.sqlite.js`.

> نسيان رفع الرقم = الترحيلة لن تُنفَّذ أبدًا.

---

# ٣. مخطط قاعدة البيانات

سبعة جداول:

| الجدول | الغرض |
|---|---|
| `categories` | التصنيفات |
| `products` | المنتجات — ٢٠ عمودًا |
| `banners` | البنرات بمواضعها ونسبها |
| `orders` | الطلبات + الإسناد التسويقي |
| `visits` | زيارات مجهّلة الهوية |
| `settings` | مفتاح/قيمة — الهوية والتتبّع |
| `legal_pages` | الصفحات القانونية |

**١٣ فهرسًا** (أغلبها جزئي على `published`) · **٥ قيود** تمنع البيانات غير المنطقية.

## حقول تحتاج انتباهًا

| الحقل | ملاحظة |
|---|---|
| `products.published` | `false` = مخفي عن الزوار، ظاهر في اللوحة |
| `products.price = 0` | «السعر حسب المواصفات» — الزر يصير «اطلب عرض سعر» |
| `products.rating` | `NULL` = **لا تظهر نجوم**. لا تملأه بأرقام غير حقيقية |
| `products.stock` | `in_stock` · `low_stock` · `out_of_stock` · `preorder` |
| `banners.ratio` | `auto` = بلا قص · `wide` · `hero` · `banner` · `wide35` · `square` |
| `settings.schema_version` | **لا تعدّله يدويًا** |

## الأمان

- RLS مفعّل على الجداول السبعة، **بلا سياسات** (الغياب = منع كامل)
- `anon` و`authenticated` بلا أي صلاحية
- `ALTER DEFAULT PRIVILEGES` يقفل أي جدول جديد تلقائيًا
- **`FORCE ROW LEVEL SECURITY` معطّل عمدًا** — تفعيله يقطع اتصال التطبيق

> تنبيهات Supabase بمستوى `INFO` («RLS بلا سياسات») **صحيحة ومقصودة**. لا تُضف سياسات لتسكيتها.

---

# ٤. إنشاء مشروع Supabase جديد

**١.** `supabase.com/dashboard` ← **New project**

| الخانة | القيمة |
|---|---|
| Name | اسم المتجر |
| Database Password | ولّد كلمة قوية **واحفظها فورًا** |
| Region | الأقرب لجمهورك |

**٢.** انتظر اكتمال التهيئة (دقيقتان)

**٣.** `SQL Editor` ← **New query** ← الصق `database/schema.sql` كاملًا ← **Run**

**٤.** (اختياري) الصق `database/seed.sql` لبيانات تجريبية

**٥.** تحقق:
```sql
SELECT c.relname, c.relrowsecurity AS rls, c.relforcerowsecurity AS force
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r';
```
المتوقع: `rls = true` للجميع · `force = false` للجميع

---

# ٥. ربط المشروع بقاعدة جديدة

`Supabase ← Connect ← Connection string ← Transaction pooler`

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

**ثلاثة تحذيرات من تجربة فعلية:**

**١. الرابط الكامل لا كلمة المرور وحدها.** لو وُضعت الكلمة وحدها، ينزلق التطبيق إلى SQLite فارغة ويظهر المتجر خاليًا. (أُضيف تحذير في السجلات يكشف هذا.)

**٢. المنفذ `6543`** (Transaction pooler) لا `5432` — بيئة Vercel تفتح اتصالات قصيرة كثيرة.

**٣. تجنّب الرموز الخاصة** في كلمة المرور (`@` `#` `/` `:`) — تكسر الرابط.

---

# ٦. إنشاء متجر جديد — الخطوات

```
١. انسخ مجلد store-core باسم جديد
٢. أنشئ مشروع Supabase وطبّق schema.sql
٣. عدّل config/store.config.js
٤. اختر الثيم في config/theme.config.js
٥. عدّل config/content.config.js
٦. رتّب الأقسام في config/sections.config.js
٧. اضبط متغيّرات البيئة
٨. npm install && npm run dev
٩. أضف المنتجات من لوحة التحكم
١٠. اضبط التتبّع
١١. اختبر
١٢. انشر على Vercel
```

---

# ٧. تغيير الهوية

## من `config/store.config.js`

```js
export const STORE = {
  name: "اسم المتجر الكامل",
  shortName: "الاسم المختصر",
  tagline: "الوصف تحت الاسم",
  description: "وصف السيو — بين 120 و155 حرفًا",
  whatsapp: "9665XXXXXXXX",
  currency: "SAR",
  freeShippingThreshold: 500,
};
```

## الوحدات القابلة للإطفاء

```js
export const MODULES = {
  offers: true,
  maintenance: false,   // الصيانة وطلب الفني
  about: true,
  faq: true,
  legal: true,
  installments: true,   // شارة تابي/تمارا
};
```

إطفاء وحدة يخفي صفحاتها وروابطها من الهيدر والفوتر وخريطة الموقع.

## من لوحة التحكم (يفوز على التهيئة)

`الإعدادات ← هوية المتجر` — الشعار · الأيقونة · صورة المشاركة · الاسم · الوصف

---

# ٨. تغيير الثيم

## سطر واحد

```js
// config/theme.config.js
export const ACTIVE_THEME = "luxe";
```

| الثيم | يناسب |
|---|---|
| `aqua` | الأجهزة · المياه · الإلكترونيات · الطبي |
| `luxe` | العطور · المجوهرات · الأزياء الراقية |
| `warm` | العبايات · الأثاث · المنتجات اليدوية |
| `fresh` | الأغذية · المنتجات الطبيعية |
| `steel` | قطع الغيار · الأدوات · B2B |

## ثيم مخصص

أضف مفتاحًا جديدًا إلى `THEMES` بنفس بنية الألوان. المفاتيح المطلوبة:

```
primary · primaryDeep · accent · accentAlt · soft · softTint
surface · surfaceAlt · surfaceMuted
ink · muted · mutedLight
line · lineSoft
danger · success · warning · gold
```

## الأشكال والحركة

```js
export const SHAPES = {
  buttonRadius: "999px",   // 999px كبسولة · 0.75rem مستطيل ناعم
  cardRadius: "1rem",
};

export const MOTION = {
  enabled: true,
  liftOnHover: true,
};
```

---

# ٩. إضافة قسم جديد

## ثلاث خطوات

**١.** اكتب دالة القسم في `components/sections/registry.jsx`:

```jsx
export const SECTIONS = {
  // ... الأقسام الموجودة

  brands: (props, data) => {
    if (!props.logos?.length) return null;
    return (
      <Wrap background={props.background}>
        <SectionHead title={props.title} />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {props.logos.map((src, i) => (
            <img key={i} src={src} alt="" className="h-12 object-contain" loading="lazy" />
          ))}
        </div>
      </Wrap>
    );
  },
};
```

**٢.** استخدمه في `config/sections.config.js`:

```js
{ type: "brands", enabled: true, props: { title: "علاماتنا", logos: [...] } }
```

**٣.** انتهى — لا تعديل في أي ملف صفحة.

## الأقسام المتاحة (١١)

| النوع | الوصف |
|---|---|
| `hero` | بنر الصفحة الرئيسية |
| `features` | شريط المميزات |
| `trust` | شريط الثقة |
| `categories` | شبكة التصنيفات |
| `productGrid` | شبكة منتجات — `source`: `bestSellers` · `offers` · `newest` · `category:slug` |
| `banner` | بنر مستقل |
| `whyUs` | لماذا نحن |
| `testimonials` | آراء العملاء (يختفي إن كانت فارغة) |
| `faq` | الأسئلة الشائعة |
| `cta` | دعوة لاتخاذ إجراء |
| `spacer` | فاصل بصري |

## خصائص مشتركة

| الخاصية | القيم |
|---|---|
| `enabled` | `true` / `false` |
| `background` | `tint` (ملوّنة) · `alt` (رمادية) · افتراضي شفاف |

**يمكن تكرار القسم الواحد** بإعدادات مختلفة — مثل شبكتَي منتجات، واحدة للأكثر مبيعًا وأخرى للعروض.

---

# ١٠. إضافة صفحة جديدة

**١.** أنشئ `app/(site)/اسم-الصفحة/page.jsx`:

```jsx
import React from "react";
import { getBanners } from "../../../lib/queries.js";
import { pickBanner } from "../../../lib/banners.js";
import PageHero from "../../../components/site/PageHero.jsx";
import CtaBand from "../../../components/site/CtaBand.jsx";

export const revalidate = 300;

export const metadata = {
  title: "عنوان الصفحة",
  description: "وصف للسيو",
};

export default async function MyPage() {
  const banner = pickBanner(await getBanners({ placement: "my-page" }));
  return (
    <div>
      <PageHero title="العنوان" subtitle="الوصف" imageUrl={banner?.imageUrl} />
      {/* محتواك */}
      <CtaBand />
    </div>
  );
}
```

**٢.** أضف موضع البنر في `lib/banners.js` إن أردت بنرًا مخصصًا

**٣.** أضف الرابط في `components/site/Header.jsx` و`Footer.jsx`

**٤.** أضفها إلى `app/sitemap.js`

---

# ١١. إعداد التتبّع

## من لوحة التحكم

`الإعدادات ← التتبّع والتحليلات`

| الحقل | ملاحظة |
|---|---|
| **Google Tag Manager** | **الأهم** — ثبّت منه كل البكسلات لاحقًا |
| Google Analytics 4 | **اتركه فارغًا** — اربط GA4 من داخل GTM |
| Google Ads | لتتبّع التحويلات |
| Microsoft Clarity | خرائط حرارية مجانية |
| Microsoft UET | بكسل بينغ |
| توثيق Search Console / Bing | قيمة `content` فقط |

> **تثبيت GA4 من الكود ومن GTM معًا يضاعف كل أرقامك.** اختر مسارًا واحدًا.

## الأحداث المرسلة (١٦)

| الحدث | متى |
|---|---|
| `page_view` | كل انتقال |
| `view_item` / `view_item_list` | فتح منتج / تصنيف |
| `add_to_cart` / `view_cart` / `remove_from_cart` | السلة |
| `begin_checkout` / `purchase` ⭐ | الطلب |
| `generate_lead` + `lead_*` ⭐ | النماذج |
| `search` / `search_no_results` | البحث |
| `filter_products` | الفلاتر |
| `whatsapp_click` / `contact_click` | التواصل |

⭐ = يُستورد كتحويل في Google Ads

## قيم التحويلات

في `lib/analytics.js` ← `LEAD_VALUES`. **عايرها حسب مجال المتجر:**

```
القيمة = متوسط الإيراد من هذا النوع × نسبة تحوّله إلى بيع فعلي
```

---

# ١٢. إعداد واتساب

## الرقم

```js
// config/store.config.js
whatsapp: "9665XXXXXXXX",   // دولي بلا + وبلا مسافات
```

أو من `الإعدادات ← إعدادات المتجر ← رقم واتساب` (يفوز على التهيئة).

## المسارات الثلاثة

| المسار | ما يحدث |
|---|---|
| **السلة** | تُسجَّل الطلبات → رقم طلب → واتساب برسالة كاملة |
| **اشترِ الآن** | طلب سريع يُسجَّل ثم واتساب |
| **استفسار** | واتساب مباشر بلا تسجيل |

## تخصيص الرسائل

`lib/colors.js` ← `buildWhatsAppLink` و`buyNowLink`

---

# ١٣. النشر على Vercel

## عبر GitHub (موصى به)

**١.** ارفع المشروع على مستودع (بلا `.env` و`node_modules`)

**٢.** `vercel.com` ← **Add New Project** ← اختر المستودع

**٣.** الإطار يُكتشف تلقائيًا (Next.js)

**٤.** أضف متغيّرات البيئة (القسم ١٤)

**٥.** **Deploy**

## عبر CLI

```bash
npm i -g vercel
vercel --prod
```

## Vercel Blob لتخزين الصور

`Storage ← Create ← Blob` ← **Public**

انسخ `BLOB_READ_WRITE_TOKEN` و`PUBLIC_BLOB_STORE_ID`.

> **الوصول العام إلزامي** — متجر خاص يفشل برسالة «Cannot use public access on a private store».

## حماية النشر

`Settings ← Deployment Protection` ← Vercel Authentication:
```
all_except_custom_domains
```
يحجب روابط `vercel.app` عن الزحف ويُبقي دومينك مفتوحًا — يمنع المحتوى المكرر.

---

# ١٤. متغيّرات البيئة

| المتغيّر | إلزامي | الوصف |
|---|---|---|
| `DATABASE_URL` | ✅ | رابط Postgres **الكامل** — منفذ 6543 |
| `SESSION_SECRET` | ✅ | نص عشوائي طويل لتوقيع الجلسات |
| `ADMIN_USERNAME` | ✅ | اسم مستخدم اللوحة |
| `ADMIN_PASSWORD` | ✅ | كلمة مرور قوية |
| `BLOB_READ_WRITE_TOKEN` | ✅ | رفع الصور |
| `PUBLIC_BLOB_STORE_ID` | ✅ | تحديد متجر Blob العام |
| `NEXT_PUBLIC_SITE_URL` | مهم | الدومين — للسيو وخريطة الموقع |

## توليد مفتاح الجلسة

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> **الخادم يرفض العمل في الإنتاج بلا `SESSION_SECRET`** — حماية مقصودة ضد المفتاح الافتراضي.
> **تغيير أي متغيّر يتطلب Redeploy** — لا تُطبَّق على نشر قائم.

---

# ١٥. اختبار متجر جديد

## قائمة التحقق

### الأساسيات
- [ ] `/` يفتح ويعرض الأقسام
- [ ] `/shop` يعرض المنتجات
- [ ] `/category/{slug}` يعمل
- [ ] `/product/{id}` يعرض التفاصيل
- [ ] البحث يجد المنتجات
- [ ] الفلاتر تعمل (سعر · ماركة · توفّر)

### السلة والطلب
- [ ] إضافة منتج للسلة
- [ ] تعديل الكمية والحذف
- [ ] إتمام الطلب → شاشة تأكيد برقم طلب
- [ ] الطلب يظهر في `/admin/orders`
- [ ] «اشترِ الآن» يسجّل طلبًا بشارة صفراء

### لوحة التحكم
- [ ] `/admin/login` يقبل الدخول
- [ ] إضافة منتج بصورة (تُضغط وتُحوَّل WebP)
- [ ] تعديل منتج · إخفاؤه · حذفه
- [ ] التصنيفات والبنرات
- [ ] الإعدادات تُحفظ وتنعكس

### الأمان
- [ ] `/api/products` في تبويب خفي ← `غير مصرّح`
- [ ] `/admin` بلا تسجيل ← يعيد التوجيه
- [ ] RLS: `rls = true` و`force = false`

### السيو
- [ ] `/sitemap.xml` يعرض الروابط بدومينك
- [ ] `/robots.txt` يمنع `/admin` و`/api`
- [ ] `/feed.xml` يعرض المنتجات
- [ ] الشيما: `search.google.com/test/rich-results`

### التتبّع
- [ ] GTM Preview: كل حدث **مرة واحدة**
- [ ] DebugView يستقبل الأحداث
- [ ] `transaction_id` يحمل رقم الطلب

### التجاوب
- [ ] الجوال: لا تمرير أفقي
- [ ] الهيدر يبقى ثابتًا عند التمرير
- [ ] لوحة التحكم: القائمة المنزلقة تعمل

---

# ملحق: أخطاء وقعت فعلًا

| الخطأ | العَرَض | الدرس |
|---|---|---|
| `onMouseEnter` في مكوّن خادم | كل الصفحات تنهار | مكوّنات الخادم لا تستقبل معالجات أحداث — استخدم CSS |
| `overflow-x: hidden` على `html` | الهيدر يتوقف عن الثبات | يُنشئ حاوية تمرير تكسر `sticky` — استخدم `clip` |
| `DATABASE_URL` = كلمة المرور | المتجر فارغ | يجب الرابط الكامل |
| middleware يغطي `/admin` فقط | `/api` مفتوح للجميع | احمِ المسارات لا الصفحات |
| `undefined !== undefined` | تجاوز مصادقة كامل | تحقّق من وجود بيانات الاعتماد أولًا |
| `published` بلا تصفية | المخفي يظهر للزوار | الحقل بلا استعلام يصفّيه بلا فائدة |
| DDL في كل بداية باردة | بطء تدريجي | استخدم فحص نسخة |
| رابط صورة نسبي في الكتالوج | المنصات ترفض المنتج | حوّل لمطلق دائمًا |
