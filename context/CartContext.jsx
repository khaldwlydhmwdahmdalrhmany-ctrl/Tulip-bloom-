"use client";
import React, { createContext, useContext, useState, useMemo, useRef, useCallback, useEffect } from "react";
import { formatPrice, buildWhatsAppLink } from "../lib/colors.js";
import { resolveAttribution } from "../lib/attribution.js";
import { trackAddToCart, trackBeginCheckout, trackPurchase, trackViewCart, trackRemoveFromCart } from "../lib/analytics.js";
import { STORE } from "../config/store.config.js";

const CartContext = createContext(null);

export function CartProvider({ children, allProducts }) {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", city: "" });
  const [formTouched, setFormTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const findProduct = useCallback((id) => allProducts.find((p) => p.id === id), [allProducts]);

  const addToCart = useCallback((id, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { id, qty }];
    });
    const p = findProduct(id);
    if (p) {
      showToast(`تمت إضافة «${p.name}» إلى السلة`);
      trackAddToCart(p, qty);   // يلتقطه GTM فيغذّي كل البكسلات دفعة واحدة
    }
  }, [findProduct, showToast]);

  // تتبّع فتح السلة — مرحلة وسيطة مهمة لبناء جمهور "سلة مهجورة"
  useEffect(() => {
    if (cartOpen && cartDetails.length > 0) trackViewCart(cartDetails, cartTotal);
  }, [cartOpen]);

  const updateQty = useCallback((id, delta) => {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)).filter((i) => i.qty > 0));
  }, []);

  const removeItem = useCallback((id) => {
    const p = findProduct(id);
    const line = cart.find((i) => i.id === id);
    if (p) trackRemoveFromCart(p, line?.qty || 1);   // إشارة تردد — تُبنى عليها حملات استرجاع
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, [cart, findProduct]);

  const cartDetails = useMemo(() => cart.map((i) => ({ ...i, product: findProduct(i.id) })).filter((i) => i.product), [cart, findProduct]);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartDetails.reduce((s, i) => s + i.qty * i.product.price, 0);

  /* ══ الكوبون ══
     النتيجة هنا للعرض فقط. مسار /api/orders يعيد التحقّق من
     الصفر ويتجاهل أي مبلغ خصم يصل من المتصفح. */
  const [coupon, setCoupon] = useState(null);        // { code, label, discount, shipping, total, freeShipping }
  const [couponError, setCouponError] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  const applyCoupon = useCallback(async (code) => {
    const c = String(code || "").trim();
    if (!c) return;
    setCouponBusy(true); setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: c,
          phone: customer.phone,
          items: cartDetails.map((i) => ({ id: i.id, qty: i.qty })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setCoupon(null); setCouponError(data.error || "تعذّر تطبيق الكود."); return; }
      setCoupon(data);
    } catch {
      setCouponError("تعذّر الاتصال. حاول مجددًا.");
    } finally { setCouponBusy(false); }
  }, [cartDetails, customer.phone]);

  const clearCoupon = useCallback(() => { setCoupon(null); setCouponError(""); }, []);

  // تغيّر السلة يُبطل الخصم المحسوب — قد يسقط تحت حد الكوبون
  useEffect(() => { if (coupon) setCoupon(null); /* eslint-disable-next-line */ }, [cartTotal]);

  const discount = coupon?.discount || 0;

  /* ══ الشحن ══
     الخيارات تُجلب من الخادم بحسب المدينة والسلة. النتيجة
     للعرض فقط — مسار الطلبات يعيد الحساب (§٢٢.٧). */
  const [shipQuote, setShipQuote] = useState(null);
  const [shipMethodId, setShipMethodId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [shipBusy, setShipBusy] = useState(false);

  useEffect(() => {
    if (cartDetails.length === 0) { setShipQuote(null); return; }
    setShipBusy(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/shipping/quote", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: customer.city,
            items: cartDetails.map((i) => ({ id: i.id, qty: i.qty })),
          }),
        });
        const d = await res.json();
        setShipQuote(d);
        // الخيار المختار يبقى إن ظلّ متاحًا، وإلا نعود للأول
        setShipMethodId((prev) => (d.options?.some((o) => o.id === prev) ? prev : d.options?.[0]?.id || ""));
      } catch { /* يبقى السعر الافتراضي */ }
      finally { setShipBusy(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [cartDetails, customer.city]);

  const shipOption = shipQuote?.options?.find((o) => o.id === shipMethodId) || shipQuote?.options?.[0] || null;
  const slot = shipQuote?.slots?.find((s) => s.id === slotId) || null;
  const shippingCost = (shipOption ? shipOption.price : 0) + (slot ? slot.surcharge : 0);

  /* ══ الدفع ══ */
  const [payMethods, setPayMethods] = useState([]);
  const [payGateway, setPayGateway] = useState("");

  useEffect(() => {
    fetch("/api/payments/methods")
      .then((r) => r.json())
      .then((d) => {
        setPayMethods(d.methods || []);
        setPayGateway((prev) => prev || d.methods?.[0]?.code || "");
      })
      .catch(() => {});
  }, []);

  const payableTotal = Math.max(0, cartTotal - discount) + shippingCost;

  /* ══ السلة المتروكة ══
     معرّف جلسة ثابت في localStorage: أغلب من يترك سلة لم يسجّل
     دخولًا، فالربط بالحساب وحده يفقد أكثرهم. */
  const sessionIdRef = useRef(null);
  if (typeof window !== "undefined" && !sessionIdRef.current) {
    try {
      let sid = window.localStorage.getItem("tb_sid");
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        window.localStorage.setItem("tb_sid", sid);
      }
      sessionIdRef.current = sid;
    } catch { sessionIdRef.current = "anon"; }
  }

  /**
   * يُرسل بعد سكون ٨ ثوانٍ من آخر تغيير — لا مع كل ضغطة.
   * الإرسال الفوري يسجّل كل خطوة تسوّق كأنها سلة متروكة،
   * فيمتلئ تقرير اللوحة بضجيج لا يمكن التصرّف فيه.
   */
  useEffect(() => {
    if (cartDetails.length === 0) return;
    const t = setTimeout(() => {
      const attr = resolveAttribution();
      fetch("/api/cart/abandon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          items: cartDetails.map((i) => ({ id: i.id, name: i.product.name, qty: i.qty, price: i.product.price })),
          total: cartTotal,
          name: customer.name || null,
          phone: customer.phone || null,
          source: attr?.source, campaign: attr?.campaign,
        }),
      }).catch(() => {});
    }, 8000);
    return () => clearTimeout(t);
  }, [cartDetails, cartTotal, customer.name, customer.phone]);
  const canCheckout = customer.name.trim() && customer.phone.trim() && cart.length > 0;

  const sendToWhatsApp = useCallback(async () => {
    setFormTouched(true);
    if (!(customer.name.trim() && customer.phone.trim() && cart.length > 0)) return;
    if (submitting) return;

    setSubmitting(true);
    const attr = resolveAttribution();
    trackBeginCheckout(cartDetails, cartTotal);
    const lines = cartDetails.map((i) => `• ${i.product.name} × ${i.qty} = ${formatPrice(i.product.price * i.qty)} ريال`).join("\n");
    const msg =
      `مرحبًا ${STORE.shortName} 🌿\nأرغب بإتمام الطلب التالي:\n\n${lines}\n\n` +
      (discount > 0
        ? `المجموع: ${formatPrice(cartTotal)} ريال\nالخصم (${coupon.code}): -${formatPrice(discount)} ريال\n`
        : "") +
      (shippingCost > 0
        ? `الشحن (${shipOption?.name || "التوصيل"}): ${formatPrice(shippingCost)} ريال\n`
        : shipOption?.free ? "الشحن: مجاني\n" : "") +
      (slot ? `وقت التسليم: ${slot.label}\n` : "") +
      (deliveryDate ? `تاريخ التسليم: ${deliveryDate}\n` : "") +
      `الإجمالي: ${formatPrice(payableTotal)} ريال\n\n` +
      `الاسم: ${customer.name}\nالجوال: ${customer.phone}\nالمدينة / العنوان: ${customer.city || "—"}`;

    // حفظ الطلب أولًا للحصول على رقم الطلب، ثم إدراجه في رسالة واتساب.
    // لو فشل الحفظ نكمل بلا رقم بدل حجب العميل عن إتمام طلبه.
    let orderNumber = null;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer.name,
          customerPhone: customer.phone,
          customerCity: customer.city,
          items: cartDetails.map((i) => ({ id: i.id, name: i.product.name, qty: i.qty, price: i.product.price })),
          total: payableTotal,
          couponCode: coupon?.code || null,
          sessionId: sessionIdRef.current,
          shippingMethodId: shipMethodId || null,
          deliverySlotId: slotId || null,
          deliveryDate: deliveryDate || null,
          // مصدر الزيارة التي أنتجت هذا الطلب — أساس تقارير لوحة التحكم
          source: attr?.source, medium: attr?.medium,
          campaign: attr?.campaign, landingPath: attr?.landingPath,
        }),
      });
      if (res.ok) {
        const order = await res.json();
        orderNumber = order?.orderNumber || null;
      }
    } catch {}

    const finalMsg = orderNumber ? `رقم الطلب: ${orderNumber}\n\n${msg}` : msg;

    trackPurchase(orderNumber, cartDetails, cartTotal, attr);
    setSubmitting(false);
    setConfirmation({ orderNumber, total: payableTotal, name: customer.name, link: buildWhatsAppLink(finalMsg) });
    window.open(buildWhatsAppLink(finalMsg), "_blank");
  }, [customer, cart, cartDetails, cartTotal, payableTotal, discount, coupon, submitting, shipMethodId, shipOption, shippingCost, slot, slotId, deliveryDate]);

  /** يُستدعى من شاشة التأكيد لبدء طلب جديد. */
  const closeConfirmation = useCallback(() => {
    setConfirmation(null);
    setCart([]);
    setCartOpen(false);
    setCustomer({ name: "", phone: "", city: "" });
    setFormTouched(false);
    setCoupon(null);
    setCouponError("");
  }, []);

  const buyNow = useCallback((id) => {
    addToCart(id, 1);
    setCartOpen(true);
  }, [addToCart]);

  const value = {
    cart, cartDetails, cartCount, cartTotal, cartOpen, setCartOpen,
    coupon, couponError, couponBusy, applyCoupon, clearCoupon, discount, payableTotal,
    shipQuote, shipMethodId, setShipMethodId, shipOption, shippingCost, shipBusy,
    slotId, setSlotId, slot, deliveryDate, setDeliveryDate,
    payMethods, payGateway, setPayGateway,
    addToCart, updateQty, removeItem, buyNow,
    customer, setCustomer, formTouched, setFormTouched, canCheckout, sendToWhatsApp,
    toast, submitting, confirmation, closeConfirmation,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
