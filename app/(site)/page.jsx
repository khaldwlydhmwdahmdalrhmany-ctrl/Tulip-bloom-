import React from "react";
import { getCategories, getProducts, getBanners } from "../../lib/queries.js";
import { HOME_SECTIONS } from "../../config/sections.config.js";
import SectionRenderer from "../../components/sections/SectionRenderer.jsx";

export const revalidate = 300;

/**
 * الصفحة الرئيسية.
 *
 * لا تحوي أي قسم مكتوبًا مباشرة — الترتيب والمحتوى في
 * config/sections.config.js. مهمتها جلب البيانات وتسليمها للمحرّك.
 *
 * لتغيير ترتيب الأقسام أو إضافة قسم: عدّل ملف التهيئة، لا هذا الملف.
 */
export default async function HomePage() {
  const [categories, products, banners] = await Promise.all([
    getCategories(),
    getProducts(),
    getBanners({ placement: "home" }),
  ]);

  return <SectionRenderer sections={HOME_SECTIONS} data={{ categories, products, banners }} />;
}
