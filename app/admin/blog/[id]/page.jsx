import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getPostById, listPostCategories } from "../../../../lib/blogDb.js";
import { BLOCK_TYPES } from "../../../../lib/pagesDb.js";
import { themeColors } from "../../../../config/theme.config.js";
import PageEditor from "../../../../components/PageEditor.jsx";

export const dynamic = "force-dynamic";
const T = themeColors();

export default async function EditPost({ params }) {
  const post = await getPostById(params.id);
  if (!post) notFound();
  const categories = await listPostCategories().catch(() => []);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/blog" className="flex items-center gap-1.5 text-[12px] font-bold w-fit"
            style={{ color: T.muted }}>
        <ArrowRight size={14} /> كل المقالات
      </Link>
      <PageEditor
        kind="post"
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        page={{
          id: post.id, slug: post.slug, title: post.title, status: post.status,
          blocks: post.blocks,
          excerpt: post.excerpt || "", coverImage: post.coverImage || "",
          categoryId: post.categoryId || "", author: post.author || "",
          seoTitle: post.seoTitle || "", seoDescription: post.seoDescription || "",
          ogImage: post.coverImage || "",
          noIndex: post.noIndex === true || post.noIndex === 1,
          featured: post.featured === true || post.featured === 1,
          sortOrder: 0,
        }}
        blockTypes={BLOCK_TYPES}
      />
    </div>
  );
}
