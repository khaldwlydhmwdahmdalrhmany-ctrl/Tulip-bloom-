import React from "react";
import Link from "next/link";
import { Users, Eye, ShoppingBag, Wallet, TrendingUp, Search, Megaphone, Settings } from "lucide-react";
import { getAnalytics, getSettings } from "../../../lib/db.js";
import { isPaid } from "../../../lib/attribution.js";
import StatCard from "../../../components/analytics/StatCard.jsx";
import TrendChart from "../../../components/analytics/TrendChart.jsx";
import SourceBars from "../../../components/analytics/SourceBars.jsx";

const C = { navy: "#0C1C77", slate: "#4A5A63", line: "#E1ECE8", teal: "#00C6C7", gold: "#F2B01E", success: "#1B9C68", offWhite: "#F6FAF9" };

export const dynamic = "force-dynamic";

const RANGES = [
  { d: 7, label: "٧ أيام" },
  { d: 30, label: "٣٠ يومًا" },
  { d: 90, label: "٩٠ يومًا" },
];

const n = (v) => Number(v || 0).toLocaleString("ar-SA");

export default async function AnalyticsPage({ searchParams }) {
  const days = Number(searchParams?.days) || 30;
  const [a, settings] = await Promise.all([
    getAnalytics({ days }).catch(() => null),
    getSettings().catch(() => ({})),
  ]);

  if (!a) {
    return <p className="text-sm p-6 rounded-2xl" style={{ background: "#fff", border: `1px solid ${C.line}` }}>تعذّر تحميل التحليلات.</p>;
  }

  const t = a.totals || {};
  const sessions = Number(t.sessions || 0);
  const orders = Number(t.orders || 0);
  const convRate = sessions > 0 ? ((orders / sessions) * 100).toFixed(1) : "0.0";

  // فصل المدفوع عن المجاني — أهم تمييز في تقارير التسويق
  const paidSessions = a.byMedium.filter((m) => isPaid(m.medium)).reduce((s, m) => s + Number(m.sessions), 0);
  const organicSessions = a.byMedium.filter((m) => !isPaid(m.medium) && m.medium !== "none").reduce((s, m) => s + Number(m.sessions), 0);
  const directSessions = a.byMedium.filter((m) => m.medium === "none").reduce((s, m) => s + Number(m.sessions), 0);

  const trackingOn = Boolean((settings.gtm_id || settings.ga4_id || "").trim());

  return (
    <div className="flex flex-col gap-6">
      {/* الترويسة */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl mb-1" style={{ color: C.navy, fontWeight: 800 }}>لوحة التحليلات</h1>
          <p className="text-xs" style={{ color: C.slate }}>
            بيانات محسوبة من قاعدة بياناتك مباشرة — تشمل الطلبات ومصادرها، وهو ما لا توفّره أدوات التحليل الخارجية.
          </p>
        </div>

        <div className="flex gap-1 p-1 rounded-full" style={{ background: C.offWhite }}>
          {RANGES.map((r) => (
            <Link
              key={r.d}
              href={`/admin/analytics?days=${r.d}`}
              className="px-4 py-2 rounded-full text-xs font-bold transition-colors"
              style={days === r.d ? { background: C.navy, color: "#fff" } : { color: C.slate }}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* تنبيه عدم تفعيل التتبّع */}
      {!trackingOn && (
        <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: "#FFF8E7", border: "1px solid #F2B01E44" }}>
          <Settings size={18} color="#8A6200" className="shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed" style={{ color: "#8A6200" }}>
            <strong className="block mb-0.5">لم تُفعّل أدوات التتبّع الخارجية بعد.</strong>
            الأرقام أدناه تعمل بالفعل (تُسجَّل داخليًا)، لكن لربط جوجل ومايكروسوفت وبكسلات المنصات
            أضف معرّف Google Tag Manager من{" "}
            <Link href="/admin/settings" className="underline font-bold">صفحة الإعدادات</Link>.
          </div>
        </div>
      )}

      {/* البطاقات */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Users} label="الزوار (جلسات)" value={n(sessions)} accent={C.teal}
                  hint={`${n(t.new_visitors)} زائر جديد`} />
        <StatCard icon={Eye} label="مشاهدات الصفحات" value={n(t.views)} accent="#4285F4" />
        <StatCard icon={ShoppingBag} label="الطلبات" value={n(orders)} accent={C.gold} />
        <StatCard icon={Wallet} label="إجمالي المبيعات" value={n(Math.round(t.revenue))} unit="ر.س" accent={C.success} />
        <StatCard icon={TrendingUp} label="معدّل التحويل" value={convRate} unit="%" accent="#E4405F"
                  hint="نسبة الجلسات التي أنتجت طلبًا" />
      </div>

      {/* الرسم البياني */}
      <section className="p-5 rounded-2xl" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <h2 className="font-bold text-sm mb-4" style={{ color: C.navy }}>الزوار والطلبات عبر الوقت</h2>
        {a.byDay.length > 1 ? (
          <TrendChart data={a.byDay} />
        ) : (
          <p className="text-xs py-8 text-center" style={{ color: C.slate }}>
            تحتاج يومين على الأقل من البيانات لرسم الاتجاه.
          </p>
        )}
      </section>

      {/* مدفوع مقابل مجاني */}
      <section className="p-5 rounded-2xl" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <h2 className="font-bold text-sm mb-1" style={{ color: C.navy }}>مدفوع مقابل مجاني</h2>
        <p className="text-[11px] mb-4" style={{ color: C.slate }}>
          الزيارات المدفوعة تُحتسب من معرّفات النقر الإعلانية (gclid، fbclid، ttclid…) ووسوم UTM.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Megaphone, label: "زيارات مدفوعة", v: paidSessions, color: "#8A6200", bg: "#FFF4E0" },
            { icon: Search, label: "زيارات مجانية", v: organicSessions, color: C.success, bg: "#E7F7EF" },
            { icon: Users, label: "زيارات مباشرة", v: directSessions, color: "#1E4DB7", bg: "#EAF2FF" },
          ].map((b, i) => {
            const pct = sessions > 0 ? Math.round((b.v / sessions) * 100) : 0;
            return (
              <div key={i} className="p-4 rounded-xl flex flex-col gap-2" style={{ background: b.bg }}>
                <span className="flex items-center gap-2 text-[11px] font-bold" style={{ color: b.color }}>
                  <b.icon size={14} /> {b.label}
                </span>
                <span className="font-display text-2xl leading-none" style={{ color: b.color, fontWeight: 800 }}>
                  {n(b.v)} <span className="text-xs font-normal">({pct}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* مصادر الزيارات والطلبات */}
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="p-5 rounded-2xl" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: C.navy }}>من أين يأتي الزوار</h2>
          <SourceBars rows={a.bySource} valueKey="sessions" />
        </section>

        <section className="p-5 rounded-2xl" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <h2 className="font-bold text-sm mb-1" style={{ color: C.navy }}>مصادر الطلبات الفعلية</h2>
          <p className="text-[11px] mb-4" style={{ color: C.slate }}>
            القناة التي تجلب زيارات ليست بالضرورة التي تجلب مبيعات — قارن الجدولين.
          </p>
          <SourceBars rows={a.orderSources} valueKey="orders" showMedium />
        </section>
      </div>

      {/* المنتجات والصفحات */}
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="p-5 rounded-2xl" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: C.navy }}>الأكثر طلبًا</h2>
          {a.topProducts.length === 0 ? (
            <p className="text-xs py-6 text-center" style={{ color: C.slate }}>لا توجد طلبات بعد في هذه الفترة.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {a.topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: i === 0 ? C.gold : C.offWhite, color: i === 0 ? "#fff" : C.slate }}>
                    {i + 1}
                  </span>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span className="w-9 h-9 rounded-lg shrink-0" style={{ background: C.offWhite }} />
                  )}
                  <span className="text-xs font-semibold flex-1 truncate" style={{ color: C.navy }}>{p.name}</span>
                  <span className="text-xs font-bold shrink-0" style={{ color: C.teal }}>{n(p.units)} قطعة</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="p-5 rounded-2xl" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: C.navy }}>أكثر الصفحات زيارة</h2>
          {a.topPages.length === 0 ? (
            <p className="text-xs py-6 text-center" style={{ color: C.slate }}>لا توجد بيانات بعد.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {a.topPages.map((p, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-xs py-1.5"
                    style={{ borderBottom: i < a.topPages.length - 1 ? `1px solid ${C.line}` : "none" }}>
                  <span className="truncate font-semibold" dir="ltr" style={{ color: C.navy }}>{p.path}</span>
                  <span className="shrink-0 font-bold" style={{ color: C.slate }}>{n(p.views)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
