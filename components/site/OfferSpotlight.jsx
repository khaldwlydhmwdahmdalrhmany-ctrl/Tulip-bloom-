"use client";
import React from "react";
import Link from "next/link";
import { Zap, ShoppingCart, Truck, Wrench, Flame } from "lucide-react";
import { C, G, formatPrice, discountPercent } from "../../lib/colors.js";
import BuyNowButton from "./BuyNowButton.jsx";
import ProductVisual from "./ProductVisual.jsx";
import Rating from "./Rating.jsx";
import StockBadge from "./StockBadge.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { CARD_LABELS } from "../../config/content.config.js";

/**
 * صفقة الصدارة — أكبر توفير فعلي بالريال (لا بالنسبة المئوية فقط).
 * النسبة وحدها مضلّلة: خصم 50% على 100 ريال أقل قيمة من خصم 20% على 2000.
 */
export default function OfferSpotlight({ product }) {
  const { addToCart } = useCart();
  if (!product) return null;

  const off = discountPercent(product.price, product.oldPrice);
  const saved = Math.round(product.oldPrice - product.price);
  const soldOut = product.stock === "out_of_stock";

  return (
    <div className="relative rounded-3xl overflow-hidden" style={{ background: G.deep }}>
      <span className="absolute -top-28 -left-20 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: C.teal }} />
      <span className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: C.mint }} />

      <div className="relative grid lg:grid-cols-2 gap-8 p-6 sm:p-10 items-center">
        {/* الصورة */}
        <Link href={`/product/${product.id}`} className="zoom-wrap rounded-2xl overflow-hidden block" style={{ background: "#fff" }}>
          <ProductVisual product={product} heightClass="h-64 sm:h-80" />
        </Link>

        {/* التفاصيل */}
        <div className="flex flex-col gap-4">
          <span className="inline-flex items-center gap-1.5 w-fit text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: C.danger, color: "#fff" }}>
            <Flame size={13} /> أكبر توفير هذا الأسبوع
          </span>

          <Link href={`/product/${product.id}`}>
            <h3 className="h-section font-display leading-tight" style={{ color: "#fff" }}>
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <Rating rating={product.rating} reviewCount={product.reviewCount} size={15} />
            <StockBadge stock={product.stock} size="md" />
          </div>

          {/* مبلغ التوفير هو البطل، لا السعر */}
          <div className="flex flex-wrap items-end gap-x-5 gap-y-2 pt-1">
            <div className="flex flex-col">
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,.6)" }}>السعر بعد الخصم</span>
              <span className="font-display text-4xl leading-none" style={{ color: "#fff" }}>
                {formatPrice(product.price)} <span className="text-base font-normal">ر.س</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,.6)" }}>بدلًا من</span>
              <span className="text-lg line-through font-semibold" style={{ color: "#FF8A8A" }}>
                {formatPrice(product.oldPrice)} ر.س
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-fit px-4 py-2.5 rounded-2xl" style={{ background: "rgba(169,226,189,.16)", border: `1px solid ${C.mint}44` }}>
            <span className="font-display text-xl" style={{ color: C.mint }}>توفّر {formatPrice(saved)} ر.س</span>
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: C.mint, color: C.navyDeep }}>−{off}%</span>
          </div>

          {(product.freeShipping || product.freeInstall) && (
            <div className="flex flex-wrap gap-2">
              {product.freeShipping && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>
                  <Truck size={12} /> {CARD_LABELS.freeShipping}
                </span>
              )}
              {product.freeInstall && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>
                  <Wrench size={12} /> {CARD_LABELS.freeInstall}
                </span>
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 mt-1">
            <button
              onClick={() => addToCart(product.id)}
              disabled={soldOut}
              className="btn py-3.5 text-sm"
              style={{ background: "#fff", color: C.navy }}
            >
              <ShoppingCart size={16} /> أضف إلى السلة
            </button>
            <BuyNowButton
              product={product}
              disabled={soldOut}
              label="اطلبه الآن"
              className="py-3.5 text-sm"
              style={{ background: soldOut ? "rgba(255,255,255,.15)" : "#25D366", color: "#fff" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
