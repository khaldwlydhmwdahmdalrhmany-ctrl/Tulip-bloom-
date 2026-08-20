"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { STORE } from "../../config/store.config.js";
import { themeColors, TYPOGRAPHY } from "../../config/theme.config.js";
import {
  LayoutGrid, Package, Tags, Image as ImageIcon, ShoppingBag,
  LogOut, Settings, BarChart3, Menu, X, ExternalLink, Percent, FileText, Flower2, UsersRound, Search as SearchIcon, Megaphone, Globe, Layers, Newspaper, ListTree, Truck, CreditCard,
} from "lucide-react";

/**
 * ⚠️ إصلاح خلل نواة: كان هنا كائن ألوان مكتوب يدويًا
 *   { navy: "#0C1C77", teal: "#00C6C7", ... }
 * يتجاهل theme.config.js تمامًا. النتيجة أن لوحة التحكم تبقى
 * بألوان ثيم aqua في كل متجر مهما غُيّر الثيم.
 *
 * الآن تُشتق من الثيم النشط — الأسماء القديمة محفوظة كما هي
 * حتى لا ينكسر أي استعمال داخل الملف.
 */
const T = themeColors();
const C = {
  navy: T.primary,
  navyDeep: T.primaryDeep,
  teal: T.accent,
  line: T.line,
  slate: T.muted,
  offWhite: T.surfaceAlt,
  ink: T.ink,
  danger: T.danger,
  soft: T.soft,
  softTint: T.softTint,
  gold: T.gold,
  success: T.success,
};

const NAV = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutGrid },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/categories", label: "التصنيفات", icon: Tags },
  { href: "/admin/banners", label: "البنرات", icon: ImageIcon },
  { href: "/admin/offers", label: "العروض", icon: Percent },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { href: "/admin/shipping", label: "الشحن والتوصيل", icon: Truck },
  { href: "/admin/payments", label: "الدفع والمدفوعات", icon: CreditCard },
  { href: "/admin/customers", label: "العملاء", icon: UsersRound },
  { href: "/admin/marketing", label: "التسويق والنمو", icon: Megaphone },
  { href: "/admin/search", label: "البحث الداخلي", icon: SearchIcon },
  { href: "/admin/seo", label: "محركات البحث", icon: Globe },
  { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
  { href: "/admin/pages", label: "الصفحات", icon: Layers },
  { href: "/admin/blog", label: "المدوّنة", icon: Newspaper },
  { href: "/admin/menus", label: "القوائم", icon: ListTree },
  { href: "/admin/media", label: "مكتبة الوسائط", icon: ImageIcon },
  { href: "/admin/legal", label: "الصفحات القانونية", icon: FileText },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // إغلاق القائمة تلقائيًا عند الانتقال لصفحة أخرى
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // منع تمرير الخلفية أثناء فتح القائمة
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  if (pathname === "/admin/login") return children;

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const isActive = (href) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const currentLabel = NAV.find((i) => isActive(i.href))?.label || "لوحة التحكم";

  const NavList = ({ onNavigate }) => (
    <>
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={
              active
                ? { background: C.softTint, color: C.navy, fontWeight: 700 }
                : { color: C.slate, fontWeight: 500 }
            }
          >
            {active && (
              <span
                className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                style={{ background: C.teal }}
              />
            )}
            <item.icon size={17} style={{ color: active ? C.teal : C.slate }} /> {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div dir="rtl" className="min-h-screen flex flex-col sm:flex-row" style={{ background: C.offWhite }}>
      {/* ══ شريط علوي — الجوال فقط ══ */}
      <header
        className="sm:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3"
        style={{ background: "#fff", borderBottom: `1px solid ${C.line}` }}
      >
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="فتح القائمة"
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: C.offWhite, color: C.navy }}
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col items-center leading-tight min-w-0">
          <span className="font-display text-sm truncate" style={{ color: C.navy, fontWeight: 800 }}>
            {currentLabel}
          </span>
          <span className="text-[10px]" style={{ color: C.slate }}>لوحة تحكم {STORE.shortName}</span>
        </div>

        <Link
          href="/"
          aria-label="عرض الموقع"
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: C.offWhite, color: C.navy }}
        >
          <ExternalLink size={17} />
        </Link>
      </header>

      {/* ══ قائمة منزلقة — الجوال فقط ══ */}
      {menuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-50"
          style={{ background: `${C.navyDeep}99` }}
          onClick={() => setMenuOpen(false)}
        >
          <nav
            className="absolute top-0 right-0 h-full w-[78%] max-w-xs flex flex-col p-4"
            style={{ background: "#fff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.navy, color: "#fff" }}>
                  <Flower2 size={18} />
                </span>
                <div>
                  <div style={{ color: C.navy, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
                    {STORE.shortName}
                  </div>
                  <div className="text-[10px] tracking-[.14em] uppercase" style={{ color: C.slate }}>لوحة التحكم</div>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="إغلاق القائمة"
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: C.offWhite, color: C.navy }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
              <NavList onNavigate={() => setMenuOpen(false)} />
            </div>

            <div className="pt-3 mt-2 flex flex-col gap-1" style={{ borderTop: `1px solid ${C.line}` }}>
              <Link href="/" className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-bold" style={{ color: C.ink }}>
                <ExternalLink size={17} /> عرض الموقع
              </Link>
              <button onClick={logout} className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-bold" style={{ color: C.danger }}>
                <LogOut size={17} /> تسجيل الخروج
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ══ الشريط الجانبي — الشاشات الكبيرة ══ */}
      <aside
        className="w-60 shrink-0 hidden sm:flex flex-col gap-1 p-4 sticky top-0 h-screen"
        style={{ background: "#fff", borderLeft: `1px solid ${C.line}` }}
      >
        <div className="px-2 pt-5 pb-6">
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: C.navy, color: "#fff" }}
            >
              <Flower2 size={18} />
            </span>
            <div className="min-w-0">
              <div
                className="text-base truncate"
                style={{ color: C.navy, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}
              >
                {STORE.shortName}
              </div>
              <div
                className="text-[10px] tracking-[.14em] uppercase"
                style={{ color: C.slate }}
              >
                لوحة التحكم
              </div>
            </div>
          </div>
        </div>

        <NavList />

        <div className="mt-auto pt-3 flex flex-col gap-1" style={{ borderTop: `1px solid ${C.line}` }}>
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold" style={{ color: C.ink }}>
            <ExternalLink size={16} /> عرض الموقع
          </Link>
          <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold" style={{ color: C.danger }}>
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8 w-full max-w-5xl pb-20 sm:pb-8">{children}</main>
    </div>
  );
}
