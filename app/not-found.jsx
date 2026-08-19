import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { findRedirect, bumpRedirect } from "../lib/seoDb.js";
import { getCategories } from "../lib/queries.js";
import { getIcon } from "../lib/iconMap.js";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";
import { STORE } from "../config/store.config.js";

export const dynamic = "force-dynamic";
export const metadata = { title: "الصفحة غير موجودة", robots: { index: false, follow: true } };

const C = themeColors();

/**
 * صفحة ٤٠٤ الجذرية — وهي أيضًا منفّذ التحويلات الدائمة.
 *
 * ⚠️ لماذا في الجذر لا داخل مجموعة `(site)`:
 * جرّبت وضعها في `app/(site)/not-found.jsx` أولًا فلم تُلتقط —
 * Next يخدم صفحة ٤٠٤ الافتراضية للمسارات غير المطابقة، وملف
 * المجموعة لا يغطّيها. الجذر يغطّي الحالتين: المسار غير المطابق
 * و`notFound()` المستدعى من أي صفحة.
 *
 * ⚠️ ولماذا هنا لا في `middleware.js`:
 * الـmiddleware يعمل على Edge Runtime بلا وصول لقاعدة البيانات،
 * وقائمة التحويلات تُدار من اللوحة. تنفيذها هنا يعني أن المسار
 * الصحيح لا يدفع أي تكلفة — الاستعلام لا يقع إلا عند مسار مفقود.
 */
export default async function NotFound() {
  // `x-pathname` يحقنها middleware.js؛ البدائل للتوافق مع وسطاء النشر
  const h = headers();
  const path = h.get("x-pathname") || h.get("x-invoke-path") || h.get("x-matched-path") || "";

  if (path && !path.startsWith("/_next")) {
    const rule = await findRedirect(path).catch(() => null);
    if (rule?.toPath && rule.toPath !== path) {
      bumpRedirect(rule.id).catch(() => {});
      redirect(rule.toPath);
    }
  }

  const categories = await getCategories().catch(() => []);

  return (
    <div style={{ background: C.surfaceAlt, minHeight: "70vh" }}>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-[11px] font-bold tracking-[.16em] uppercase mb-4" style={{ color: C.accent }}>
          {STORE.shortName}
        </p>
        <h1 className="mb-3"
            style={{ color: C.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600, fontSize: "clamp(1.6rem,4vw,2.4rem)" }}>
          هذه الصفحة لم تعد موجودة
        </h1>
        <p className="text-sm mb-9 leading-relaxed max-w-md mx-auto" style={{ color: C.muted }}>
          ربما تغيّر الرابط أو نفد المنتج. تصفّح أقسامنا أو ابدأ من التشكيلة الكاملة.
        </p>

        {categories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-9">
            {categories.slice(0, 8).map((c) => {
              const Icon = getIcon(c.icon);
              return (
                <Link key={c.id} href={`/category/${c.slug}`}
                      className="p-4 rounded-2xl flex flex-col items-center gap-2"
                      style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                  <Icon size={17} style={{ color: c.color || C.accent }} />
                  <span className="text-[12px] font-bold" style={{ color: C.primary }}>{c.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/shop" className="px-7 py-3.5 rounded-xl text-sm font-bold"
                style={{ background: C.primary, color: "#fff" }}>
            كل التشكيلة
          </Link>
          <Link href="/" className="px-7 py-3.5 rounded-xl text-sm font-bold"
                style={{ background: "transparent", color: C.primary, border: `1px solid ${C.line}` }}>
            الرئيسية
          </Link>
        </div>
      </section>
    </div>
  );
}
