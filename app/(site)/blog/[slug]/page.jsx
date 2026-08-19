import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ArrowRight } from "lucide-react";
import { getPostBySlug, relatedPosts } from "../../../../lib/blogDb.js";
import { getCurrentAdmin } from "../../../../lib/pagePreview.js";
import { getProducts } from "../../../../lib/queries.js";
import PageBlocks from "../../../../components/site/PageBlocks.jsx";
import CtaBand from "../../../../components/site/CtaBand.jsx";
import { JsonLd, siteUrl, breadcrumbSchema, faqSchema } from "../../../../lib/seo.jsx";
import { applyOverride } from "../../../../lib/seoOverride.js";
import { C } from "../../../../lib/colors.js";
import { STORE } from "../../../../config/store.config.js";

export const dynamic = "force-dynamic";

const fmt = (d) => (d ? new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : "");

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "المقال غير موجود" };
  const base = {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    robots:
      post.noIndex === true || post.noIndex === 1 || post.status !== "published"
        ? { index: false, follow: true }
        : undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt || undefined,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
      publishedTime: post.publishedAt || undefined,
    },
  };
  return applyOverride(`/blog/${params.slug}`, base);
}

export default async function PostPage({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  // المسودّة للمسؤول فقط — نفس منطق الصفحات (§١٨.٥)
  const isDraft = post.status !== "published";
  if (isDraft && !(await getCurrentAdmin())) notFound();

  // بلوك الأسئلة داخل المقال يولّد FAQPage — نفس سلوك الصفحات
  const faqBlock = post.blocks.find((b) => b.type === "faq" && (b.props?.items || []).length);
  const needsProducts = post.blocks.some((b) => b.type === "products");
  const [products, related] = await Promise.all([
    needsProducts ? getProducts().catch(() => []) : [],
    relatedPosts(post, 3).catch(() => []),
  ]);

  /**
   * مخطّط BlogPosting — يؤهّل المقال لبطاقة المقالات في نتائج
   * البحث. `Article` العام أضعف؛ `BlogPosting` أدقّ لمحتوى مدوّنة.
   */
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt || post.publishedAt || undefined,
    author: { "@type": post.author ? "Person" : "Organization", name: post.author || STORE.name },
    publisher: { "@type": "Organization", name: STORE.name },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl()}/blog/${post.slug}` },
  };

  return (
    <div>
      {isDraft && (
        <div className="px-4 py-2.5 text-center text-[12px] font-bold"
             style={{ background: C.warning, color: "#fff" }}>
          معاينة مسودّة — هذا المقال غير منشور ولا يراه الزوّار.
        </div>
      )}

      <JsonLd data={schema} />
      {faqBlock && <JsonLd data={faqSchema(faqBlock.props.items)} />}
      <JsonLd data={breadcrumbSchema([
        { name: "الرئيسية", url: "/" },
        { name: "المدوّنة", url: "/blog" },
        { name: post.title, url: `/blog/${post.slug}` },
      ])} />

      {/* ══ الترويسة ══ */}
      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <Link href="/blog" className="flex items-center gap-1.5 text-[12px] font-bold mb-6 w-fit"
              style={{ color: C.slate }}>
          <ArrowRight size={14} /> المدوّنة
        </Link>
        {post.categoryName && <span className="eyebrow mb-3">{post.categoryName}</span>}
        <h1 className="h-display font-display mb-4" style={{ color: C.navy }}>{post.title}</h1>
        {post.excerpt && (
          <p className="text-base leading-loose mb-5" style={{ color: C.slate }}>{post.excerpt}</p>
        )}
        <div className="flex items-center gap-4 text-[12px]" style={{ color: C.slateLight }}>
          {post.author && <span>{post.author}</span>}
          <span className="num">{fmt(post.publishedAt)}</span>
          {post.readMinutes > 0 && (
            <span className="flex items-center gap-1"><Clock size={12} /> <span className="num">{post.readMinutes}</span> دقائق قراءة</span>
          )}
        </div>
      </header>

      {post.coverImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.title} className="w-full rounded-2xl"
               style={{ border: `1px solid ${C.line}` }} />
        </div>
      )}

      <article>
        <PageBlocks blocks={post.blocks} products={products} />
      </article>

      {/* ══ مقالات ذات صلة ══ */}
      {related.length > 0 && (
        <section className="section-alt">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
            <h2 className="h-section font-display mb-6" style={{ color: C.navy }}>اقرأ أيضًا</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="card-boutique p-5 flex flex-col gap-2">
                  {r.categoryName && <span className="eyebrow">{r.categoryName}</span>}
                  <h3 className="h-card font-display" style={{ color: C.navy }}>{r.title}</h3>
                  {r.excerpt && (
                    <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: C.slate }}>{r.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand
        eyebrow="أعجبك المقال؟"
        title="اطلب باقتك الآن"
        desc="توصيل في نفس اليوم داخل الرياض."
        primaryLabel="تصفّح التشكيلة"
        primaryHref="/shop"
      />
    </div>
  );
}
