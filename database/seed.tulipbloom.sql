-- ═══════════════════════════════════════════════════════════
--  توليب بلوم — بيانات البذر (Postgres / Supabase)
--  وُلِّد من config/catalog.config.js عبر scripts/seed-tulip.mjs
--
--  الاستخدام: طبّق database/schema.sql أولًا، ثم هذا الملف.
--  للحذف:     database/reset.tulipbloom.sql
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ── التصنيفات ──
INSERT INTO categories (id, slug, name, tagline, color, icon, "sortOrder") VALUES ('tbcat_bouquets', 'bouquets', 'باقات الورد', 'باقات منسّقة يدويًا بثلاثة مقاسات — الاختيار الأسرع لأي مناسبة.', '#C4707F', 'Sparkles', 1);
INSERT INTO categories (id, slug, name, tagline, color, icon, "sortOrder") VALUES ('tbcat_flower-boxes', 'flower-boxes', 'صناديق ورد', 'ورد مرتّب داخل صندوق مخملي أو أكريليك — يبقى أطول ولا يحتاج فازة.', '#8E5572', 'Package', 2);
INSERT INTO categories (id, slug, name, tagline, color, icon, "sortOrder") VALUES ('tbcat_vase-arrangements', 'vase-arrangements', 'تنسيقات فازات', 'تنسيقات جاهزة مع الفازة — للمنزل والمكتب والاستقبال.', '#4F7A5A', 'Droplet', 3);
INSERT INTO categories (id, slug, name, tagline, color, icon, "sortOrder") VALUES ('tbcat_occasions', 'occasions', 'ورد المناسبات', 'تخرّج، خطوبة، افتتاح — تنسيقات مصمَّمة لمناسبة بعينها.', '#C2A15A', 'Award', 4);
INSERT INTO categories (id, slug, name, tagline, color, icon, "sortOrder") VALUES ('tbcat_gift-sets', 'gift-sets', 'هدايا وشوكولاتة', 'ورد مع شوكولاتة أو هدية — حين تريد أكثر من باقة.', '#B5674D', 'Coffee', 5);
INSERT INTO categories (id, slug, name, tagline, color, icon, "sortOrder") VALUES ('tbcat_plants', 'plants', 'نباتات داخلية', 'هدية تبقى أشهرًا لا أيامًا — نباتات سهلة العناية في أصص مختارة.', '#4F7A5A', 'Home', 6);
INSERT INTO categories (id, slug, name, tagline, color, icon, "sortOrder") VALUES ('tbcat_candles-scents', 'candles-scents', 'عطور وشموع', 'شموع معطّرة وعطور أجواء — تُشحن لكل مناطق المملكة.', '#C2A15A', 'Flame', 7);
INSERT INTO categories (id, slug, name, tagline, color, icon, "sortOrder") VALUES ('tbcat_addons', 'addons', 'إضافات وبطاقات', 'بالونات وبطاقات وأغلفة — أضفها لأي طلب.', '#2E2A2B', 'Tag', 8);

-- ── المنتجات ──
INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer") VALUES ('tbp_01', 'باقة روز كلاسيك — وسط', 'ورد جوري أحمر بلفّة كرافت مزدوجة وشريط ساتان — الاختيار الآمن لأي مناسبة.', 'المقاس: وسط
عدد الأزهار: ٢٥ – ٣٠ وردة
الارتفاع التقريبي: ٤٥ سم
نوع الزهرة: ورد جوري هولندي
التغليف: كرافت مزدوج وشريط ساتان
بطاقة الإهداء: مجانية بخط اليد
مدة البقاء: ٥ – ٧ أيام مع العناية', 320, NULL, 'الأكثر مبيعًا', NULL, true, false, 'tbcat_bouquets', true, 'ورد جوري', 'in_stock', NULL, NULL, 1, false);
INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer") VALUES ('tbp_02', 'باقة روز كلاسيك — كبير', 'النسخة الكبيرة من الباقة الأكثر طلبًا — حضور أوضح للمناسبات الرسمية.', 'المقاس: كبير
عدد الأزهار: ٥٠ – ٦٠ وردة
الارتفاع التقريبي: ٦٠ سم
نوع الزهرة: ورد جوري هولندي
التغليف: كرافت مزدوج وشريط ساتان
بطاقة الإهداء: مجانية بخط اليد
مدة البقاء: ٥ – ٧ أيام مع العناية', 520, NULL, NULL, NULL, true, false, 'tbcat_bouquets', true, 'ورد جوري', 'in_stock', NULL, NULL, 2, false);
INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer") VALUES ('tbp_03', 'باقة توليب هولندي — صغير', 'توليب موسمي يصل بكميات محدودة أسبوعيًا — ألوان تُحدَّد حسب توفّر اليوم.', 'المقاس: صغير
عدد الأزهار: ٢٠ زهرة
الارتفاع التقريبي: ٣٥ سم
نوع الزهرة: توليب هولندي
الألوان: حسب توفّر الشحنة الأسبوعية
ملاحظة: التوليب موسمي وقد ينفد سريعًا', 245, NULL, 'كمية محدودة', NULL, false, false, 'tbcat_bouquets', true, 'توليب', 'low_stock', NULL, NULL, 3, false);
INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer") VALUES ('tbp_04', 'صندوق مخملي أحمر — وسط', 'ورد جوري مرتّب داخل صندوق مخملي بإسفنجة مائية — يبقى أطول ولا يحتاج فازة.', 'المقاس: وسط
عدد الأزهار: ٣٠ وردة
أبعاد الصندوق: ٢٢ × ٢٢ سم
نوع الزهرة: ورد جوري
الصندوق: مخمل أحمر بغطاء
القاعدة: إسفنجة مائية تطيل العمر
مدة البقاء: ٧ – ١٠ أيام', 390, 450, 'عرض', NULL, true, false, 'tbcat_flower-boxes', true, 'ورد جوري', 'in_stock', NULL, NULL, 5, true);
INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer") VALUES ('tbp_05', 'صندوق أكريليك شفاف — كبير', 'صندوق أكريليك شفاف بورد مرصوف بالكامل — يُجهَّز بالطلب خلال ٤٨ ساعة.', 'المقاس: كبير
عدد الأزهار: ٥٥ – ٦٠ وردة
أبعاد الصندوق: ٣٠ × ٣٠ سم
نوع الزهرة: ورد جوري مشكّل
الصندوق: أكريليك شفاف بغطاء
مدة التجهيز: ٤٨ ساعة (حجز مسبق)
مدة البقاء: ٧ – ١٠ أيام', 610, NULL, 'وصل حديثًا', NULL, true, false, 'tbcat_flower-boxes', true, 'ورد جوري', 'preorder', NULL, NULL, 6, false);
INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer") VALUES ('tbp_06', 'تنسيق هيدرانجيا في فازة زجاجية', 'هيدرانجيا زرقاء مع أوراق يوكاليبتوس في فازة زجاجية — يُسلَّم جاهزًا للعرض.', 'المقاس: وسط
عدد الأزهار: ٧ رؤوس هيدرانجيا
الارتفاع التقريبي: ٤٨ سم مع الفازة
نوع الزهرة: هيدرانجيا ويوكاليبتوس
الفازة: زجاج شفاف مضلّع (مشمولة)
مدة البقاء: ٦ – ٩ أيام', 445, 520, 'خصم محدود', NULL, true, false, 'tbcat_vase-arrangements', true, 'هيدرانجيا', 'in_stock', NULL, NULL, 7, false);
INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer") VALUES ('tbp_07', 'تنسيق مكتبي مصغّر — أبيض وأخضر', 'تنسيق صغير بارتفاع منخفض لا يحجب الرؤية — مصمَّم لمكاتب الاستقبال.', 'المقاس: صغير
عدد الأزهار: ١٢ – ١٥ زهرة
الارتفاع التقريبي: ٢٤ سم مع الفازة
نوع الزهرة: أقحوان وأوراق خضراء
الفازة: سيراميك أبيض مطفي (مشمولة)
مناسب لـ: المكاتب وطاولات الاجتماعات', 195, NULL, 'الأفضل قيمة', NULL, false, false, 'tbcat_vase-arrangements', true, 'أقحوان', 'in_stock', NULL, NULL, 8, false);
INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer") VALUES ('tbp_08', 'تنسيق تخرّج — كاب وورد ذهبي', 'تنسيق تخرّج بورد ذهبي وأبيض مع كاب مطبوع — يمكن إضافة اسم الخريج مجانًا.', 'المقاس: كبير
عدد الأزهار: ٤٥ وردة
الارتفاع التقريبي: ٥٥ سم
نوع الزهرة: ورد جوري أبيض وذهبي
الإضافات: كاب تخرّج مطبوع
تخصيص الاسم: مجاني — أرسله عند الطلب
مدة التجهيز: نفس اليوم', 480, NULL, 'موسمي', NULL, true, false, 'tbcat_occasions', true, 'ورد جوري', 'in_stock', NULL, NULL, 9, false);
INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer") VALUES ('tbp_09', 'باقة وسط مع شوكولاتة بلجيكية', 'باقة روز وسط مع علبة شوكولاتة بلجيكية ١٦ قطعة — أوفر من شرائهما منفصلين.', 'المقاس: وسط
عدد الأزهار: ٢٥ وردة
الشوكولاتة: بلجيكية، ١٦ قطعة
نوع الزهرة: ورد جوري
التغليف: صندوق هدية موحّد
بطاقة الإهداء: مجانية بخط اليد', 465, 540, 'باقة موفّرة', NULL, true, false, 'tbcat_gift-sets', true, 'ورد جوري', 'in_stock', NULL, NULL, 10, false);
INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer") VALUES ('tbp_10', 'مونستيرا في أصيص سيراميك', 'نبتة مونستيرا سهلة العناية في أصيص سيراميك مطفي — هدية تبقى أشهرًا لا أيامًا.', 'الارتفاع التقريبي: ٥٥ سم مع الأصيص
النوع: مونستيرا ديليسيوزا
الأصيص: سيراميك مطفي مع صحن (مشمول)
الري: مرة أسبوعيًا
الإضاءة: غير مباشرة
الشحن: متاح لكل مناطق المملكة', 285, NULL, NULL, NULL, false, false, 'tbcat_plants', true, 'نباتات داخلية', 'in_stock', NULL, NULL, 11, false);
INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer") VALUES ('tbp_11', 'شمعة معطّرة — عود وياسمين', 'شمعة شمع صويا برائحة عود وياسمين في كوب زجاجي — نفدت الكمية ونتوقّع توفّرها قريبًا.', 'الوزن: ٢٢٠ جم
مدة الاشتعال: ٤٠ – ٤٥ ساعة
الرائحة: عود وياسمين
الشمع: صويا طبيعي
الكوب: زجاج معتّم قابل لإعادة الاستخدام
الشحن: متاح لكل مناطق المملكة', 145, NULL, NULL, NULL, false, false, 'tbcat_candles-scents', true, 'شموع', 'out_of_stock', NULL, NULL, 12, false);
INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge, "imageUrl", "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder", "featuredOffer") VALUES ('tbp_12', 'بطاقة إهداء مطبوعة + بالونة', 'إضافة تُرفق مع أي طلب: بطاقة مطبوعة بتصميمك وبالونة هيليوم واحدة.', 'المحتويات: بطاقة مطبوعة + بالونة هيليوم
مقاس البطاقة: ١٠ × ١٥ سم
التخصيص: أرسل النص أو التصميم عند الطلب
ملاحظة: تُطلب مع منتج آخر ولا تُوصَّل وحدها', 89, NULL, NULL, NULL, false, false, 'tbcat_addons', true, NULL, 'in_stock', NULL, NULL, 13, false);

-- ── البنرات ──
INSERT INTO banners (id, placement, title, subtitle, "linkCategorySlug", "sortOrder", active, ratio) VALUES ('tbb_01', 'home', 'ورد يُقال به ما لا يُقال', 'باقات منسّقة يدويًا — توصيل نفس اليوم داخل الرياض', 'bouquets', 1, true, 'auto');
INSERT INTO banners (id, placement, title, subtitle, "linkCategorySlug", "sortOrder", active, ratio) VALUES ('tbb_02', 'offers', 'العروض الحالية', 'خصومات فعلية لفترة محدودة', NULL, 1, true, 'auto');
INSERT INTO banners (id, placement, title, subtitle, "linkCategorySlug", "sortOrder", active, ratio) VALUES ('tbb_03', 'shop', 'كل التشكيلة في مكان واحد', 'من باقة صغيرة إلى تنسيق مناسبة كاملة', NULL, 1, true, 'auto');

COMMIT;
