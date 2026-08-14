import React from "react";
import Link from "next/link";
import {
  Package, Tags, ShoppingBag, Image as ImageIcon, BarChart3, Settings,
  ArrowLeft, Plus, Users, Wallet,
} from "lucide-react";
import { countProducts, countCategories, countOrders, getAnalytics } from "../../lib/db.js";
import SeedButton from "../../components/SeedButton.jsx";

const C = { navy: "#0C1C77", teal: "#00C6C7", slate: "#5C6B72", line: "#E1ECE8", offWhite: "#F6FAF9", gold: "#F2B01E", success: "#1B9C68" };

export const dynamic = "force-dynamic";

const n = (v) => Number(v || 0).toLocaleString("ar-SA");

export default async function AdminHomePage() {
  const [productCount, categoryCount, orderCount, a] = await Promise.all([
    countProducts(),
    countCategories(),
    countOrders(),
    getAnalytics({ days: 7 }).catch(() => null),
  ]);

  const stats = [
    { label: "المنتجات", value: productCount, href: "/admin/products", icon: Package, color: C.navy },
    { label: "التصنيفات", value: categoryCount, href: "/admin/categories", icon: Tags, color: C.teal },
    { label: "الطلبات", value: orderCount, href: "/admin/orders", icon: ShoppingBag, color: C.gold },
    { label: "زوار ٧ أيام", value: n(a?.totals?.sessions), href: "/admin/analytics", icon: Users, color: "#E4405F" },
  ];

  const shortcuts = [
    { label: "إضافة منتج", href: "/admin/products/new", icon: Plus, primary: true },
    { label: "البنرات", href: "/admin/banners", icon: ImageIcon },
    { label: "التحليلات", href: "/admin/analytics", icon: BarChart3 },
    { label: "الإعدادات", href: "/admin/settings", icon: Settings },
  ];

  const revenue7 = Math.round(Number(a?.totals?.revenue || 0));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl mb-1" style={{ color: C.navy, fontWeight: 800 }}>نظرة عامة</h1>
        <p className="text-xs" style={{ color: C.slate }}>ملخّص سريع لمتجرك وأدائه خلال آخر سبعة أيام.</p>
      </div>

      {/* البطاقات — عمودان على الجوال بدل عمود واحد طويل */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link
            key={s.href + s.label}
            href={s.href}
            className="group relative p-4 sm:p-5 rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-1"
            style={{ background: "#fff", border: `1px solid ${C.line}` }}
          >
            <span className="absolute -top-8 -left-6 w-24 h-24 rounded-full blur-2xl opacity-[0.12] pointer-events-none" style={{ background: s.color }} />
            <div className="relative flex flex-col gap-2">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                <s.icon size={16} color={s.color} strokeWidth={2} />
              </span>
              <p className="text-[11px] font-bold" style={{ color: C.slate }}>{s.label}</p>
              <p className="font-display text-2xl sm:text-3xl leading-none" style={{ color: C.navy, fontWeight: 800 }}>
                {s.value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* المبيعات */}
      {revenue7 > 0 && (
        <Link
          href="/admin/analytics"
          className="group flex items-center justify-between gap-3 p-5 rounded-2xl"
          style={{ background: "#fff", border: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.success}18` }}>
              <Wallet size={18} color={C.success} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold" style={{ color: C.slate }}>مبيعات آخر ٧ أيام</p>
              <p className="font-display text-xl leading-tight" style={{ color: C.navy, fontWeight: 800 }}>
                {n(revenue7)} <span className="text-xs font-normal">ر.س</span>
              </p>
            </div>
          </div>
          <ArrowLeft size={17} color={C.slate} className="shrink-0 transition-transform duration-200 group-hover:-translate-x-1" />
        </Link>
      )}

      {/* اختصارات */}
      <div>
        <h2 className="font-bold text-sm mb-3" style={{ color: C.navy }}>اختصارات</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-2.5 p-4 rounded-2xl text-xs font-bold transition-transform duration-200 hover:-translate-y-0.5"
              style={s.primary
                ? { background: C.navy, color: "#fff" }
                : { background: "#fff", border: `1px solid ${C.line}`, color: C.navy }}
            >
              <s.icon size={16} className="shrink-0" /> {s.label}
            </Link>
          ))}
        </div>
      </div>

      {productCount === 0 && <SeedButton />}
    </div>
  );
}
