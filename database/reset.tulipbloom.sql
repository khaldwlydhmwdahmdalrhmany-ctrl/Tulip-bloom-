-- ═══════════════════════════════════════════════════════════
--  حذف بيانات بذر توليب بلوم فقط
--  (لا يمسّ ما أضفته من لوحة التحكم — المعرّفات مسبوقة بـ tb)
-- ═══════════════════════════════════════════════════════════

DELETE FROM products   WHERE id LIKE 'tbp\_%'   ESCAPE '\';
DELETE FROM banners    WHERE id LIKE 'tbb\_%'   ESCAPE '\';
DELETE FROM categories WHERE id LIKE 'tbcat\_%' ESCAPE '\';
