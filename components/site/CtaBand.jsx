import React from "react";
import Link from "next/link";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { C, G, buildWhatsAppLink } from "../../lib/colors.js";

/**
 * شريط دعوة لاتخاذ إجراء — يُختم به معظم الصفحات.
 */
export default function CtaBand({
  eyebrow = "جاهز تبدأ؟",
  title = "نحن هنا للمساعدة",
  desc = "لديك سؤال عن منتج؟ راسلنا ونرد خلال دقائق.",
  primaryLabel = "تصفّح المنتجات",
  primaryHref = "/shop",
  whatsappMessage = "السلام عليكم، أحتاج مساعدة في اختيار المنتج المناسب.",
}) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
      <div
        className="relative overflow-hidden rounded-3xl px-6 sm:px-12 py-12 sm:py-16 text-center"
        style={{ background: G.deep }}
      >
        {/* زخرفة خلفية */}
        <span
          className="absolute -top-24 -right-16 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: C.teal }}
        />
        <span
          className="absolute -bottom-28 -left-16 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: C.mint }}
        />

        <div className="relative flex flex-col items-center gap-4">
          <span className="text-xs font-bold" style={{ color: C.mint }}>{eyebrow}</span>
          <h2 className="h-section font-display" style={{ color: "#fff" }}>{title}</h2>
          <p className="text-sm sm:text-base leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,.78)" }}>
            {desc}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-3 w-full sm:w-auto">
            <Link
              href={primaryHref}
              className="btn group w-full sm:w-auto px-7 py-3.5 text-sm"
              style={{ background: "#fff", color: C.navy }}
            >
              {primaryLabel} <ArrowLeft size={16} className="arrow-slide" />
            </Link>

            <a
              href={buildWhatsAppLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn w-full sm:w-auto px-7 py-3.5 text-sm"
              style={{ background: "#25D366", color: "#fff" }}
            >
              <MessageCircle size={17} /> استشارة عبر واتساب
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
