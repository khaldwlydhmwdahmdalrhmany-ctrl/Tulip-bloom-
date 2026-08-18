import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentCustomer } from "../../../lib/customerSession.js";
import AccountNav from "../../../components/site/AccountNav.jsx";
import { C } from "../../../lib/colors.js";
import { publicCustomer } from "../../../lib/customerAuth.js";

export const dynamic = "force-dynamic";

/**
 * حارس صفحات الحساب.
 *
 * ⚠️ الحماية هنا لا في middleware: الـ middleware يعمل على Edge
 * Runtime بلا وصول لقاعدة البيانات، وجلسات العملاء مخزّنة في
 * القاعدة لتكون قابلة للإبطال (حظر، تغيير كلمة مرور، خروج من
 * كل الأجهزة). هذا Layout يعمل على Node فيصل للقاعدة.
 */
export default async function AccountLayout({ children }) {
  const path = headers().get("x-invoke-path") || "";
  const isAuthPage = path.includes("/login") || path.includes("/register");

  const me = await getCurrentCustomer();

  // صفحتا الدخول والتسجيل تُعرضان بلا حارس
  if (!me) {
    return <>{children}</>;
  }

  return (
    <div style={{ background: C.offWhite }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 section-y">
        <div className="grid lg:grid-cols-[240px_1fr] gap-6 lg:gap-8 items-start">
          <AccountNav customer={publicCustomer(me)} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
