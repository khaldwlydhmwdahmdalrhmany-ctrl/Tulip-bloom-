-- ═══════════════════════════════════════════════════════════════
--  بيانات تجريبية محايدة
-- ═══════════════════════════════════════════════════════════════
--  اختياري — طبّقه لترى المتجر يعمل قبل إدخال بيانات العميل.
--  ⚠️ احذفها قبل الإطلاق:  DELETE FROM products; DELETE FROM categories; DELETE FROM banners;
-- ═══════════════════════════════════════════════════════════════

INSERT INTO categories (id, slug, name, tagline, color, icon, "sortOrder") VALUES
  ('seedcat01', 'category-one',   'التصنيف الأول',  'وصف مختصر للتصنيف الأول.', '#0C1C77', 'Package',  1),
  ('seedcat02', 'category-two',   'التصنيف الثاني', 'وصف مختصر للتصنيف الثاني.', '#00C6C7', 'Tag',      2),
  ('seedcat03', 'category-three', 'التصنيف الثالث', 'وصف مختصر للتصنيف الثالث.', '#00B9D6', 'Sparkles', 3),
  ('seedcat04', 'accessories',    'الإكسسوارات',    'ملحقات وقطع تكميلية.',      '#0C1C77', 'Gauge',    4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (id, name, description, "fullDescription", price, "oldPrice", badge,
  "freeShipping", "freeInstall", "categoryId", published, brand, stock, rating, "reviewCount", "sortOrder")
VALUES
  ('seedp01','منتج تجريبي ١ — الأساسي','وصف مختصر يظهر في البطاقة.','الخامة: نموذجية' || chr(10) || 'الأبعاد: 20 × 30 سم',199,NULL,NULL,true,false,'seedcat01',true,'ماركة أ','in_stock',NULL,NULL,1),
  ('seedp02','منتج تجريبي ٢ — عليه خصم','سعر سابق أعلى — يظهر في صفحة العروض.','الضمان: سنة واحدة',249,349,'عرض',true,false,'seedcat01',true,'ماركة أ','in_stock',NULL,NULL,2),
  ('seedp03','منتج تجريبي ٣ — الأكثر مبيعًا','شارة رواج مع تقييم فعلي.','الضمان: سنتان',450,NULL,'الأكثر مبيعًا',false,false,'seedcat01',true,'ماركة ب','in_stock',4.6,23,3),
  ('seedp04','منتج تجريبي ٤ — جديد','شارة حالة — لا يدخل صفحة العروض.','السعة: متوسطة',320,NULL,'جديد',true,false,'seedcat02',true,'ماركة ب','in_stock',NULL,NULL,4),
  ('seedp05','منتج تجريبي ٥ — كمية محدودة','حالة التوفّر تظهر بلون تحذيري.','الضمان: 6 أشهر',180,220,'كمية محدودة',false,false,'seedcat02',true,'ماركة ج','low_stock',NULL,NULL,5),
  ('seedp06','منتج تجريبي ٦ — غير متوفر','أزرار الشراء تُعطَّل تلقائيًا.','الخامة: قياسية',275,NULL,NULL,false,false,'seedcat02',true,'ماركة ج','out_of_stock',NULL,NULL,6),
  ('seedp07','منتج تجريبي ٧ — حجز مسبق','حالة حجز مسبق مع تركيب مجاني.','الضمان: 3 سنوات',690,NULL,'حصري',true,true,'seedcat03',true,'ماركة د','preorder',NULL,NULL,7),
  ('seedp08','منتج تجريبي ٨ — الأعلى سعرًا','قيمة عالية بخصم كبير — يتصدّر العروض.','الضمان: 5 سنوات',1850,2400,'تصفية',true,true,'seedcat03',true,'ماركة د','in_stock',4.9,8,8),
  ('seedp09','منتج تجريبي ٩ — بلا شارة','منتج عادي بلا شارة ولا خصم.','الخامة: قياسية',540,NULL,NULL,false,false,'seedcat03',true,'ماركة أ','in_stock',NULL,NULL,9),
  ('seedp10','ملحق تجريبي ١','سعر منخفض لاختبار حد الشحن المجاني.','الخامة: بسيطة',45,NULL,NULL,false,false,'seedcat04',true,NULL,'in_stock',NULL,NULL,10),
  ('seedp11','ملحق تجريبي ٢ — باقة','باقة بخصم — شارة وسعر معًا.','المحتويات: 3 قطع',120,160,'باقة موفّرة',false,false,'seedcat04',true,'ماركة ب','in_stock',NULL,NULL,11),
  ('seedp12','ملحق تجريبي ٣ — بلا وصف كامل','تبويب المواصفات يُخفى تلقائيًا.','',78,NULL,NULL,false,false,'seedcat04',true,NULL,'in_stock',NULL,NULL,12)
ON CONFLICT (id) DO NOTHING;

INSERT INTO banners (id, placement, title, subtitle, "linkCategorySlug", "sortOrder", active, ratio) VALUES
  ('seedb01','home',  'بنر تجريبي للصفحة الرئيسية','يظهر بتدرّج لوني حين لا توجد صورة.','category-one',1,true,'auto'),
  ('seedb02','offers','بنر صفحة العروض',            'استبدله من لوحة التحكم.',           NULL,          1,true,'auto')
ON CONFLICT (id) DO NOTHING;
