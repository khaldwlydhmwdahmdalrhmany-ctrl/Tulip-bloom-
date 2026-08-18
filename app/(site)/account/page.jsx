import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, CalendarHeart, MapPin, ArrowLeft, Sparkles } from "lucide-react";
import { getCurrentCustomer } from "../../../lib/customerSession.js";
import { ordersForCustomer, upcomingReminders, listAddresses, listRecipients } from "../../../lib/customerDb.js";
import { C, formatPrice } from "../../../lib/colors.js";

export const dynamic = "force-dynamic";
export const metadata = { title: "حسابي" };

const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default async function AccountHome() {
  const me = await getCurrentCustomer();
  if (!me) redirect("/account/login");

  const [orders, reminders, addresses, recipients] = await Promise.all([
    ordersForCustomer(me.id),
    upcomingReminders(me.id, 60),
    listAddresses(me.id),
    listRecipients(me.id),
  ]);

  const spent = orders.reduce((s, o) => s + Number(o.total || 0), 0);

  const stats = [
    { label: "الطلبات", value: orders.length, icon: Package, href: "/account/orders" },
    { label: "إجمالي الشراء", value: `${formatPrice(Math.round(spent))} ر.س`, icon: Sparkles },
    { label: "المستلمون", value: recipients.length, icon: CalendarHeart, href: "/account/recipients" },
    { label: "العناوين", value: addresses.length, icon: MapPin, href: "/account/addresses" },
  ];

  return (
    <div className="flex flex-col gap-7">
      <div>
        <span className="eyebrow mb-2">حسابك</span>
        <h1 className="h-section font-display" style={{ color: C.navy }}>
          أهلًا {me.name || "بك"}
        </h1>
      </div>

      {/* ── تذكيرات قادمة — أهم ما يراه العميل ── */}
      {reminders.length > 0 && (
        <section>
          <h2 className="text-[10px] font-bold mb-3 tracking-[.14em] uppercase" style={{ color: C.slateLight }}>
            مناسبات قادمة
          </h2>
          <div className="flex flex-col gap-2">
            {reminders.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-4 rounded-2xl"
                   style={{ background: r.daysAway <= 7 ? C.mintTint : "#fff", border: `1px solid ${C.line}` }}>
                <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#fff", color: C.teal }}>
                  <CalendarHeart size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold" style={{ color: C.navy }}>{r.title}</p>
                  <p className="text-xs" style={{ color: C.slate }}>
                    {r.day} {MONTHS[r.month - 1]}
                    {r.recipientName ? ` · ${r.recipientName}` : ""}
                    {" · "}
                    <span style={{ color: r.daysAway <= 7 ? C.danger : C.slateLight, fontWeight: 700 }}>
                      {r.daysAway === 0 ? "اليوم" : `بعد ${r.daysAway} يومًا`}
                    </span>
                  </p>
                </div>
                <Link href="/shop" className="btn shrink-0 px-4 py-2 text-[12px]"
                      style={{ background: C.navy, color: "#fff" }}>
                  اطلب الآن
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── إحصاءات ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Inner = (
            <div className="p-5 rounded-2xl flex flex-col gap-2 h-full"
                 style={{ background: "#fff", border: `1px solid ${C.line}` }}>
              <span className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: C.softTint || C.mintTint, color: C.teal }}>
                <s.icon size={15} />
              </span>
              <p className="text-[11px] font-bold" style={{ color: C.slate }}>{s.label}</p>
              <p className="num text-xl leading-none font-display" style={{ color: C.navy }}>{s.value}</p>
            </div>
          );
          return s.href
            ? <Link key={s.label} href={s.href} className="lift">{Inner}</Link>
            : <div key={s.label}>{Inner}</div>;
        })}
      </div>

      {/* ── آخر الطلبات ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-bold tracking-[.14em] uppercase" style={{ color: C.slateLight }}>
            آخر الطلبات
          </h2>
          {orders.length > 0 && (
            <Link href="/account/orders" className="text-[12px] font-bold flex items-center gap-1" style={{ color: C.teal }}>
              الكل <ArrowLeft size={13} />
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="p-8 rounded-2xl text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
            <p className="text-sm mb-4" style={{ color: C.slate }}>لا توجد طلبات بعد.</p>
            <Link href="/shop" className="btn px-6 py-3 text-sm" style={{ background: C.navy, color: "#fff" }}>
              تصفّح التشكيلة
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.slice(0, 3).map((o) => (
              <Link key={o.id} href="/account/orders"
                    className="flex items-center justify-between gap-3 p-4 rounded-2xl"
                    style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                <div className="min-w-0">
                  <p className="num text-sm font-bold" style={{ color: C.navy }}>{o.orderNumber || o.id.slice(0, 8)}</p>
                  <p className="text-xs" style={{ color: C.slate }}>{o.status}</p>
                </div>
                <p className="num text-sm font-bold shrink-0" style={{ color: C.navy }}>
                  {formatPrice(o.total)} ر.س
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
