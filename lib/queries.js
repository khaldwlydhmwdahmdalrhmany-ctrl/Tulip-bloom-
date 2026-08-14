import {
  getCategories as _getCategories,
  getCategoryBySlug as _getCategoryBySlug,
  getProducts as _getProducts,
  getProductById as _getProductById,
  getProductIndex as _getProductIndex,
  getBanners as _getBanners,
  getSettings as _getSettings,
  getSitemapData as _getSitemapData,
  getLegalPages as _getLegalPages,
  getLegalPage as _getLegalPage,
} from "./db.js";
import { cached, TAGS } from "./cache.js";

/**
 * قراءات الواجهة العامة — مغلّفة بتخزين مؤقت موسوم.
 * لوحة التحكم تستورد من `db.js` مباشرة لتقرأ دائمًا أحدث نسخة.
 */

export const getCategories = cached(
  () => _getCategories(), ["categories"], [TAGS.categories]
);

export const getCategoryBySlug = (slug) =>
  cached((s) => _getCategoryBySlug(s), ["category", slug], [TAGS.categories])(slug);

export const getProducts = (opts = {}) =>
  cached((o) => _getProducts(o), ["products", opts.categorySlug || "all"], [TAGS.products])(opts);

export const getProductById = (id) =>
  cached((i) => _getProductById(i), ["product", id], [TAGS.products])(id);

export const getProductIndex = cached(
  () => _getProductIndex(), ["product-index"], [TAGS.products]
);

export const getBanners = (opts = {}) =>
  cached((o) => _getBanners(o), ["banners", opts.placement || "all"], [TAGS.banners])(opts);

export const getSettings = cached(
  () => _getSettings(), ["settings"], [TAGS.settings]
);

export const getSitemapData = cached(
  () => _getSitemapData(), ["sitemap"], [TAGS.products, TAGS.categories], 1800
);


export const getLegalPages = cached(
  () => _getLegalPages(), ["legal-pages"], [TAGS.settings], 600
);

export const getLegalPage = (slug) =>
  cached((s) => _getLegalPage(s), ["legal-page", slug], [TAGS.settings], 600)(slug);
