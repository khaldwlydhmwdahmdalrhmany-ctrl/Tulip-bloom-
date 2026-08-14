import { unstable_cache, revalidateTag } from "next/cache";

/**
 * طبقة تخزين مؤقت بوسوم (tags).
 *
 * المشكلة قبلها: كل صفحة كانت `force-dynamic`، أي أن كل زيارة تفتح
 * اتصالًا بقاعدة البيانات وتنتظر نتيجته قبل عرض أي شيء. عند 500 منتج
 * وزيارات متزامنة يصبح هذا عنق الزجاجة.
 *
 * الحل: نخزّن نتيجة الاستعلام ونُبطلها *فقط* عند التعديل من لوحة التحكم،
 * لا بعد مدة زمنية عشوائية. فالصفحة تُخدَّم فورًا من الذاكرة، ومع ذلك
 * تعكس أي تعديل خلال ثوانٍ من حفظه — بلا انتظار انتهاء مؤقّت.
 */

export const TAGS = {
  products: "products",
  categories: "categories",
  banners: "banners",
  settings: "settings",
};

/** يغلّف دالة قراءة بتخزين مؤقت موسوم. */
export function cached(fn, keyParts, tags, revalidate = 3600) {
  return unstable_cache(fn, keyParts, { tags, revalidate });
}

/**
 * إبطال الوسوم بعد أي تعديل.
 * تعديل منتج يمسّ الصفحة الرئيسية والمتجر والتصنيف والعروض معًا،
 * فنُبطل وسم المنتجات مرة واحدة بدل تتبّع كل صفحة على حدة.
 */
export function invalidate(...tags) {
  for (const t of tags) {
    try { revalidateTag(t); } catch {}
  }
}

export const invalidateProducts = () => invalidate(TAGS.products, TAGS.categories);
export const invalidateCategories = () => invalidate(TAGS.categories, TAGS.products);
export const invalidateBanners = () => invalidate(TAGS.banners);
export const invalidateSettings = () => invalidate(TAGS.settings);
