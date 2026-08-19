import React from "react";
import { listPosts, listPostCategories } from "../../../lib/blogDb.js";
import { themeColors, TYPOGRAPHY } from "../../../config/theme.config.js";
import BlogBoard from "../../../components/BlogBoard.jsx";

export const dynamic = "force-dynamic";
const T = themeColors();

export default async function AdminBlogPage() {
  const [posts, categories] = await Promise.all([
    listPosts({ limit: 200 }).catch(() => []),
    listPostCategories().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl mb-1" style={{ color: T.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
          المدوّنة
        </h1>
        <p className="text-xs" style={{ color: T.muted }}>
          مقالات تُبنى بنفس بلوكات الصفحات — تُنشر تحت <code>/blog/</code>
        </p>
      </div>
      <BlogBoard
        posts={posts.map((p) => ({
          id: p.id, slug: p.slug, title: p.title, status: p.status,
          categoryName: p.categoryName || "", featured: p.featured === true || p.featured === 1,
          readMinutes: Number(p.readMinutes || 0), publishedAt: p.publishedAt,
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
      />
    </div>
  );
}
