"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Menu, ShoppingCart, ChevronDown } from "lucide-react";
import { C } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";
import StoreLogo from "./StoreLogo.jsx";
import { useCart } from "../../context/CartContext.jsx";

const NAV_LINKS = [
  { to: "/", label: "الرئيسية" },
  { to: "/offers", label: "العروض" },
  { to: "/maintenance", label: "الصيانة الدورية" },
  { to: "/maintenance/technician", label: "طلب فني" },
  { to: "/maintenance/urgent", label: "صيانة عاجلة", urgent: true },
  { to: "/about", label: "نبذة عنا" },
  { to: "/contact", label: "تواصل معنا" },
];

export default function Header({ categories, settings = {} }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const { cartCount, setCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: `${C.pearl}F5`, backdropFilter: "blur(8px)", borderColor: C.line }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">

          <StoreLogo settings={settings} size={34} />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm">
          <Link href="/" className="font-medium" style={{ color: C.ink }}>الرئيسية</Link>
          <div className="relative" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
            <button className="flex items-center gap-1 text-sm font-medium" style={{ color: C.ink }}>
              المنتجات <ChevronDown size={14} />
            </button>
            {catOpen && (
              <div className="absolute top-full right-0 pt-2 w-64 z-50">
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: C.pearl, border: `1px solid ${C.line}` }}>
                  <Link href="/shop" className="block px-4 py-2.5 text-sm font-bold" style={{ color: C.navy, borderBottom: `1px solid ${C.line}` }}>
                    كل المنتجات
                  </Link>
                  {categories.map((c) => {
                    const Icon = getIcon(c.icon);
                    return (
                      <Link key={c.id} href={`/category/${c.slug}`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:opacity-70" style={{ color: C.ink }}>
                        <Icon size={14} color={c.color} /> {c.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <Link href="/offers" className="font-medium" style={{ color: C.ink }}>العروض</Link>
          <Link href="/maintenance" className="font-medium" style={{ color: C.ink }}>الصيانة الدورية</Link>
          <Link href="/maintenance/technician" className="font-medium" style={{ color: C.ink }}>طلب فني</Link>
          <Link
            href="/maintenance/urgent"
            className="font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors"
            style={{ color: C.danger, background: `${C.danger}0F` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.danger }} />
            صيانة عاجلة
          </Link>
          <Link href="/about" className="font-medium" style={{ color: C.ink }}>نبذة عنا</Link>
          <Link href="/contact" className="font-medium" style={{ color: C.ink }}>تواصل معنا</Link>
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm" style={{ background: C.navy, color: C.pearl }} aria-label="عرض سلة الشراء">
            <ShoppingCart size={17} />
            <span className="hidden sm:inline">السلة</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold" style={{ background: C.teal, color: C.navyDeep }}>
                {cartCount}
              </span>
            )}
          </button>
          <button className="lg:hidden p-2 rounded-lg" style={{ border: `1px solid ${C.line}` }} onClick={() => setMenuOpen((v) => !v)} aria-label="القائمة">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden px-4 pb-4 flex flex-col gap-3 text-sm font-medium border-t" style={{ borderColor: C.line }}>
          <Link href="/" onClick={() => setMenuOpen(false)} className="pt-3">الرئيسية</Link>
          <Link href="/shop" onClick={() => setMenuOpen(false)}>كل المنتجات</Link>
          {categories.map((c) => {
            const Icon = getIcon(c.icon);
            return (
              <Link key={c.id} href={`/category/${c.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 pr-2" style={{ color: C.slate }}>
                <Icon size={13} color={c.color} /> {c.name}
              </Link>
            );
          })}
          <Link href="/offers" onClick={() => setMenuOpen(false)}>العروض</Link>
          <Link href="/maintenance" onClick={() => setMenuOpen(false)}>الصيانة الدورية</Link>
          <Link href="/maintenance/technician" onClick={() => setMenuOpen(false)}>طلب فني صيانة</Link>
          <Link
            href="/maintenance/urgent"
            onClick={() => setMenuOpen(false)}
            className="inline-flex items-center gap-2 font-bold"
            style={{ color: C.danger }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.danger }} />
            صيانة عاجلة
          </Link>
          <Link href="/about" onClick={() => setMenuOpen(false)}>نبذة عن الشركة</Link>
          <Link href="/faq" onClick={() => setMenuOpen(false)}>الأسئلة الشائعة</Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>تواصل معنا</Link>
        </div>
      )}
    </header>
  );
}
