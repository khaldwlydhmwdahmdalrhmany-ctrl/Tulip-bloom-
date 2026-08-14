-- ═══════════════════════════════════════════════════════════════
--  حذف البيانات التجريبية
-- ═══════════════════════════════════════════════════════════════
--  شغّله قبل إطلاق أي متجر حقيقي.
--  يحذف الصفوف التجريبية فقط ويُبقي أي بيانات أضفتها أنت.
-- ═══════════════════════════════════════════════════════════════

DELETE FROM products   WHERE id LIKE 'seedp%';
DELETE FROM banners    WHERE id LIKE 'seedb%';
DELETE FROM categories WHERE id LIKE 'seedcat%';

SELECT
  (SELECT count(*) FROM products)   AS "المنتجات المتبقية",
  (SELECT count(*) FROM categories) AS "التصنيفات المتبقية",
  (SELECT count(*) FROM banners)    AS "البنرات المتبقية";
