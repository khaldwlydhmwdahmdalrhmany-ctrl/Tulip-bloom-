import React from "react";
import { getBanners, getCategories, getProducts } from "../../../lib/queries.js";
import { C } from "../../../lib/colors.js";
import PageHero from "../../../components/site/PageHero.jsx";
import { pickBanner } from "../../../lib/banners.js";
import TrustStrip from "../../../components/site/TrustStrip.jsx";
import ProductBrowser from "../../../components/site/ProductBrowser.jsx";
import CtaBand from "../../../components/site/CtaBand.jsx";
import { SHOP_PAGE } from "../../../config/content.config.js";

export default async function ShopPage() {
  const pageBanner = pickBanner(await getBanners({ placement: "shop" }));

  const [categories, products] = await Promise.all([getCategories(), getProducts()]);

  return (
    <div>
      <PageHero
        imageUrl={pageBanner?.imageUrl}
        ratio={pageBanner?.ratio}
        bannerCta={pageBanner?.ctaHref ? { label: pageBanner.ctaLabel, href: pageBanner.ctaHref } : undefined}
        title={SHOP_PAGE.title}
        subtitle={SHOP_PAGE.subtitle}
        icon="Package"
        color={C.navy}
        count={products.length}
      />

      <TrustStrip />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <ProductBrowser categories={categories} products={products} activeCatSlug={null} />
      </section>

      <CtaBand
        eyebrow={SHOP_PAGE.cta.eyebrow}
        title={SHOP_PAGE.cta.title}
        desc={SHOP_PAGE.cta.desc}
        primaryLabel={SHOP_PAGE.cta.primaryLabel}
        primaryHref={SHOP_PAGE.cta.primaryHref}
      />
    </div>
  );
}
