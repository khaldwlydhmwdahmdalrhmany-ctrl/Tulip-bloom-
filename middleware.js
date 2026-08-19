import { NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "./lib/auth.js";

/**
 * حماية لوحة التحكم ومسارات الكتابة.
 *
 * قبل هذا التعديل كان الـ matcher يغطي `/admin` فقط، بينما مسارات `/api`
 * مفتوحة بلا أي تحقّق — أي زائر يعرف رابط الموقع كان يستطيع تنفيذ
 * `DELETE /api/products/{id}` أو `PUT /api/settings` مباشرة.
 *
 * القاعدة الآن: كل `/api` محمي إلا ما يحتاجه الزائر فعلًا:
 *   • POST /api/orders  — إنشاء طلب من السلة أو نموذج الفني
 *   • POST /api/track   — تسجيل زيارة
 *   • POST /api/admin/login — تسجيل الدخول نفسه
 */

const PUBLIC_API = [
  { path: "/api/orders", methods: ["POST"] },
  { path: "/api/track", methods: ["POST"] },
  // البحث عام: يقرأ منتجات منشورة فقط ولا يكشف شيئًا خاصًّا
  { path: "/api/search", methods: ["GET"] },
  // التسويق: كلاهما يتحقّق داخليًا ولا يكشف بيانات خاصة
  { path: "/api/coupons/validate", methods: ["POST"] },
  { path: "/api/cart/abandon", methods: ["POST"] },
  // خيارات الشحن: تحتاجها السلة قبل تسجيل الدخول، والأسعار تُقرأ من القاعدة
  { path: "/api/shipping/quote", methods: ["POST"] },
  { path: "/api/admin/login", methods: ["POST"] },
  { path: "/api/admin/logout", methods: ["POST"] },
];

/**
 * مسارات حساب العميل.
 *
 * "عام" هنا يعني: لا تتطلب جلسة **مسؤول**. لكنها ليست مفتوحة —
 * كل مسار منها يتحقّق من جلسة العميل بنفسه عبر
 * `getCurrentCustomer()` ويردّ 401 بدونها.
 *
 * السبب في عدم التحقّق هنا: الـ middleware يعمل على Edge Runtime
 * بلا وصول لقاعدة البيانات، وجلسات العملاء مخزّنة في القاعدة
 * لتكون قابلة للإبطال. التحقّق يجري في طبقة Node.
 */
const CUSTOMER_API_PREFIX = "/api/account/";

function isPublic(pathname, method) {
  if (pathname.startsWith(CUSTOMER_API_PREFIX)) return true;
  return PUBLIC_API.some(
    (r) => pathname === r.path && r.methods.includes(method)
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // ═══ مسارات API ═══
  if (pathname.startsWith("/api/")) {
    if (isPublic(pathname, method)) return NextResponse.next();

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: "غير مصرّح — سجّل الدخول إلى لوحة التحكم" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // ═══ صفحات لوحة التحكم ═══
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = await verifySessionToken(token);
    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  /**
   * ⭐ حقن المسار كترويسة.
   *
   * مكوّنات الخادم لا تعرف المسار الحالي في Next 14، و`x-invoke-path`
   * ترويسة داخلية غير مضمونة في وقت التشغيل. صفحة ٤٠٤ تحتاج المسار
   * لتبحث عن تحويل مطابق، فنحقنه هنا.
   *
   * الـmiddleware يعمل على Edge بلا وصول للقاعدة — لذلك يضع الترويسة
   * فقط، والبحث في القاعدة يجري في طبقة Node داخل `not-found.jsx`.
   */
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  /**
   * ⚠️ وُسّع من ["/admin/:path*", "/api/:path*"] ليشمل كل المسارات.
   *
   * السبب: صفحة ٤٠٤ تحتاج ترويسة `x-pathname` لتنفيذ التحويلات،
   * وهي تُحقن هنا. الاستثناءات تمنع المرور على الملفات الثابتة
   * والصور — لا فائدة من تشغيل الـmiddleware عليها، والمرور
   * يضيف زمنًا على كل أصل.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|images/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|txt|xml|csv)$).*)",
  ],
};
