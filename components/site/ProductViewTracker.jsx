"use client";
import { useEffect } from "react";
import { trackViewItem } from "../../lib/analytics.js";

/**
 * يدفع حدث view_item عند فتح صفحة المنتج.
 * مكوّن منفصل لأن صفحة المنتج تعمل على الخادم، وهذا الحدث يحتاج المتصفح.
 */
export default function ProductViewTracker({ product }) {
  useEffect(() => {
    if (product) trackViewItem(product);
  }, [product?.id]);
  return null;
}
