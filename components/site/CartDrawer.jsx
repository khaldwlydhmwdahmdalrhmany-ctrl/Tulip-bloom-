"use client";
import React from "react";
import { X, Plus, Minus, ShoppingCart, MessageCircle, CheckCircle2, Loader2, Tag } from "lucide-react";
import { C, formatPrice } from "../../lib/colors.js";
import { getIcon } from "../../lib/iconMap.js";
import { useCart } from "../../context/CartContext.jsx";
import OrderConfirmation from "./OrderConfirmation.jsx";

export default function CartDrawer() {
  const {
    cartOpen, setCartOpen, cartDetails, cartTotal,
    updateQty, removeItem, customer, setCustomer,
    formTouched, canCheckout, sendToWhatsApp, toast, submitting,
    coupon, couponError, couponBusy, applyCoupon, clearCoupon, discount, payableTotal,
    shipQuote, shipMethodId, setShipMethodId, shipOption, shippingCost, shipBusy,
    slotId, setSlotId, deliveryDate, setDeliveryDate,
    payMethods, payGateway, setPayGateway,
  } = useCart();
  const [codeInput, setCodeInput] = React.useState("");

  return (
    <>
      {cartOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setCartOpen(false)} style={{ background: "rgba(7,18,51,0.6)" }}>
          <div className="absolute top-0 right-0 h-full w-full sm:w-[420px] bg-white flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: C.line }}>
              <h3 className="font-display text-lg" style={{ color: C.navy }}>سلة الشراء</h3>
              <button onClick={() => setCartOpen(false)} aria-label="إغلاق السلة"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {cartDetails.length === 0 ? (
                <div className="text-center py-16" style={{ color: C.slate }}>
                  <ShoppingCart size={36} className="mx-auto mb-3" />
                  السلة فارغة حاليًا. أضف منتجًا لتبدأ طلبك.
                </div>
              ) : (
                cartDetails.map((i) => {
                  const Icon = getIcon(i.product.category?.icon);
                  return (
                    <div key={i.id} className="flex gap-3 items-center">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: i.product.imageUrl ? C.offWhite : `${i.product.category?.color || C.navy}15` }}>
                        {i.product.imageUrl ? (
                          <img src={i.product.imageUrl} alt={i.product.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <Icon size={22} color={i.product.category?.color || C.navy} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: C.ink }}>{i.product.name}</p>
                        <p className="text-xs font-bold mt-0.5" style={{ color: C.navy }}>{formatPrice(i.product.price)} ر.س</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQty(i.id, -1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.mintTint }}><Minus size={14} /></button>
                          <span className="text-sm font-bold w-5 text-center">{i.qty}</span>
                          <button onClick={() => updateQty(i.id, 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.mintTint }}><Plus size={14} /></button>
                        </div>
                      </div>
                      <button onClick={() => removeItem(i.id)} aria-label="إزالة المنتج" style={{ color: "#b34747" }}><X size={16} /></button>
                    </div>
                  );
                })
              )}

              {cartDetails.length > 0 && (
                <div className="pt-4 mt-2 border-t flex flex-col gap-3" style={{ borderColor: C.line }}>
                  <h4 className="font-bold text-sm" style={{ color: C.navy }}>بيانات التوصيل</h4>
                  <input placeholder="الاسم الكامل" value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: `1.5px solid ${formTouched && !customer.name.trim() ? "#c05050" : C.line}` }} />
                  <input placeholder="رقم الجوال" value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: `1.5px solid ${formTouched && !customer.phone.trim() ? "#c05050" : C.line}` }} />
                  <input placeholder="المدينة (يحدّد سعر الشحن)" value={customer.city} onChange={(e) => setCustomer((c) => ({ ...c, city: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ border: `1.5px solid ${C.line}` }} />
                  {formTouched && !canCheckout && (<p className="text-xs" style={{ color: "#c05050" }}>الرجاء تعبئة الاسم ورقم الجوال لإتمام الطلب.</p>)}
                </div>
              )}
            </div>

            {cartDetails.length > 0 && (
              <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: C.line }}>

                {/* ══ كود الخصم ══ */}
                {coupon ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                       style={{ background: `${C.success}12`, border: `1px solid ${C.success}33` }}>
                    <Tag size={14} style={{ color: C.success }} className="shrink-0" />
                    <span className="text-[12px] font-bold flex-1 truncate" style={{ color: C.navy }}>
                      {coupon.code} · {coupon.label}
                    </span>
                    <button onClick={clearCoupon} aria-label="إزالة الكود"
                            className="shrink-0" style={{ color: C.slateLight }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-2">
                      <input
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon(codeInput)}
                        placeholder="كود الخصم"
                        dir="ltr"
                        className="flex-1 px-3 py-2.5 rounded-xl text-[13px] outline-none text-right uppercase"
                        style={{ border: `1px solid ${C.line}`, background: C.pearl }}
                      />
                      <button onClick={() => applyCoupon(codeInput)} disabled={couponBusy || !codeInput.trim()}
                              className="px-4 rounded-xl text-[12px] font-bold shrink-0"
                              style={{ background: C.pearl, color: C.navy, border: `1px solid ${C.line}`,
                                       opacity: codeInput.trim() ? 1 : .5 }}>
                        {couponBusy ? <Loader2 size={14} className="animate-spin" /> : "تطبيق"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px]" style={{ color: C.danger }}>{couponError}</p>
                    )}
                  </div>
                )}

                {/* ══ طريقة الشحن ══ */}
                {shipQuote?.options?.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold tracking-[.12em] uppercase" style={{ color: C.slateLight }}>
                      طريقة التوصيل
                      {shipQuote.zone?.name ? ` · ${shipQuote.zone.name}` : ""}
                      {shipBusy ? " · جارٍ التحديث…" : ""}
                    </p>
                    {shipQuote.options.map((o) => {
                      const on = (shipMethodId || shipQuote.options[0].id) === o.id;
                      return (
                        <button key={o.id} onClick={() => setShipMethodId(o.id)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-right transition-colors"
                                style={{
                                  background: on ? C.mintTint : C.pearl,
                                  border: `1px solid ${on ? C.teal : C.line}`,
                                }}>
                          <span className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                                style={{ border: `1.5px solid ${on ? C.teal : C.line}` }}>
                            {on && <span className="w-2 h-2 rounded-full" style={{ background: C.teal }} />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13px] font-bold truncate" style={{ color: C.navy }}>{o.name}</span>
                            {(o.etaText || o.freeOverRemaining) && (
                              <span className="block text-[11px]" style={{ color: C.slateLight }}>
                                {o.etaText}
                                {o.freeOverRemaining ? ` · أضف ${formatPrice(o.freeOverRemaining)} ر.س للشحن المجاني` : ""}
                              </span>
                            )}
                          </span>
                          <span className="num text-[13px] font-bold shrink-0"
                                style={{ color: o.free ? C.success : C.navy }}>
                            {o.free ? "مجاني" : `${formatPrice(o.price)} ر.س`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ══ وقت التسليم ══ */}
                {shipQuote?.slots?.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold tracking-[.12em] uppercase" style={{ color: C.slateLight }}>
                      وقت التسليم (اختياري)
                    </p>
                    <div className="flex gap-2">
                      <select value={slotId} onChange={(e) => setSlotId(e.target.value)}
                              className="flex-1 px-3 py-2.5 rounded-xl text-[13px] outline-none"
                              style={{ border: `1px solid ${C.line}`, background: C.pearl }}>
                        <option value="">أي وقت</option>
                        {shipQuote.slots.map((sl) => (
                          <option key={sl.id} value={sl.id}>
                            {sl.label} ({sl.startHour}:00–{sl.endHour}:00){sl.surcharge > 0 ? ` +${sl.surcharge}` : ""}
                          </option>
                        ))}
                      </select>
                      <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                             min={new Date().toISOString().slice(0, 10)}
                             className="px-3 py-2.5 rounded-xl text-[13px] outline-none"
                             style={{ border: `1px solid ${C.line}`, background: C.pearl }} />
                    </div>
                  </div>
                )}

                {/* ══ طريقة الدفع ══ */}
                {payMethods.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold tracking-[.12em] uppercase" style={{ color: C.slateLight }}>
                      طريقة الدفع
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {payMethods.map((m) => {
                        const on = payGateway === m.code;
                        return (
                          <button key={m.code} onClick={() => setPayGateway(m.code)}
                                  className="px-3 py-2.5 rounded-xl text-[12px] font-bold transition-colors"
                                  style={{
                                    background: on ? C.navy : C.pearl,
                                    color: on ? "#fff" : C.navy,
                                    border: `1px solid ${on ? C.navy : C.line}`,
                                  }}>
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ══ الإجماليات ══ */}
                {discount > 0 && (
                  <>
                    <div className="flex items-center justify-between text-[13px]">
                      <span style={{ color: C.slate }}>المجموع</span>
                      <span className="num" style={{ color: C.slate }}>{formatPrice(cartTotal)} ر.س</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span style={{ color: C.success }}>الخصم</span>
                      <span className="num font-bold" style={{ color: C.success }}>
                        −{formatPrice(discount)} ر.س
                      </span>
                    </div>
                  </>
                )}

                {shipOption && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span style={{ color: C.slate }}>الشحن</span>
                    <span className="num" style={{ color: shippingCost === 0 ? C.success : C.slate }}>
                      {shippingCost === 0 ? "مجاني" : `${formatPrice(shippingCost)} ر.س`}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: C.slate }}>الإجمالي</span>
                  <span className="font-display text-xl num" style={{ color: C.navy }}>
                    {formatPrice(payableTotal)} ر.س
                  </span>
                </div>
                <button
                  onClick={sendToWhatsApp}
                  disabled={submitting}
                  className="btn w-full py-3.5 text-sm"
                  style={{ background: "#25D366", color: "#fff" }}
                >
                  {submitting ? (
                    <><Loader2 size={17} className="animate-spin" /> جارٍ تسجيل الطلب…</>
                  ) : (
                    <><MessageCircle size={18} /> إتمام الطلب عبر واتساب</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <OrderConfirmation />

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shadow-lg" style={{ background: C.navy, color: C.pearl }}>
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}
    </>
  );
}
