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
  { path: "/api/admin/login", methods: ["POST"] },
  { path: "/api/admin/logout", methods: ["POST"] },
];

function isPublic(pathname, method) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
