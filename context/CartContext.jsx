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
      `مرحبًا {STORE.shortName} 🌿\nأرغب بإتمام الطلب التالي:\n\n${lines}\n\n` +
      `الإجمالي: ${formatPrice(cartTotal)} ريال\n\n` +
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
          total: cartTotal,
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
    setConfirmation({ orderNumber, total: cartTotal, name: customer.name, link: buildWhatsAppLink(finalMsg) });
    window.open(buildWhatsAppLink(finalMsg), "_blank");
  }, [customer, cart, cartDetails, cartTotal, submitting]);

  /** يُستدعى من شاشة التأكيد لبدء طلب جديد. */
  const closeConfirmation = useCallback(() => {
    setConfirmation(null);
    setCart([]);
    setCartOpen(false);
    setCustomer({ name: "", phone: "", city: "" });
    setFormTouched(false);
  }, []);

  const buyNow = useCallback((id) => {
    addToCart(id, 1);
    setCartOpen(true);
  }, [addToCart]);

  const value = {
    cart, cartDetails, cartCount, cartTotal, cartOpen, setCartOpen,
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
