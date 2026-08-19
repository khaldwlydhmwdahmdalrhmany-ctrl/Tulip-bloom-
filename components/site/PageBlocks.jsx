import React from "react";
import Link from "next/link";
import { C, buildWhatsAppLink } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";
import ProductCard from "./ProductCard.jsx";
import FaqAccordion from "./FaqAccordion.jsx";
import CtaBand from "./CtaBand.jsx";

/**
 * ═══════════════════════════════════════════════════════════
 *  مُصيِّر بلوكات الصفحات
 * ═══════════════════════════════════════════════════════════
 *
 *  ⚠️ لا `dangerouslySetInnerHTML` في هذا الملف إطلاقًا.
 *  كل نص يمرّ عبر React فيُهرَّب تلقائيًا. هذا ما يجعل منشئ
 *  الصفحات آمنًا: المحرّر يملأ حقولًا، ولا يكتب ترميزًا.
 */

const Wrap = ({ children, tone }) => (
  <section style={{ background: tone === "alt" ? C.offWhite : "transparent" }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">{children}</div>
  </section>
);

/** يحوّل النص إلى فقرات — السطر الفارغ يفصل. */
const paragraphs = (text) =>
  String(text || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

/** يستخرج معرّف يوتيوب من الصيغ الشائعة. غير ذلك يُتجاهل. */
function youtubeId(url) {
  const s = String(url || "");
  const m =
    s.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||
    s.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    s.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

const cols = (v) => ({ "2": "sm:grid-cols-2", "3": "sm:grid-cols-3", "4": "sm:grid-cols-2 lg:grid-cols-4" }[String(v)] || "sm:grid-cols-3");

/* ═══════════════ البلوكات ═══════════════ */

function HeroBlock({ p }) {
  const center = p.align === "center";
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: p.image ? C.navyDeep : `linear-gradient(135deg, ${C.navyDeep} 0%, ${C.navy} 60%, ${C.navyDeep} 100%)`,
      }}
    >
      {p.image && (
        // صورة الخلفية عبر style لا <img> — لا نحتاج تحسين Next هنا،
        // والنص فوقها يجب أن يبقى مقروءًا فنضع طبقة تعتيم.
        <>
          <div className="absolute inset-0" style={{ backgroundImage: `url(${p.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0" style={{ background: "rgba(26,23,24,.62)" }} />
        </>
      )}
      <div className={`relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col gap-5 ${center ? "items-center text-center" : ""}`}>
        {p.eyebrow && (
          <span className="text-[11px] font-bold tracking-[.16em] uppercase" style={{ color: "rgba(255,255,255,.72)" }}>
            {p.eyebrow}
          </span>
        )}
        <h1 className="h-display font-display" style={{ color: "#fff" }}>{p.title}</h1>
        {p.desc && (
          <p className="text-base leading-loose max-w-xl" style={{ color: "rgba(255,255,255,.8)" }}>{p.desc}</p>
        )}
        {p.ctaLabel && (
          <Link href={p.ctaHref || "/shop"} className="btn w-fit px-7 py-3.5 text-sm mt-1"
                style={{ background: "#fff", color: C.navy }}>
            {p.ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

function RichTextBlock({ p }) {
  const center = p.align === "center";
  return (
    <Wrap>
      <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
        {p.title && <h2 className="h-section font-display mb-5" style={{ color: C.navy }}>{p.title}</h2>}
        <div className="flex flex-col gap-4">
          {paragraphs(p.body).map((para, i) => (
            <p key={i} className="text-[15px] leading-loose" style={{ color: C.slate }}>{para}</p>
          ))}
        </div>
      </div>
    </Wrap>
  );
}

function ImageBlock({ p }) {
  if (!p.url) return null;
  return (
    <Wrap>
      <figure className="max-w-4xl mx-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.url} alt={p.alt || ""} loading="lazy"
             className="w-full rounded-2xl" style={{ border: `1px solid ${C.line}` }} />
        {p.caption && (
          <figcaption className="text-xs text-center mt-3" style={{ color: C.slateLight }}>{p.caption}</figcaption>
        )}
      </figure>
    </Wrap>
  );
}

function GalleryBlock({ p }) {
  const items = (p.items || []).filter((i) => i.url);
  if (!items.length) return null;
  return (
    <Wrap tone="alt">
      {p.title && <h2 className="h-section font-display mb-6" style={{ color: C.navy }}>{p.title}</h2>}
      <div className={`grid grid-cols-2 ${cols(p.columns)} gap-3 sm:gap-4`}>
        {items.map((it, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={it.url} alt={it.alt || ""} loading="lazy"
               className="w-full aspect-square object-cover rounded-2xl"
               style={{ border: `1px solid ${C.line}` }} />
        ))}
      </div>
    </Wrap>
  );
}

function ColumnsBlock({ p }) {
  const items = p.items || [];
  if (!items.length) return null;
  return (
    <Wrap>
      {(p.title || p.desc) && (
        <div className="mb-8 max-w-2xl">
          {p.title && <h2 className="h-section font-display mb-2" style={{ color: C.navy }}>{p.title}</h2>}
          {p.desc && <p className="text-sm" style={{ color: C.slate }}>{p.desc}</p>}
        </div>
      )}
      <div className={`grid ${cols(p.columns)} gap-4`}>
        {items.map((it, i) => {
          const Icon = getIcon(it.icon);
          return (
            <div key={i} className="card-boutique p-6 flex flex-col gap-3">
              <span className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: C.mintTint, color: C.teal }}>
                <Icon size={19} />
              </span>
              {it.title && <h3 className="h-card font-display" style={{ color: C.navy }}>{it.title}</h3>}
              {it.body && <p className="text-sm leading-relaxed" style={{ color: C.slate }}>{it.body}</p>}
            </div>
          );
        })}
      </div>
    </Wrap>
  );
}

function FaqBlock({ p }) {
  const items = (p.items || []).filter((i) => i.q && i.a);
  if (!items.length) return null;
  return (
    <Wrap tone="alt">
      <div className="max-w-3xl mx-auto">
        {p.title && <h2 className="h-section font-display mb-6 text-center" style={{ color: C.navy }}>{p.title}</h2>}
        <FaqAccordion items={items} />
      </div>
    </Wrap>
  );
}

function QuoteBlock({ p }) {
  if (!p.text) return null;
  return (
    <Wrap>
      <blockquote className="max-w-3xl mx-auto text-center">
        <p className="pull-quote mb-4">“{p.text}”</p>
        {p.author && <cite className="text-xs not-italic" style={{ color: C.slateLight }}>— {p.author}</cite>}
      </blockquote>
    </Wrap>
  );
}

function VideoBlock({ p }) {
  const id = youtubeId(p.url);
  // ⚠️ يوتيوب فقط: قبول أي رابط في iframe يسمح بتضمين صفحة
  // خارجية تتنكّر في هيئة موقعك (clickjacking).
  if (!id) return null;
  return (
    <Wrap>
      <div className="max-w-4xl mx-auto">
        {p.title && <h2 className="h-section font-display mb-5" style={{ color: C.navy }}>{p.title}</h2>}
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ paddingTop: "56.25%", background: C.pearl }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title={p.title || "فيديو"}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </Wrap>
  );
}

function ProductsBlock({ p, products = [] }) {
  const limit = Number(p.limit) || 4;
  let list = products;

  if (p.source === "offers") list = products.filter((x) => x.oldPrice && x.oldPrice > x.price);
  else if (p.source === "category" && p.categorySlug) list = products.filter((x) => x.categorySlug === p.categorySlug);
  else if (p.source === "bestSellers") {
    const flagged = products.filter((x) => x.badge && /الأكثر مبيعًا|اختيار العملاء/.test(x.badge));
    list = flagged.length >= 4 ? flagged : products;
  }

  list = list.slice(0, limit);
  if (!list.length) return null;

  return (
    <Wrap>
      {p.title && <h2 className="h-section font-display mb-6" style={{ color: C.navy }}>{p.title}</h2>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {list.map((prod) => <ProductCard key={prod.id} product={prod} />)}
      </div>
    </Wrap>
  );
}

const SPACER = { small: "2rem", medium: "4rem", large: "7rem" };

/* ═══════════════ الموزّع ═══════════════ */

export default function PageBlocks({ blocks = [], products = [] }) {
  return (
    <>
      {blocks.map((b, i) => {
        const p = b.props || {};
        switch (b.type) {
          case "hero":     return <HeroBlock key={i} p={p} />;
          case "richText": return <RichTextBlock key={i} p={p} />;
          case "image":    return <ImageBlock key={i} p={p} />;
          case "gallery":  return <GalleryBlock key={i} p={p} />;
          case "columns":  return <ColumnsBlock key={i} p={p} />;
          case "faq":      return <FaqBlock key={i} p={p} />;
          case "quote":    return <QuoteBlock key={i} p={p} />;
          case "video":    return <VideoBlock key={i} p={p} />;
          case "products": return <ProductsBlock key={i} p={p} products={products} />;
          case "cta":
            return (
              <CtaBand
                key={i}
                eyebrow={p.eyebrow}
                title={p.title}
                desc={p.desc}
                primaryLabel={p.primaryLabel}
                primaryHref={p.primaryHref}
                whatsappMessage={p.whatsappMessage}
              />
            );
          case "spacer":   return <div key={i} style={{ height: SPACER[p.size] || SPACER.medium }} />;
          // نوع مجهول — قد يكون بلوكًا أُزيل من نسخة أحدث. نتجاهله
          // بصمت بدل إسقاط الصفحة كلها.
          default:         return null;
        }
      })}
    </>
  );
}
