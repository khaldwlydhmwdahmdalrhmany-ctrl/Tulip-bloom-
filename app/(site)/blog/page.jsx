import React from "react";
import Link from "next/link";
import { Clock, ArrowLeft, Rss } from "lucide-react";
import PageHero from "../../../components/site/PageHero.jsx";
import CtaBand from "../../../components/site/CtaBand.jsx";
import { listPosts, listPostCategories } from "../../../lib/blogDb.js";
import { C } from "../../../lib/colors.js";
import { STORE } from "../../../config/store.config.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "المدوّنة",
  description: `مقالات ${STORE.shortName} عن الورد والعناية به واختيار الهدايا.`,
  alternates: { types: { "application/rss+xml": "/blog/rss.xml" } },
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : "");

export default async function BlogIndex({ searchParams }) {
  const cat = searchParams?.cat || "";
  const [posts, categories] = await Promise.all([
    listPosts({ status: "published", categorySlug: cat || undefined, limit: 60 }),
    listPostCategories().catch(() => []),
  ]);

  const featured = !cat ? posts.find((p) => p.featured) : null;
  const rest = featured ? posts.filter((p) => p.id !== featured.id) : posts;

  const Card = ({ p, wide }) => (
    <Link href={`/blog/${p.slug}`}
          className={`card-boutique group overflow-hidden flex ${wide ? "flex-col sm:flex-row" : "flex-col"}`}>
      <div className={`overflow-hidden shrink-0 ${wide ? "sm:w-1/2" : ""}`}
           style={{ background: C.mintTint, aspectRatio: wide ? "16/10" : "3/2" }}>
        {p.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.coverImage} alt="" loading="lazy"
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : null}
      </div>
      <div className="p-6 flex flex-col gap-2.5 flex-1">
        {p.categoryName && (
          <span className="eyebrow">{p.categoryName}</span>
        )}
        <h2 className={`font-display ${wide ? "h-section" : "h-card"}`} style={{ color: C.navy }}>{p.title}</h2>
        {p.excerpt && (
          <p className="text-sm leading-relaxed line-clamp-3" style={{ color: C.slate }}>{p.excerpt}</p>
        )}
        <div className="flex items-center gap-3 text-[11px] mt-auto pt-3" style={{ color: C.slateLight }}>
          <span className="num">{fmt(p.publishedAt)}</span>
          {p.readMinutes > 0 && (
            <span className="flex items-center gap-1"><Clock size={11} /> <span className="num">{p.readMinutes}</span> دقائق</span>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div>
      <PageHero
        title="المدوّنة"
        subtitle="عن الورد والعناية به واختيار الهدية المناسبة."
        eyebrow="اقرأ معنا"
        icon="FileText"
        compact
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        {/* التصنيفات */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link href="/blog"
                  className="px-4 py-2.5 rounded-xl text-[13px]"
                  style={!cat ? { background: C.navy, color: "#fff", fontWeight: 700 }
                              : { background: "#fff", border: `1px solid ${C.line}`, color: C.slate }}>
              الكل
            </Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/blog?cat=${c.slug}`}
                    className="px-4 py-2.5 rounded-xl text-[13px]"
                    style={cat === c.slug ? { background: C.navy, color: "#fff", fontWeight: 700 }
                                          : { background: "#fff", border: `1px solid ${C.line}`, color: C.slate }}>
                {c.name}
              </Link>
            ))}
            <a href="/blog/rss.xml" title="تغذية RSS"
               className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.slateLight }}>
              <Rss size={15} />
            </a>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="p-12 rounded-2xl text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
            <p className="text-sm mb-5" style={{ color: C.slate }}>لا مقالات منشورة بعد.</p>
            <Link href="/shop" className="btn px-6 py-3 text-sm" style={{ background: C.navy, color: "#fff" }}>
              تصفّح التشكيلة
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {featured && <Card p={featured} wide />}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((p) => <Card key={p.id} p={p} />)}
            </div>
          </div>
        )}
      </section>

      <CtaBand
        eyebrow="جاهز للطلب؟"
        title="اختر باقتك الآن"
        desc="توصيل في نفس اليوم داخل الرياض."
        primaryLabel="تصفّح التشكيلة"
        primaryHref="/shop"
      />
    </div>
  );
}
