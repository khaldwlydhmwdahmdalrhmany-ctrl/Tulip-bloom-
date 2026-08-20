"use client";
/**
 * ═══════════════════════════════════════════════════════════
 *  صفحة إتمام الطلب
 * ═══════════════════════════════════════════════════════════
 *
 *  ── الفرق عن المسار السابق ──
 *  كان الطلب يُنشأ ثم يُفتح واتساب. الآن الطلب يُنشأ وتبدأ عملية
 *  دفع فعلية، وواتساب صار **قناة مساعدة** لا شرطًا لإتمام الشراء.
 *
 *  ── لماذا صفحة لا درج جانبي ──
 *  الإتمام يحتاج ستة أقسام (بيانات، عنوان، شحن، وقت، دفع، ملخّص).
 *  حشرها في درج بعرض ٤٠٠ بكسل يُنتج تمريرًا طويلًا يرفع الهجر.
 */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, User, MapPin, Truck, Clock, CreditCard, Gift,
  Loader2, AlertTriangle, ArrowLeft, Tag, X, Check, ShieldCheck,
} from "lucide-react";
import { C, formatPrice } from "../../lib/colors.js";
import { useCart } from "../../context/CartContext.jsx";

const Section = ({ icon: Icon, title, hint, children }) => (
  <section className="p-5 sm:p-6 rounded-2xl flex flex-col gap-4"
           style={{ background: "#fff", border: `1px solid ${C.line}` }}>
    <div>
      <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: C.navy }}>
        <Icon size={15} style={{ color: C.teal }} /> {title}
      </h2>
      {hint && <p className="text-[11px] mt-1 leading-relaxed" style={{ color: C.slateLight }}>{hint}</p>}
    </div>
    {children}
  </section>
);

export default function CheckoutClient({ currency = "ر.س", whatsapp = "" }) {
  const router = useRouter();
  const {
    cartDetails, cartTotal, customer, setCustomer,
    coupon, couponError, couponBusy, applyCoupon, clearCoupon, discount, payableTotal,
    shipQuote, shipMethodId, setShipMethodId, shipOption, shippingCost, shipBusy,
    slotId, setSlotId, deliveryDate, setDeliveryDate,
    payMethods, payGateway, setPayGateway,
    placeOrder, clearAfterOrder, submitting,
  } = useCart();

  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const field = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors focus:border-[color:var(--c-accent)]";
  const fieldStyle = { border: `1px solid ${C.line}`, background: C.pearl };
  const label = "text-[10px] font-bold tracking-[.12em] uppercase mb-1.5 block";

  const empty = cartDetails.length === 0;

  // السلة فارغة بعد نجاح الطلب — لا نعيد التوجيه حينها
  useEffect(() => {
    if (empty && !result) {
      const t = setTimeout(() => router.replace("/shop"), 2500);
      return () => clearTimeout(t);
    }
  }, [empty, result, router]);

  const submit = async () => {
    setError("");
    if (!customer.name.trim() || !customer.phone.trim()) {
      setError("الاسم ورقم الجوال مطلوبان.");
      return;
    }
    if (!customer.city.trim()) {
      setError("المدينة مطلوبة — يعتمد عليها سعر الشحن.");
      return;
    }
    const res = await placeOrder({ notes });
    if (!res.ok) { setError(res.error || "تعذّر إتمام الطلب."); return; }

    /**
     * التحويل للبوابة إن وُجد. الطلب أُنشئ فعلًا قبل ذلك، فحتى
     * لو فشل التحويل يبقى الطلب في اللوحة ويستطيع المشغّل متابعته.
     */
    if (res.payment?.redirectUrl) {
      clearAfterOrder();
      window.location.href = res.payment.redirectUrl;
      return;
    }

    clearAfterOrder();
    setResult(res);
  };

  /* ══ شاشة النجاح ══ */
  if (result) {
    const o = result.order;
    const inst = result.payment?.instructions;
    return (
      <section className="max-w-2xl mx-auto px-4 sm:px-6 section-y">
        <div className="p-8 rounded-3xl text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <span className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: `${C.success}18`, color: C.success }}>
            <Check size={26} />
          </span>
          <h1 className="h-section font-display mb-2" style={{ color: C.navy }}>تم استلام طلبك</h1>
          <p className="num text-sm mb-1" style={{ color: C.slate }}>رقم الطلب: <strong>{o.orderNumber}</strong></p>
          <p className="num text-sm mb-6" style={{ color: C.slate }}>
            الإجمالي: <strong>{formatPrice(o.total)} {currency}</strong>
          </p>

          {inst?.iban && (
            <div className="p-4 rounded-2xl mb-6 text-right" style={{ background: C.mintTint }}>
              <p className="text-[12px] font-bold mb-2" style={{ color: C.navy }}>بيانات التحويل</p>
              <p className="text-[12px]" style={{ color: C.slate }}>البنك: {inst.bankName}</p>
              <p className="text-[12px]" style={{ color: C.slate }}>الاسم: {inst.accountName}</p>
              <p className="num text-[12px]" dir="ltr" style={{ color: C.slate, textAlign: "right" }}>{inst.iban}</p>
              <p className="text-[11px] mt-2 leading-relaxed" style={{ color: C.slateLight }}>
                أرسل صورة الإيصال على واتساب مع رقم الطلب لتأكيد الدفع.
              </p>
            </div>
          )}

          {result.payment?.error && (
            <p className="text-[12px] px-4 py-3 rounded-xl mb-5 leading-relaxed"
               style={{ background: `${C.warning}12`, color: C.navy }}>
              طلبك مسجّل، لكن تعذّر بدء الدفع الإلكتروني. سنتواصل معك لإتمامه.
            </p>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/account/orders" className="btn px-6 py-3 text-sm"
                  style={{ background: C.navy, color: "#fff" }}>
              متابعة طلباتي
            </Link>
            <Link href="/shop" className="btn px-6 py-3 text-sm"
                  style={{ background: "transparent", color: C.navy, border: `1px solid ${C.line}` }}>
              متابعة التسوّق
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (empty) {
    return (
      <section className="max-w-md mx-auto px-4 section-y text-center">
        <ShoppingBag size={26} style={{ color: C.slateLight }} className="mx-auto mb-4" />
        <p className="text-sm mb-5" style={{ color: C.slate }}>سلتك فارغة.</p>
        <Link href="/shop" className="btn px-6 py-3 text-sm" style={{ background: C.navy, color: "#fff" }}>
          تصفّح التشكيلة
        </Link>
      </section>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
      <div className="mb-7">
        <span className="eyebrow mb-2">الخطوة الأخيرة</span>
        <h1 className="h-section font-display" style={{ color: C.navy }}>إتمام الطلب</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
        {/* ══ النماذج ══ */}
        <div className="flex flex-col gap-4">

          <Section icon={User} title="بياناتك">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={label} style={{ color: C.slateLight }}>الاسم *</label>
                <input value={customer.name} autoComplete="name"
                       onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                       className={field} style={fieldStyle} />
              </div>
              <div>
                <label className={label} style={{ color: C.slateLight }}>رقم الجوال *</label>
                <input value={customer.phone} type="tel" dir="ltr" autoComplete="tel"
                       onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                       placeholder="05XXXXXXXX"
                       className={`${field} text-right`} style={fieldStyle} />
              </div>
            </div>
          </Section>

          <Section icon={MapPin} title="عنوان التسليم"
                   hint="المدينة تحدّد سعر الشحن وخياراته.">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={label} style={{ color: C.slateLight }}>المدينة *</label>
                <input value={customer.city}
                       onChange={(e) => setCustomer((c) => ({ ...c, city: e.target.value }))}
                       placeholder="الرياض" className={field} style={fieldStyle} />
              </div>
              <div>
                <label className={label} style={{ color: C.slateLight }}>الحي والشارع</label>
                <input value={notes.split("|")[0] || ""}
                       onChange={(e) => setNotes(`${e.target.value}|${notes.split("|")[1] || ""}`)}
                       className={field} style={fieldStyle} />
              </div>
            </div>
          </Section>

          <Section icon={Truck} title="طريقة التوصيل"
                   hint={shipQuote?.zone?.name ? `المنطقة: ${shipQuote.zone.name}` : undefined}>
            {shipBusy && <p className="text-[12px]" style={{ color: C.slateLight }}>جارٍ حساب الخيارات…</p>}
            {!shipBusy && !shipQuote?.options?.length && (
              <p className="text-[12px]" style={{ color: C.slateLight }}>أدخل المدينة لعرض خيارات التوصيل.</p>
            )}
            <div className="flex flex-col gap-2">
              {(shipQuote?.options || []).map((o) => {
                const on = (shipMethodId || shipQuote.options[0].id) === o.id;
                return (
                  <button key={o.id} onClick={() => setShipMethodId(o.id)}
                          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-right transition-colors"
                          style={{ background: on ? C.mintTint : C.pearl, border: `1px solid ${on ? C.teal : C.line}` }}>
                    <span className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                          style={{ border: `1.5px solid ${on ? C.teal : C.line}` }}>
                      {on && <span className="w-2 h-2 rounded-full" style={{ background: C.teal }} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-bold" style={{ color: C.navy }}>{o.name}</span>
                      {o.etaText && <span className="block text-[11px]" style={{ color: C.slateLight }}>{o.etaText}</span>}
                    </span>
                    <span className="num text-[13px] font-bold shrink-0"
                          style={{ color: o.free ? C.success : C.navy }}>
                      {o.free ? "مجاني" : `${formatPrice(o.price)} ${currency}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {shipQuote?.slots?.length > 0 && (
            <Section icon={Clock} title="وقت التسليم" hint="اختياري — يساعدنا على التسليم في وقت يناسب المستلم.">
              <div className="grid sm:grid-cols-2 gap-3">
                <select value={slotId} onChange={(e) => setSlotId(e.target.value)}
                        className={field} style={fieldStyle}>
                  <option value="">أي وقت</option>
                  {shipQuote.slots.map((sl) => (
                    <option key={sl.id} value={sl.id}>
                      {sl.label} ({sl.startHour}:00–{sl.endHour}:00){sl.surcharge > 0 ? ` +${sl.surcharge}` : ""}
                    </option>
                  ))}
                </select>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                       min={new Date().toISOString().slice(0, 10)}
                       className={field} style={fieldStyle} />
              </div>
            </Section>
          )}

          <Section icon={Gift} title="بطاقة الإهداء" hint="نكتبها بخط اليد ونرفقها مجانًا.">
            <textarea rows={2} value={notes.split("|")[1] || ""}
                      onChange={(e) => setNotes(`${notes.split("|")[0] || ""}|${e.target.value}`)}
                      placeholder="نص البطاقة…"
                      className={`${field} resize-none`} style={fieldStyle} />
          </Section>

          <Section icon={CreditCard} title="طريقة الدفع">
            {payMethods.length === 0 ? (
              <p className="text-[12px] leading-relaxed px-4 py-3 rounded-xl"
                 style={{ background: `${C.warning}12`, color: C.navy }}>
                لا توجد طريقة دفع مفعّلة حاليًا. سيتواصل معك الفريق لإتمام الدفع بعد تسجيل الطلب.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2.5">
                {payMethods.map((m) => {
                  const on = payGateway === m.code;
                  return (
                    <button key={m.code} onClick={() => setPayGateway(m.code)}
                            className="px-4 py-3.5 rounded-xl text-[13px] font-bold text-right transition-colors"
                            style={{ background: on ? C.navy : C.pearl, color: on ? "#fff" : C.navy,
                                     border: `1px solid ${on ? C.navy : C.line}` }}>
                      {m.name}
                    </button>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        {/* ══ الملخّص ══ */}
        <aside className="lg:sticky lg:top-24 p-5 sm:p-6 rounded-2xl flex flex-col gap-4"
               style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <h2 className="text-sm font-bold" style={{ color: C.navy }}>ملخّص الطلب</h2>

          <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto">
            {cartDetails.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate" style={{ color: C.slate }}>
                  {i.product.name} <span className="num opacity-60">× {i.qty}</span>
                </span>
                <span className="num shrink-0" style={{ color: C.navy }}>
                  {formatPrice(i.product.price * i.qty)}
                </span>
              </div>
            ))}
          </div>

          {/* كود الخصم */}
          {coupon ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                 style={{ background: `${C.success}12`, border: `1px solid ${C.success}33` }}>
              <Tag size={13} style={{ color: C.success }} className="shrink-0" />
              <span className="text-[12px] font-bold flex-1 truncate" style={{ color: C.navy }}>
                {coupon.code} · {coupon.label}
              </span>
              <button onClick={clearCoupon} style={{ color: C.slateLight }}><X size={13} /></button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} dir="ltr"
                       onKeyDown={(e) => e.key === "Enter" && applyCoupon(code)}
                       placeholder="كود الخصم"
                       className="flex-1 px-3 py-2.5 rounded-xl text-[13px] outline-none text-right uppercase"
                       style={fieldStyle} />
                <button onClick={() => applyCoupon(code)} disabled={couponBusy || !code.trim()}
                        className="px-4 rounded-xl text-[12px] font-bold shrink-0"
                        style={{ background: C.pearl, color: C.navy, border: `1px solid ${C.line}` }}>
                  {couponBusy ? <Loader2 size={13} className="animate-spin" /> : "تطبيق"}
                </button>
              </div>
              {couponError && <p className="text-[11px]" style={{ color: C.danger }}>{couponError}</p>}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <div className="flex justify-between text-[13px]">
              <span style={{ color: C.slate }}>المجموع</span>
              <span className="num" style={{ color: C.slate }}>{formatPrice(cartTotal)} {currency}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[13px]">
                <span style={{ color: C.success }}>الخصم</span>
                <span className="num font-bold" style={{ color: C.success }}>−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[13px]">
              <span style={{ color: C.slate }}>الشحن</span>
              <span className="num" style={{ color: shippingCost === 0 ? C.success : C.slate }}>
                {shipOption ? (shippingCost === 0 ? "مجاني" : `${formatPrice(shippingCost)} ${currency}`) : "—"}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
              <span className="text-sm font-bold" style={{ color: C.navy }}>الإجمالي</span>
              <span className="num font-display text-xl" style={{ color: C.navy }}>
                {formatPrice(payableTotal)} {currency}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-[12px] font-bold px-3 py-2.5 rounded-xl flex items-start gap-2"
               style={{ background: `${C.danger}12`, color: C.danger }}>
              <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {error}
            </p>
          )}

          <button onClick={submit} disabled={submitting}
                  className="btn w-full py-4 text-sm"
                  style={{ background: C.navy, color: "#fff", opacity: submitting ? .6 : 1 }}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            تأكيد الطلب
          </button>

          <p className="text-[11px] text-center flex items-center justify-center gap-1.5" style={{ color: C.slateLight }}>
            <ShieldCheck size={12} /> بياناتك محفوظة ولا تُشارك مع أي جهة
          </p>

          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
               className="text-[11px] text-center" style={{ color: C.teal }}>
              تفضّل الطلب عبر واتساب؟ راسلنا
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}
