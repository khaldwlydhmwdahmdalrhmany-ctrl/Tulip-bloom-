const raw = (process.env.DATABASE_URL || "").trim();
const isPostgres = raw.startsWith("postgres");

/**
 * تحذير صريح عند رابط اتصال خاطئ.
 * سابقًا كان أي نص لا يبدأ بـ postgres يُسقط التطبيق بصمت إلى SQLite فارغة،
 * فيظهر الموقع خاليًا من المنتجات بلا أي رسالة تشرح السبب.
 */
if (!isPostgres && raw && !raw.startsWith("file:")) {
  console.error(
    "[db] ⚠️ قيمة DATABASE_URL لا تبدأ بـ postgres:// — " +
    "يجب أن تكون رابط الاتصال الكامل لا كلمة المرور وحدها. " +
    "التطبيق سيعمل على قاعدة محلية فارغة."
  );
}

const impl = isPostgres ? await import("./db.pg.js") : await import("./db.sqlite.js");

export const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getProductIndex,
  getSitemapData,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  countProducts,
  countCategories,
  countOrders,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getSettings,
  getLegalPages,
  getAllLegalPages,
  getLegalPage,
  updateLegalPage,
  saveSettings,
  recordVisit,
  getAnalytics,
  ORDER_STATUSES,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = impl;
