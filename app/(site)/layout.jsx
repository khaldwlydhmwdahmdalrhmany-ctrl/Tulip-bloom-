import React from "react";
import { getCategories, getProductIndex, getSettings, getLegalPages } from "../../lib/queries.js";
import { CartProvider } from "../../context/CartContext.jsx";
import Ticker, { AnnouncementBar } from "../../components/site/Ticker.jsx";
import Header from "../../components/site/Header.jsx";
import Footer from "../../components/site/Footer.jsx";
import CartDrawer from "../../components/site/CartDrawer.jsx";
import VisitTracker from "../../components/site/VisitTracker.jsx";

export default async function SiteLayout({ children }) {
  // فهرس خفيف بدل كل المنتجات: السلة تحتاج الاسم والسعر والصورة فقط.
  // الفرق عند 500 منتج بمئات الكيلوبايتات في كل تنقّل.
  const [categories, productIndex, settings, legalPages] = await Promise.all([
    getCategories(),
    getProductIndex(),
    getSettings().catch(() => ({})),   // الإعدادات ليست حرجة — لا نُسقط الصفحة إن فشلت
    getLegalPages().catch(() => []),
  ]);

  return (
    <CartProvider allProducts={productIndex}>
      <AnnouncementBar settings={settings} />
      <Ticker settings={settings} />
      <Header categories={categories} settings={settings} />
      <main>{children}</main>
      <Footer settings={settings} legalPages={legalPages} />
      <CartDrawer />
      <VisitTracker />
    </CartProvider>
  );
}
