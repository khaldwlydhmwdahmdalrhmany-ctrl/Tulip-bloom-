import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getPageById, BLOCK_TYPES } from "../../../../lib/pagesDb.js";
import { themeColors } from "../../../../config/theme.config.js";
import PageEditor from "../../../../components/PageEditor.jsx";

export const dynamic = "force-dynamic";
const T = themeColors();

export default async function EditPage({ params }) {
  const page = await getPageById(params.id);
  if (!page) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/pages" className="flex items-center gap-1.5 text-[12px] font-bold w-fit"
            style={{ color: T.muted }}>
        <ArrowRight size={14} /> كل الصفحات
      </Link>
      <PageEditor
        page={{
          id: page.id, slug: page.slug, title: page.title, status: page.status,
          blocks: page.blocks,
          seoTitle: page.seoTitle || "", seoDescription: page.seoDescription || "",
          ogImage: page.ogImage || "",
          noIndex: page.noIndex === true || page.noIndex === 1,
          showInFooter: page.showInFooter === true || page.showInFooter === 1,
          showInHeader: page.showInHeader === true || page.showInHeader === 1,
          sortOrder: Number(page.sortOrder || 0),
        }}
        blockTypes={BLOCK_TYPES}
      />
    </div>
  );
}
