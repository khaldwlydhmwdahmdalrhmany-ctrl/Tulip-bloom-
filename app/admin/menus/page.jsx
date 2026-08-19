import React from "react";
import { listNavItems } from "../../../lib/navDb.js";
import { listPages } from "../../../lib/pagesDb.js";
import { getCategories } from "../../../lib/db.js";
import { NAV_LINKS } from "../../../config/content.config.js";
import { MODULES } from "../../../config/store.config.js";
import { themeColors, TYPOGRAPHY } from "../../../config/theme.config.js";
import MenuEditor from "../../../components/MenuEditor.jsx";

export const dynamic = "force-dynamic";
const T = themeColors();

export default async function AdminMenusPage() {
  const [items, pages, categories] = await Promise.all([
    listNavItems().catch(() => []),
    listPages({ status: "published" }).catch(() => []),
    getCategories().catch(() => []),
  ]);

  // مقترحات جاهزة — تقلّل الكتابة اليدوية وتمنع أخطاء المسارات
  const suggestions = [
    ...NAV_LINKS.filter((l) => !l.module || MODULES[l.module]).map((l) => ({ label: l.label, href: l.to })),
    { label: "المدوّنة", href: "/blog" },
    ...categories.map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
    ...pages.map((p) => ({ label: p.title, href: `/p/${p.slug}` })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl mb-1" style={{ color: T.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
          القوائم
        </h1>
        <p className="text-xs" style={{ color: T.muted }}>
          روابط الهيدر والفوتر. ما دامت القائمة فارغة، تُستعمل الروابط الافتراضية من التهيئة.
        </p>
      </div>
      <MenuEditor initial={items} suggestions={suggestions} />
    </div>
  );
}
