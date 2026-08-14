import React from "react";
import { notFound } from "next/navigation";
import { getLegalPage } from "../../../../lib/queries.js";
import { C } from "../../../../lib/colors.js";
import PageHero from "../../../../components/site/PageHero.jsx";
import CtaBand from "../../../../components/site/CtaBand.jsx";

export const revalidate = 600;

export async function generateMetadata({ params }) {
  const page = await getLegalPage(params.slug);
  if (!page || page.published === false) return { title: "الصفحة غير متاحة" };
  return {
    title: page.title,
    description: page.metaDescription || undefined,
    alternates: { canonical: `/legal/${params.slug}` },
  };
}

/**
 * صفحة قانونية — محتواها من لوحة التحكم.
 * يُعرض النص كفقرات وعناوين بسيطة بلا HTML خام، تفاديًا لثغرة XSS
 * لو أُدخل وسم سكربت في المحتوى.
 */
export default async function LegalPage({ params }) {
  const page = await getLegalPage(params.slug);
  if (!page || page.published === false || !page.content?.trim()) notFound();

  const blocks = page.content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div>
      <PageHero title={page.title} subtitle={page.metaDescription} icon="ShieldCheck" color={C.navy} compact />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <article className="max-w-3xl flex flex-col gap-5">
          {blocks.map((block, i) => {
            // سطر يبدأ بـ ## عنوان فرعي
            if (block.startsWith("##")) {
              return (
                <h2 key={i} className="h-card font-display mt-4" style={{ color: C.navy }}>
                  {block.replace(/^#+\s*/, "")}
                </h2>
              );
            }
            // سطر يبدأ بـ - أو • قائمة
            if (/^[-•]/.test(block)) {
              const items = block.split("\n").map((l) => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
              return (
                <ul key={i} className="flex flex-col gap-2 pr-5" style={{ listStyle: "disc" }}>
                  {items.map((it, k) => (
                    <li key={k} className="text-sm sm:text-base leading-loose" style={{ color: C.slate }}>{it}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-sm sm:text-base leading-loose whitespace-pre-line" style={{ color: C.slate }}>
                {block}
              </p>
            );
          })}

          {page.updatedAt && (
            <p className="text-xs pt-6 mt-4" style={{ color: C.slateLight, borderTop: `1px solid ${C.line}` }}>
              آخر تحديث: {new Date(page.updatedAt).toLocaleDateString("ar-SA")}
            </p>
          )}
        </article>
      </section>

      <CtaBand
        eyebrow="لديك سؤال؟"
        title="فريقنا جاهز للإجابة"
        desc="إن لم تجد ما تبحث عنه في هذه الصفحة، راسلنا مباشرة."
        primaryLabel="تواصل معنا"
        primaryHref="/contact"
      />
    </div>
  );
}
