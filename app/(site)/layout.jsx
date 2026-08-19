import React from "react";
import { getCategories, getProductIndex, getSettings, getLegalPages } from "../../lib/queries.js";
import { navPages } from "../../lib/pagesDb.js";
import { activeNav } from "../../lib/navDb.js";
import { CartProvider } from "../../context/CartContext.jsx";
import { FavoritesProvider } from "../../context/FavoritesContext.jsx";
import Ticker, { AnnouncementBar } from "../../components/site/Ticker.jsx";
import Header from "../../components/site/Header.jsx";
import Footer from "../../components/site/Footer.jsx";
import CartDrawer from "../../components/site/CartDrawer.jsx";
import VisitTracker from "../../components/site/VisitTracker.jsx";

export default async function SiteLayout({ children }) {
  // فهرس خفيف بدل كل المنتجات: السلة تحتاج الاسم والسعر والصورة فقط.
  // الفرق عند 500 منتج بمئات الكيلوبايتات في كل تنقّل.
  const [categories, productIndex, settings, legalPages, customPages, headerNav, footerNav] = await Promise.all([
    getCategories(),
    getProductIndex(),
    getSettings().catch(() => ({})),   // الإعدادات ليست حرجة — لا نُسقط الصفحة إن فشلت
    getLegalPages().catch(() => []),
    navPages().catch(() => []),   // صفحات مخصّصة منشورة
    activeNav("header").catch(() => []),
    activeNav("footer").catch(() => []),
  ]);

  return (
    <CartProvider allProducts={productIndex}>
      <FavoritesProvider>
      <AnnouncementBar settings={settings} />
      <Ticker settings={settings} />
      <Header categories={categories} settings={settings} customPages={customPages} navItems={headerNav} />
      <main>{children}</main>
      <Footer settings={settings} legalPages={legalPages} customPages={customPages} navItems={footerNav} />
      <CartDrawer />
      <VisitTracker />
      </FavoritesProvider>
    </CartProvider>
  );
}
