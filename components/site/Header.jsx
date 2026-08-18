"use client";
/**
 * ═══════════════════════════════════════════════════════════
 *  الهيدر
 * ═══════════════════════════════════════════════════════════
 *
 *  ⚠️ أُعيد بناؤه لإصلاح خلل نواة: النسخة السابقة كانت تكتب
 *  روابط التنقّل يدويًا داخل الملف — بما فيها «الصيانة الدورية»
 *  و«طلب فني» و«صيانة عاجلة» — وتتجاهل `MODULES` تمامًا.
 *  النتيجة أن إطفاء وحدة لا يُخفي روابطها من الشريط.
 *
 *  الآن: المصدر الوحيد هو `NAV_LINKS` في content.config.js،
 *  وكل رابط يحمل `module` اختياريًا يُخفيه تلقائيًا عند الإطفاء.
 *
 *  التصميم: شريطان — شريط وعد رفيع فوق، ثم صفّ الهوية والتنقّل.
 *  الروابط بخط النص والشعار بخط العناوين — التباين الطباعي هو
 *  ما يعطي الإحساس بالبوتيك بدل شريط تنقّل عام.
 */

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart, ChevronDown, Search, User } from "lucide-react";
import SearchOverlay from "./SearchOverlay.jsx";
import { C } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";
import { MODULES } from "../../config/store.config.js";
import { NAV_LINKS, TOP_BAR } from "../../config/content.config.js";
import StoreLogo from "./StoreLogo.jsx";
import { useCart } from "../../context/CartContext.jsx";

export default function Header({ categories = [], settings = {} }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, setCartOpen } = useCart();

  /**
   * اختصار «/» لفتح البحث — معيار متعارف عليه في المتاجر.
   * نتجاهله داخل الحقول وإلا تعذّرت كتابة الشرطة في نموذج.
   */
  React.useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;
      if (e.key === "/") { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // الوحدة المطفأة تُخفي رابطها — لا روابط ميتة ولا صفحات من مجال آخر
  const links = NAV_LINKS.filter((l) => !l.module || MODULES[l.module]);
  const main = links.filter((l) => !l.accent);
  const accent = links.find((l) => l.accent);

  return (
    <>
    <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    <header className="sticky top-0 z-40" style={{ background: `${C.pearl}F2`, backdropFilter: "blur(10px)" }}>

      {/* ══ شريط الوعد ══ */}
      {TOP_BAR.enabled && (
        <div className="text-center py-2 px-4" style={{ background: C.navy }}>
          <p className="text-[11px] tracking-wide" style={{ color: "#ffffffDD" }}>
            {TOP_BAR.message}
          </p>
        </div>
      )}

      <div className="border-b" style={{ borderColor: C.line }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[4.5rem] flex items-center justify-between gap-4">

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <StoreLogo settings={settings} size={36} />
          </Link>

          {/* ══ التنقّل — الشاشات الكبيرة ══ */}
          <nav className="hidden lg:flex items-center gap-7 text-sm">
            {/* التشكيلة — قائمة منسدلة */}
            <div className="relative" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
              <button
                className="flex items-center gap-1.5 transition-opacity hover:opacity-60"
                style={{ color: C.ink, fontWeight: 500 }}
              >
                التشكيلة <ChevronDown size={14} style={{ opacity: .6 }} />
              </button>
              {catOpen && (
                <div className="absolute top-full right-0 pt-3 w-[22rem] z-50">
                  <div className="rounded-2xl overflow-hidden p-2"
                       style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: "0 24px 56px -28px rgba(0,0,0,.28)" }}>
                    <div className="grid grid-cols-2 gap-1">
                      {categories.map((c) => {
                        const Icon = getIcon(c.icon);
                        return (
                          <Link key={c.id} href={`/category/${c.slug}`}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-colors hover:bg-black/[.03]"
                                style={{ color: C.ink }}>
                            <Icon size={15} style={{ color: c.color || C.teal }} />
                            <span className="truncate">{c.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                    <Link href="/shop"
                          className="mt-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-bold"
                          style={{ background: C.mintTint, color: C.navy }}>
                      كل التشكيلة ({categories.length} أقسام)
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {main.map((l) => (
              <Link key={l.to} href={l.to}
                    className="transition-opacity hover:opacity-60"
                    style={{ color: C.ink, fontWeight: 500 }}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* ══ الإجراءات ══ */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setSearchOpen(true)}
                    aria-label="بحث"
                    className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[13px] transition-colors"
                    style={{ border: `1px solid ${C.line}`, color: C.slate, minWidth: "11rem" }}>
              <Search size={15} />
              <span className="flex-1 text-right">ابحث…</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: C.pearl, color: C.slateLight }}>/</kbd>
            </button>

            <button onClick={() => setSearchOpen(true)} aria-label="بحث"
                    className="sm:hidden w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ border: `1px solid ${C.line}`, color: C.navy }}>
              <Search size={17} />
            </button>

            {accent && (
              <Link href={accent.to}
                    className="hidden xl:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition-transform hover:-translate-y-0.5"
                    style={{ background: C.mintTint, color: C.navy, border: `1px solid ${C.soft}` }}>
                {accent.label}
              </Link>
            )}

            <Link href="/account"
                  aria-label="حسابي"
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ border: `1px solid ${C.line}`, color: C.navy }}>
              <User size={17} />
            </Link>

            <button onClick={() => setCartOpen(true)}
                    className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[13px] transition-transform hover:-translate-y-0.5"
                    style={{ background: C.navy, color: "#fff" }}
                    aria-label="عرض سلة الشراء">
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">السلة</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold"
                      style={{ background: C.teal, color: "#fff" }}>
                  {cartCount}
                </span>
              )}
            </button>

            <button className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ border: `1px solid ${C.line}`, color: C.navy }}
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="القائمة">
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </div>

      {/* ══ القائمة — الجوال ══ */}
      {menuOpen && (
        <div className="lg:hidden border-b max-h-[75vh] overflow-y-auto"
             style={{ borderColor: C.line, background: "#fff" }}>
          <div className="px-4 py-5 flex flex-col gap-5">

            <div>
              <p className="text-[10px] tracking-[.14em] uppercase font-bold mb-2.5" style={{ color: C.slateLight }}>
                التشكيلة
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {categories.map((c) => {
                  const Icon = getIcon(c.icon);
                  return (
                    <Link key={c.id} href={`/category/${c.slug}`} onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px]"
                          style={{ background: C.pearl, color: C.ink }}>
                      <Icon size={14} style={{ color: c.color || C.teal }} />
                      <span className="truncate">{c.name}</span>
                    </Link>
                  );
                })}
              </div>
              <Link href="/shop" onClick={() => setMenuOpen(false)}
                    className="mt-1.5 flex items-center justify-center px-3 py-2.5 rounded-xl text-[13px] font-bold"
                    style={{ background: C.mintTint, color: C.navy }}>
                كل التشكيلة
              </Link>
            </div>

            <div>
              <p className="text-[10px] tracking-[.14em] uppercase font-bold mb-2" style={{ color: C.slateLight }}>
                الصفحات
              </p>
              <div className="flex flex-col">
                {main.map((l) => (
                  <Link key={l.to} href={l.to} onClick={() => setMenuOpen(false)}
                        className="py-2.5 text-sm" style={{ color: C.ink }}>
                    {l.label}
                  </Link>
                ))}
                <Link href="/account" onClick={() => setMenuOpen(false)} className="py-2.5 text-sm" style={{ color: C.ink }}>
                  حسابي
                </Link>
                {MODULES.faq && (
                  <Link href="/faq" onClick={() => setMenuOpen(false)} className="py-2.5 text-sm" style={{ color: C.ink }}>
                    الأسئلة الشائعة
                  </Link>
                )}
              </div>
            </div>

            {accent && (
              <Link href={accent.to} onClick={() => setMenuOpen(false)}
                    className="btn py-3 text-sm"
                    style={{ background: C.navy, color: "#fff" }}>
                <Search size={15} /> {accent.label}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
    </>
  );
}
