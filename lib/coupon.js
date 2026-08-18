/**
 * ═══════════════════════════════════════════════════════════
 *  منطق الكوبونات — دوال خالصة
 * ═══════════════════════════════════════════════════════════
 *
 *  ⚠️ قاعدة أمنية تحكم هذا الملف كله:
 *  المتصفح يستدعي `evaluateCoupon` للعرض الفوري فقط. الخادم
 *  يعيد استدعاءها عند إنشاء الطلب ويتجاهل أي مبلغ خصم يرسله
 *  العميل. من يعدّل الطلب من أدوات المطوّر لن يحصل على شيء.
 */

import { STORE } from "../config/store.config.js";

/** التطبيع: الأكواد غير حسّاسة لحالة الأحرف ولا للمسافات. */
export function normalizeCode(code) {
  return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
}

export const COUPON_TYPES = [
  { key: "percent", label: "نسبة مئوية", suffix: "٪" },
  { key: "fixed", label: "مبلغ ثابت", suffix: "ر.س" },
  { key: "free_shipping", label: "شحن مجاني", suffix: "" },
];

const toDate = (v) => (v ? new Date(v) : null);
const truthy = (v) => v === true || v === 1 || v === "1";

/**
 * يتحقّق من كوبون ويحسب أثره.
 *
 * @param {object} coupon        صفّ الكوبون من القاعدة
 * @param {object} ctx
 * @param {number} ctx.subtotal  مجموع المنتجات قبل الشحن
 * @param {Array}  ctx.items     [{ id, qty, price, categorySlug }]
 * @param {number} ctx.customerUses  مرات استخدام هذا العميل للكود
 * @returns {{ ok:boolean, error?:string, discount:number, freeShipping:boolean, label:string }}
 */
export function evaluateCoupon(coupon, { subtotal = 0, items = [], customerUses = 0 } = {}) {
  const fail = (error) => ({ ok: false, error, discount: 0, freeShipping: false, label: "" });

  if (!coupon) return fail("هذا الكود غير صحيح.");
  if (!truthy(coupon.active)) return fail("هذا الكود غير مفعّل.");

  const now = Date.now();
  const starts = toDate(coupon.startsAt);
  const ends = toDate(coupon.endsAt);
  if (starts && now < starts.getTime()) return fail("هذا الكود لم يبدأ بعد.");
  if (ends && now > ends.getTime()) return fail("انتهت صلاحية هذا الكود.");

  const maxUses = Number(coupon.maxUses || 0);
  if (maxUses > 0 && Number(coupon.usedCount || 0) >= maxUses) {
    return fail("استُنفد هذا الكود.");
  }

  const perLimit = Number(coupon.perCustomerLimit || 0);
  if (perLimit > 0 && customerUses >= perLimit) {
    return fail("استخدمت هذا الكود من قبل.");
  }

  const minOrder = Number(coupon.minOrder || 0);
  if (minOrder > 0 && subtotal < minOrder) {
    return fail(`هذا الكود يبدأ من ${minOrder} ${STORE.currencyLabel}.`);
  }

  /**
   * التقييد بتصنيف: الخصم يُحتسب على المنتجات المؤهَّلة وحدها.
   * لو خصمنا من الإجمالي كله لصار «خصم ٢٠٪ على النباتات» خصمًا
   * على الباقات أيضًا متى وُجدت نبتة واحدة في السلة.
   */
  let eligible = subtotal;
  if (coupon.categorySlug) {
    eligible = items
      .filter((i) => i.categorySlug === coupon.categorySlug)
      .reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 1), 0);
    if (eligible <= 0) return fail("هذا الكود يخصّ قسمًا آخر.");
  }

  const value = Number(coupon.value || 0);

  if (coupon.type === "free_shipping") {
    return {
      ok: true, discount: 0, freeShipping: true,
      label: "شحن مجاني",
    };
  }

  let discount = coupon.type === "percent"
    ? Math.round(eligible * (value / 100))
    : Math.round(value);

  // الخصم لا يتجاوز المؤهَّل أبدًا — وإلا صار الإجمالي سالبًا
  discount = Math.max(0, Math.min(discount, Math.round(eligible)));

  if (discount <= 0) return fail("هذا الكود لا ينطبق على سلتك.");

  return {
    ok: true,
    discount,
    freeShipping: false,
    label: coupon.type === "percent" ? `خصم ${value}٪` : `خصم ${discount} ${STORE.currencyLabel}`,
  };
}

/**
 * حساب الإجمالي النهائي.
 * الشحن يُحتسب بعد الخصم: لو خفض الخصم السلة تحت حد الشحن
 * المجاني فلا شحن مجاني — وإلا استُغل الكود للحصول على الاثنين.
 */
export function computeTotals({ subtotal = 0, discount = 0, freeShipping = false }) {
  const afterDiscount = Math.max(0, subtotal - discount);
  const threshold = Number(STORE.freeShippingThreshold || 0);
  const baseShipping = Number(STORE.defaultShippingCost || 0);

  const shipping = freeShipping || (threshold > 0 && afterDiscount >= threshold) ? 0 : baseShipping;

  return {
    subtotal: Math.round(subtotal),
    discount: Math.round(discount),
    shipping: Math.round(shipping),
    total: Math.round(afterDiscount + shipping),
  };
}
