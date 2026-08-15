import React from "react";
import Link from "next/link";
import {
  Package, Tags, ShoppingBag, Image as ImageIcon, BarChart3, Settings,
  ArrowLeft, Plus, Users, Wallet, AlertTriangle, Clock, Flower2, Percent,
} from "lucide-react";
import {
  countProducts, countCategories, countOrders, getAnalytics, getProducts, getOrders,
} from "../../lib/db.js";
import SeedButton from "../../components/SeedButton.jsx";
import { themeColors, TYPOGRAPHY } from "../../config/theme.config.js";
import { STORE } from "../../config/store.config.js";

/**
 * ⚠️ إصلاح خلل نواة: كان هنا كائن ألوان مثبّت يتجاهل الثيم.
 * الآن يُشتق من الثيم النشط.
 */
const T = themeColors();
const C = {
  navy: T.primary, teal: T.accent, slate: T.muted, line: T.line,
  offWhite: T.surfaceAlt, softTint: T.softTint, gold: T.gold,
  success: T.success, danger: T.danger, warning: T.warning,
};

const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };

export const dynamic = "force-dynamic";

const n = (v) => Number(v || 0).toLocaleString("ar-SA");

export default async function AdminHomePage() {
  const [productCount, categoryCount, orderCount, a, products, orders] = await Promise.all([
    countProducts(),
    countCategories(),
    countOrders(),
    getAnalytics({ days: 7 }).catch(() => null),
    getProducts({ includeHidden: true }).catch(() => []),
    getOrders().catch(() => []),
  ]);

  /* ── مؤشرات خاصة بمتجر ورود ──
     الورد منتج سريع التلف، فحالة المخزون والحجوزات أهم من أي رقم آخر.
     كلها محسوبة من بيانات موجودة — بلا أي تعديل في المخطط. */
  const outOfStock = products.filter((p) => p.stock === "out_of_stock").length;
  const lowStock   = products.filter((p) => p.stock === "low_stock").length;
  const preorder   = products.filter((p) => p.stock === "preorder").length;
  const discounted = products.filter((p) => p.oldPrice && p.oldPrice > p.price).length;
  const noImage    = products.filter((p) => !p.imageUrl).length;

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const newOrders   = orders.filter((o) => o.status === "جديد").length;
  const aov = orders.length
    ? Math.round(orders.reduce((s, o) => s + Number(o.total || 0), 0) / orders.length)
    : 0;

  const stats = [
    { label: "المنتجات", value: n(productCount), href: "/admin/products", icon: Package, color: C.navy },
    { label: "التصنيفات", value: n(categoryCount), href: "/admin/categories", icon: Tags, color: C.teal },
    { label: "الطلبات", value: n(orderCount), href: "/admin/orders", icon: ShoppingBag, color: C.gold },
    { label: "زوار ٧ أيام", value: n(a?.totals?.sessions), href: "/admin/analytics", icon: Users, color: C.success },
  ];

  /* بطاقات اليوم — ما يحتاج المشغّل رؤيته أول ما يفتح اللوحة */
  const todayCards = [
    { label: "طلبات اليوم", value: n(todayOrders.length), icon: Clock, color: C.teal },
    { label: "طلبات جديدة لم تُعالج", value: n(newOrders), icon: ShoppingBag, color: newOrders > 0 ? C.warning : C.slate },
    { label: "متوسط قيمة الطلب", value: aov ? `${n(aov)} ر.س` : "—", icon: Wallet, color: C.success },
    { label: "عروض نشطة", value: n(discounted), icon: Percent, color: C.gold },
  ];

  /* تنبيهات تحتاج تدخّلًا — تظهر فقط عند وجود سبب */
  const alerts = [
    outOfStock && { t: `${n(outOfStock)} منتجًا نفدت كميته`, d: "يظهر للزائر بشارة «غير متوفر» ولا يُقبل في السلة.", href: "/admin/products", tone: C.danger },
    lowStock && { t: `${n(lowStock)} منتجًا بكمية محدودة`, d: "راجع التوفّر قبل أن يطلبه أحد.", href: "/admin/products", tone: C.warning },
    preorder && { t: `${n(preorder)} منتجًا بحجز مسبق`, d: "تأكّد من قدرتك على التجهيز خلال المدة المعلنة.", href: "/admin/products", tone: C.teal },
    noImage && { t: `${n(noImage)} منتجًا بلا صورة`, d: "المنتجات بلا صور تُستبعد من كتالوج Google وMeta تلقائيًا.", href: "/admin/products", tone: C.slate },
  ].filter(Boolean);

  const shortcuts = [
    { label: "إضافة منتج", href: "/admin/products/new", icon: Plus, primary: true },
    { label: "البنرات", href: "/admin/banners", icon: ImageIcon },
    { label: "التحليلات", href: "/admin/analytics", icon: BarChart3 },
    { label: "الإعدادات", href: "/admin/settings", icon: Settings },
  ];

  const revenue7 = Math.round(Number(a?.totals?.revenue || 0));

  return (
    <div className="flex flex-col gap-7">
      {/* ══ ترويسة ══ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Flower2 size={16} style={{ color: C.teal }} />
            <span className="text-[10px] tracking-[.14em] uppercase font-bold" style={{ color: C.teal }}>
              {STORE.shortName}
            </span>
          </div>
          <h1 className="text-2xl mb-1" style={{ color: C.navy, ...H }}>نظرة عامة</h1>
          <p className="text-xs" style={{ color: C.slate }}>
            ملخّص متجرك وأدائه خلال آخر سبعة أيام.
          </p>
        </div>
      </div>

      {/* ══ اليوم ══ */}
      <section>
        <h2 className="text-xs font-bold mb-3 tracking-[.1em] uppercase" style={{ color: C.slate }}>اليوم</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {todayCards.map((s) => (
            <div key={s.label} className="p-4 sm:p-5 rounded-2xl flex flex-col gap-2.5"
                 style={{ background: C.softTint, border: `1px solid ${C.line}` }}>
              <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#fff" }}>
                <s.icon size={15} color={s.color} strokeWidth={2} />
              </span>
              <p className="text-[11px] font-bold leading-snug" style={{ color: C.slate }}>{s.label}</p>
              <p className="text-2xl leading-none" style={{ color: C.navy, ...H }}>{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ تنبيهات المخزون — خاصة بالمنتجات سريعة التلف ══ */}
      {alerts.length > 0 && (
        <section>
          <h2 className="text-xs font-bold mb-3 tracking-[.1em] uppercase" style={{ color: C.slate }}>
            يحتاج انتباهك
          </h2>
          <div className="flex flex-col gap-2">
            {alerts.map((al) => (
              <Link key={al.t} href={al.href}
                    className="group flex items-center gap-3 p-4 rounded-2xl transition-colors"
                    style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${al.tone}18` }}>
                  <AlertTriangle size={16} color={al.tone} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold" style={{ color: C.navy }}>{al.t}</p>
                  <p className="text-xs leading-relaxed" style={{ color: C.slate }}>{al.d}</p>
                </div>
                <ArrowLeft size={16} color={C.slate} className="shrink-0 transition-transform group-hover:-translate-x-1" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ══ الإجماليات ══ */}
      <section>
        <h2 className="text-xs font-bold mb-3 tracking-[.1em] uppercase" style={{ color: C.slate }}>الإجماليات</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <Link key={s.href + s.label} href={s.href}
                  className="group relative p-4 sm:p-5 rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-1"
                  style={{ background: "#fff", border: `1px solid ${C.line}` }}>
              <span className="absolute -top-8 -left-6 w-24 h-24 rounded-full blur-2xl opacity-[0.14] pointer-events-none" style={{ background: s.color }} />
              <div className="relative flex flex-col gap-2">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                  <s.icon size={16} color={s.color} strokeWidth={2} />
                </span>
                <p className="text-[11px] font-bold" style={{ color: C.slate }}>{s.label}</p>
                <p className="text-2xl sm:text-3xl leading-none" style={{ color: C.navy, ...H }}>{s.value}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ المبيعات ══ */}
      {revenue7 > 0 && (
        <Link href="/admin/analytics"
              className="group flex items-center justify-between gap-3 p-5 rounded-2xl"
              style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.success}18` }}>
              <Wallet size={18} color={C.success} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold" style={{ color: C.slate }}>مبيعات آخر ٧ أيام</p>
              <p className="text-xl leading-tight" style={{ color: C.navy, ...H }}>
                {n(revenue7)} <span className="text-xs font-normal">ر.س</span>
              </p>
            </div>
          </div>
          <ArrowLeft size={17} color={C.slate} className="shrink-0 transition-transform duration-200 group-hover:-translate-x-1" />
        </Link>
      )}

      {/* ══ اختصارات ══ */}
      <section>
        <h2 className="text-xs font-bold mb-3 tracking-[.1em] uppercase" style={{ color: C.slate }}>اختصارات</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {shortcuts.map((s) => (
            <Link key={s.href} href={s.href}
                  className="flex items-center gap-2.5 p-4 rounded-2xl text-xs font-bold transition-transform duration-200 hover:-translate-y-0.5"
                  style={s.primary
                    ? { background: C.navy, color: "#fff" }
                    : { background: "#fff", border: `1px solid ${C.line}`, color: C.navy }}>
              <s.icon size={16} className="shrink-0" /> {s.label}
            </Link>
          ))}
        </div>
      </section>

      {productCount === 0 && <SeedButton />}
    </div>
  );
}
