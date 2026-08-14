# إنشاء متجر جديد من Core
### دليل تنفيذي — من صفر إلى منشور

**الوقت المتوقع:** ٤٥–٩٠ دقيقة (بلا إدخال المنتجات)

اتبع الخطوات بالترتيب. لا تتخطَّ خطوة — كل واحدة تعتمد على سابقتها.

---

# ☑ الخطوة ١ — نسخ النواة

```bash
cp -r store-core my-new-store
cd my-new-store
rm -rf node_modules .next .git
npm install
```

**تحقّق:** `npm run dev` يفتح على `localhost:3000` (بقاعدة SQLite محلية تلقائيًا).

---

# ☑ الخطوة ٢ — مشروع Supabase

**٢.١** `supabase.com/dashboard` ← **New project**

| الخانة | القيمة |
|---|---|
| Name | اسم المتجر |
| Database Password | ولّد كلمة قوية — **بحروف وأرقام و`_` و`-` فقط** |
| Region | الأقرب لجمهورك |

> تجنّب `@` `#` `/` `:` في كلمة المرور — تكسر رابط الاتصال.

**٢.٢** انتظر اكتمال التهيئة (~دقيقتان)

**٢.٣** `SQL Editor` ← **New query** ← الصق `database/schema.sql` كاملًا ← **Run**

**٢.٤** (اختياري) الصق `database/seed.sql` — ١٢ منتجًا تجريبيًا لترى المتجر يعمل فورًا

**تحقّق:**
```sql
SELECT c.relname, c.relrowsecurity AS rls, c.relforcerowsecurity AS force
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' AND c.relkind='r';
```
**المتوقع:** ٧ جداول · `rls = true` للجميع · `force = false` للجميع

---

# ☑ الخطوة ٣ — رابط الاتصال

`Supabase ← Connect ← Connection string ← **Transaction pooler**`

```
postgresql://postgres.REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

استبدل `[YOUR-PASSWORD]` بكلمتك. **احتفظ به** — تحتاجه في الخطوة ٧.

> **المنفذ `6543` لا `5432`** — بيئة Vercel تفتح اتصالات قصيرة كثيرة.

---

# ☑ الخطوة ٤ — هوية المتجر

`config/store.config.js`

```js
export const STORE = {
  name: "الاسم الكامل للمتجر",
  shortName: "الاسم المختصر",
  tagline: "الوصف تحت الاسم",
  description: "وصف السيو — بين 120 و155 حرفًا",
  keywords: ["كلمة", "كلمة أخرى"],

  whatsapp: "9665XXXXXXXX",        // دولي بلا + وبلا مسافات
  phone: "+966 5X XXX XXXX",
  email: "",
  address: "المدينة، المملكة العربية السعودية",
  workingHours: "السبت – الخميس، 9 ص – 9 م",
  mapQuery: "24.7136, 46.6753",    // إحداثيات — الأدق

  currency: "SAR",
  freeShippingThreshold: 500,       // 0 = لا يوجد حد
  defaultShippingCost: 25,

  googleProductCategory: "",        // من taxonomy.google.com

  ticker: [
    "شحن مجاني للطلبات فوق 500 ريال",
    "ضمان معتمد على جميع المنتجات",
  ],
};
```

## الوحدات

```js
export const MODULES = {
  offers: true,
  maintenance: false,   // فعّلها للأجهزة والسيارات والتكييف
  about: true,
  faq: true,
  contact: true,
  legal: true,
  installments: true,   // تابي/تمارا — السوق السعودي
};
```

---

# ☑ الخطوة ٥ — الثيم

`config/theme.config.js`

```js
export const ACTIVE_THEME = "aqua";
```

| الثيم | يناسب |
|---|---|
| `aqua` | الأجهزة · الإلكترونيات · الطبي |
| `luxe` | العطور · المجوهرات · الأزياء الراقية |
| `warm` | العبايات · الأثاث · اليدويات |
| `fresh` | الأغذية · المنتجات الطبيعية |
| `steel` | قطع الغيار · الأدوات · B2B |

**لثيم مخصص:** أضف مفتاحًا إلى `THEMES` بنفس بنية الألوان (١٨ مفتاحًا).

---

# ☑ الخطوة ٦ — المحتوى

`config/content.config.js`

| الثابت | ما يحتويه |
|---|---|
| `FEATURES` | ٤ مميزات أسفل الهيرو |
| `TRUST_ITEMS` | ٦ عناصر ثقة |
| `WHY_US` | قسم لماذا نحن |
| `HOME_FAQS` / `ALL_FAQS` | أسئلة الرئيسية / صفحة FAQ |
| `PRODUCT_FAQS` | أسئلة صفحة المنتج |
| `CTA` | نص الدعوة الافتراضي |
| `ABOUT` | محتوى «من نحن» |
| `TESTIMONIALS` | **اتركه فارغًا حتى تجمع آراء حقيقية** |
| `BADGE_PRESETS` | شارات المنتجات |
| `SERVICE_OPTIONS` | خيارات نموذج الفني |

> **قاعدة:** لا تكتب أرقامًا لا تستطيع إثباتها («+10000 عميل»، «تقييم 4.9»). نظام التجارة الإلكترونية السعودي يمنع الادعاءات غير الموثّقة.

---

# ☑ الخطوة ٧ — ترتيب الأقسام

`config/sections.config.js`

```js
export const HOME_SECTIONS = [
  { type: "hero",        enabled: true, props: { placement: "home" } },
  { type: "features",    enabled: true, props: {} },
  { type: "categories",  enabled: true, props: { title: "تصفّح أقسامنا", columns: 6 } },
  { type: "productGrid", enabled: true, props: { source: "bestSellers", title: "الأكثر مبيعًا", limit: 8 } },
  { type: "productGrid", enabled: true, props: { source: "offers", title: "العروض", limit: 4, background: "tint" } },
  { type: "whyUs",       enabled: true, props: {} },
  { type: "trust",       enabled: true, props: {} },
  { type: "faq",         enabled: true, props: { background: "alt" } },
  { type: "cta",         enabled: true, props: {} },
];
```

**غيّر الترتيب** بتحريك السطور · **أطفئ قسمًا** بـ `enabled: false` · **كرّر قسمًا** بإعدادات مختلفة.

الأقسام المتاحة: `hero` `features` `trust` `categories` `productGrid` `banner` `whyUs` `testimonials` `faq` `cta` `spacer`

---

# ☑ الخطوة ٨ — متغيّرات البيئة

`.env.local` للتطوير:

```bash
DATABASE_URL="postgresql://postgres.REF:PASS@aws-0-REGION.pooler.supabase.com:6543/postgres"
SESSION_SECRET="<ولّده بالأمر أدناه>"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="<كلمة قوية>"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

**توليد مفتاح الجلسة:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**تحقّق:**
```bash
npm run dev
```
- `/` يعرض المنتجات التجريبية
- `/admin/login` يقبل الدخول

> **لا ترفع `.env.local` إلى GitHub أبدًا.**

---

# ☑ الخطوة ٩ — تخزين الصور

`Vercel ← Storage ← Create ← Blob`

| الخانة | القيمة |
|---|---|
| Name | اسم المتجر |
| Access | **Public** ⚠️ |

انسخ `BLOB_READ_WRITE_TOKEN` و`PUBLIC_BLOB_STORE_ID` إلى `.env.local`.

> **الوصول العام إلزامي** — متجر خاص يفشل برسالة «Cannot use public access on a private store».

---

# ☑ الخطوة ١٠ — البيانات

## من لوحة التحكم

**١.** `/admin/categories` ← أنشئ التصنيفات (سلَغ لاتيني · أيقونة · لون)

**٢.** `/admin/products` ← أضف المنتجات

| الحقل | ملاحظة |
|---|---|
| السعر | `0` = «السعر حسب المواصفات» |
| السعر السابق | يجب أن يكون **أعلى** من الحالي |
| الشارة | المجموعة الترويجية تُدرج المنتج في صفحة العروض |
| التقييم | **اتركه فارغًا** ما لم تكن لديك تقييمات حقيقية |
| الصورة | تُضغط وتُحوَّل WebP تلقائيًا |

**٣.** `/admin/banners` ← البنرات

**٤.** `/admin/legal` ← **الصفحات القانونية** ⚠️

> Google Ads و Meta **يرفضان** حسابات المتاجر بلا: الشروط · الاسترجاع · الشحن والدفع. لكل صفحة قالب بدء جاهز.

## حذف البيانات التجريبية

```sql
-- database/reset.sql
DELETE FROM products   WHERE id LIKE 'seedp%';
DELETE FROM banners    WHERE id LIKE 'seedb%';
DELETE FROM categories WHERE id LIKE 'seedcat%';
```

---

# ☑ الخطوة ١١ — النشر

**١١.١** ارفع على GitHub (بلا `.env.local` و`node_modules`)

**١١.٢** `vercel.com` ← **Add New Project** ← اختر المستودع

**١١.٣** أضف **كل** متغيّرات البيئة — علّم Production و Preview و Development

**١١.٤** **Deploy**

**١١.٥** بعد النشر: اضبط `NEXT_PUBLIC_SITE_URL` على الدومين الحقيقي ← **Redeploy**

> المتغيّرات **لا تُطبَّق على نشر قائم**.

**١١.٦** `Settings ← Deployment Protection` ← Vercel Authentication:
```
all_except_custom_domains
```
يحجب روابط `vercel.app` عن الزحف ويُبقي دومينك مفتوحًا.

---

# ☑ الخطوة ١٢ — التتبّع

`/admin/settings ← التتبّع`

| الحقل | ملاحظة |
|---|---|
| **GTM** | الأهم — ثبّت منه كل البكسلات |
| GA4 | **اتركه فارغًا** — اربطه من داخل GTM |
| Search Console | قيمة `content` فقط |

> **تثبيت GA4 من الكود ومن GTM معًا يضاعف كل أرقامك.**

ثم: Search Console ← أرسل `sitemap.xml`

---

# ☑ الخطوة ١٣ — الاختبار النهائي

## الأساسيات
- [ ] الرئيسية · المتجر · التصنيف · المنتج
- [ ] البحث والفلاتر

## الطلب
- [ ] إضافة للسلة → إتمام → شاشة تأكيد برقم طلب
- [ ] الطلب يظهر في `/admin/orders`
- [ ] «اشترِ الآن» يسجّل طلبًا بشارة صفراء

## الأمان
- [ ] `/api/products` في تبويب خفي ← `غير مصرّح`
- [ ] `/admin` بلا تسجيل ← إعادة توجيه

## السيو
- [ ] `/sitemap.xml` بدومينك
- [ ] `/robots.txt` يمنع `/admin`
- [ ] `/feed.xml` يعرض المنتجات

## الجوال
- [ ] لا تمرير أفقي
- [ ] الهيدر ثابت
- [ ] قائمة لوحة التحكم تعمل

---

# 🚨 أخطاء شائعة

| الخطأ | العَرَض | الحل |
|---|---|---|
| `DATABASE_URL` = كلمة المرور فقط | المتجر فارغ | الرابط الكامل |
| المنفذ `5432` | انقطاع متكرر | استخدم `6543` |
| Blob خاص | فشل رفع الصور | Public |
| نسيان Redeploy | التغيير لا يظهر | أعد النشر |
| GA4 من موضعين | أرقام مضاعفة | GTM فقط |
| الصفحات القانونية فارغة | رفض الحساب الإعلاني | املأها |
| نشر بيانات البذر | منتجات وهمية للعملاء | `reset.sql` |

---

# ملخّص الوقت

| الخطوة | الوقت |
|---|---|
| ١–٣ النسخ وSupabase | ١٥ د |
| ٤–٧ التهيئة | ٢٠ د |
| ٨–٩ البيئة والتخزين | ١٠ د |
| ١٠ البيانات | حسب العدد |
| ١١–١٣ النشر والاختبار | ٢٠ د |

**الإجمالي بلا المنتجات: ٦٥ دقيقة**
