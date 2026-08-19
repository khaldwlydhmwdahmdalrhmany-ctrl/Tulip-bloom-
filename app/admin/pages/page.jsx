import React from "react";
import { listPages } from "../../../lib/pagesDb.js";
import { themeColors, TYPOGRAPHY } from "../../../config/theme.config.js";
import PagesBoard from "../../../components/PagesBoard.jsx";

export const dynamic = "force-dynamic";
const T = themeColors();

export default async function AdminPagesPage() {
  const pages = await listPages().catch(() => []);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl mb-1" style={{ color: T.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
          الصفحات
        </h1>
        <p className="text-xs" style={{ color: T.muted }}>
          صفحات مخصّصة تُبنى ببلوكات — بلا كود. تُنشر تحت <code>/p/</code>
        </p>
      </div>
      <PagesBoard
        pages={pages.map((p) => ({
          id: p.id, slug: p.slug, title: p.title, status: p.status,
          blocks: p.blocks.length, updatedAt: p.updatedAt,
          showInFooter: p.showInFooter === true || p.showInFooter === 1,
        }))}
      />
    </div>
  );
}
