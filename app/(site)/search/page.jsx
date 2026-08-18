import React from "react";
import Link from "next/link";
import { SearchX, Search } from "lucide-react";
import PageHero from "../../../components/site/PageHero.jsx";
import ProductCard from "../../../components/site/ProductCard.jsx";
import CtaBand from "../../../components/site/CtaBand.jsx";
import { getProducts, getCategories } from "../../../lib/queries.js";
import { buildIndex, searchProducts } from "../../../lib/searchEngine.js";
import { loadSearchConfig, logSearch } from "../../../lib/searchDb.js";
import { getCurrentCustomer } from "../../../lib/customerSession.js";
import { C, buildWhatsAppLink } from "../../../lib/colors.js";
import { getIcon } from "../../../lib/iconMap.js";
import { STORE } from "../../../config/store.config.js";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const q = (searchParams?.q || "").trim();
  return {
    title: q ? `نتائج البحث عن «${q}»` : "البحث",
    // صفحات النتائج لا تُفهرس — محتوى مكرّر بلا قيمة لمحرّكات البحث
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }) {
  const q = (searchParams?.q || "").trim();

  const [products, categories, config] = await Promise.all([
    getProducts(),
    getCategories().catch(() => []),
    loadSearchConfig(),
  ]);

  let hits = [];
  if (q) {
    const index = buildIndex(products, config.stopwords);
    hits = searchProducts(q, index, { ...config, limit: 48 });
    const me = await getCurrentCustomer().catch(() => null);
    await logSearch({ raw: q, resultCount: hits.length, customerId: me?.id || null });
  }

  return (
    <div>
      <PageHero
        title={q ? `نتائج «${q}»` : "ابحث في التشكيلة"}
        subtitle={q ? `${hits.length} نتيجة مطابقة` : "اكتب ما تبحث عنه — باقة، مناسبة، أو نوع زهرة."}
        eyebrow="البحث"
        icon="Search"
        compact
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        {!q ? (
          <div className="text-center py-10">
            <Link href="/shop" className="btn px-6 py-3 text-sm" style={{ background: C.navy, color: "#fff" }}>
              تصفّح كل التشكيلة
            </Link>
          </div>
        ) : hits.length === 0 ? (
          /* ── لا نتائج ──
             لا نتركه في طريق مسدود: نعرض الأقسام كمخرج، ونفتح
             واتساب برسالة تحمل ما بحث عنه — فربما نجهّزه له. */
          <div className="max-w-xl mx-auto text-center">
            <span className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                  style={{ background: C.mintTint, color: C.teal }}>
              <SearchX size={24} />
            </span>
            <h2 className="h-card font-display mb-2" style={{ color: C.navy }}>
              لم نجد شيئًا يطابق «{q}»
            </h2>
            <p className="text-sm mb-7 leading-relaxed" style={{ color: C.slate }}>
              قد يكون المنتج بمسمّى آخر، أو غير متوفّر حاليًا. تصفّح الأقسام أو اطلبه منّا مباشرة.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-7">
              {categories.slice(0, 8).map((c) => {
                const Icon = getIcon(c.icon);
                return (
                  <Link key={c.id} href={`/category/${c.slug}`}
                        className="card-boutique p-4 flex flex-col items-center gap-2 text-center">
                    <Icon size={17} style={{ color: c.color || C.teal }} />
                    <span className="text-[12px] font-bold" style={{ color: C.navy }}>{c.name}</span>
                  </Link>
                );
              })}
            </div>

            <a href={buildWhatsAppLink(`السلام عليكم، بحثت عن «${q}» في ${STORE.shortName} ولم أجده. هل يمكن تجهيزه؟`)}
               target="_blank" rel="noopener noreferrer"
               className="btn px-6 py-3.5 text-sm" style={{ background: C.navy, color: "#fff" }}>
              اطلبه منّا على واتساب
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {hits.map((h) => <ProductCard key={h.product.id} product={h.product} />)}
          </div>
        )}
      </section>

      {hits.length > 0 && (
        <CtaBand
          eyebrow="لم تجد ما تريد بالضبط؟"
          title="نجهّز التنسيق حسب طلبك"
          desc="أرسل لنا الفكرة والميزانية ونرجع لك بخيارات بالصور."
          primaryLabel="كل التشكيلة"
          primaryHref="/shop"
        />
      )}
    </div>
  );
}
