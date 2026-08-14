"use client";
import React from "react";
import Link from "next/link";
import { ShoppingCart, Truck, Wrench, Zap, Check } from "lucide-react";
import { C, SH, formatPrice, isQuoteProduct } from "../../lib/colors.js";
import BuyNowButton from "./BuyNowButton.jsx";
import ProductVisual from "./ProductVisual.jsx";
import Rating from "./Rating.jsx";
import StockBadge from "./StockBadge.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { CARD_LABELS } from "../../config/content.config.js";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = React.useState(false);

  const handleAdd = () => {
    addToCart(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const byQuote = isQuoteProduct(product);
  const soldOut = product.stock === "out_of_stock";

  return (
    <article
      className="lift group flex flex-col rounded-2xl overflow-hidden h-full"
      style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: SH.sm }}
    >
      <Link href={`/product/${product.id}`} className="zoom-wrap block relative">
        <ProductVisual product={product} />
        {soldOut && (
          <span
            className="absolute inset-0 flex items-center justify-center text-sm font-bold"
            style={{ background: "rgba(255,255,255,.72)", color: C.danger }}
          >
            غير متوفر حاليًا
          </span>
        )}
      </Link>

      <div className="p-2.5 sm:p-4 flex flex-col gap-1.5 sm:gap-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold truncate" style={{ color: product.category?.color || C.navy }}>
            {product.category?.name}
          </span>
          {product.brand && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: C.offWhite, color: C.slate }}>
              {product.brand}
            </span>
          )}
        </div>

        <Link href={`/product/${product.id}`}>
          <h3 className="font-bold text-sm leading-snug line-clamp-2" style={{ color: C.ink }}>
            {product.name}
          </h3>
        </Link>

        <Rating rating={product.rating} reviewCount={product.reviewCount} />

        <p className="text-xs leading-relaxed line-clamp-2 flex-1" style={{ color: C.slate }}>
          {product.description}
        </p>

        {(product.freeShipping || product.freeInstall) && (
          <div className="flex flex-wrap gap-1.5">
            {product.freeShipping && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: C.mintTint, color: C.navy }}>
                <Truck size={11} /> {CARD_LABELS.freeShipping}
              </span>
            )}
            {product.freeInstall && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: C.mintTint, color: C.navy }}>
                <Wrench size={11} /> {CARD_LABELS.freeInstall}
              </span>
            )}
          </div>
        )}

        <div className="flex items-end justify-between gap-2 mt-1">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-[11px] line-through font-semibold" style={{ color: C.oldPrice }}>
                {formatPrice(product.oldPrice)} ر.س
              </span>
            )}
            {byQuote ? (
              <span className="font-bold text-[13px] leading-tight" style={{ color: C.teal }}>
                السعر حسب المواصفات
              </span>
            ) : (
              <span className="font-display text-base sm:text-lg leading-none" style={{ color: C.navy }}>
                {formatPrice(product.price)} <span className="text-[11px] font-normal">ر.س</span>
              </span>
            )}
          </div>
          <StockBadge stock={product.stock} />
        </div>

        {/* زرّا الشراء — زر السلة مربّع صغير، والشراء يأخذ بقية العرض */}
        <div className="flex gap-1.5 mt-1.5">
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className="btn shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl"
            style={{
              background: added ? C.success : C.mintTint,
              color: added ? "#fff" : C.navy,
              padding: 0,
            }}
            aria-label={`أضف ${product.name} إلى السلة`}
            title="أضف إلى السلة"
          >
            {added ? <Check size={15} className="pop-in" /> : <ShoppingCart size={15} />}
          </button>

          <BuyNowButton
            product={product}
            disabled={soldOut}
            className="flex-1 h-9 sm:h-10 rounded-xl text-[11px] sm:text-xs"
            style={{
              background: soldOut ? C.lineSoft : C.navy,
              color: soldOut ? C.slateLight : "#fff",
              padding: 0,
            }}
          />
        </div>
      </div>
    </article>
  );
}
