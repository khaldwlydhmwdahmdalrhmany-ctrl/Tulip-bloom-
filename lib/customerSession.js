/**
 * قراءة جلسة العميل من الكوكي — للمكوّنات الخادمة ومسارات API.
 * Node runtime فقط (يستعمل node:crypto عبر customerAuth).
 */
import { cookies } from "next/headers";
import { CUSTOMER_COOKIE, hashToken } from "./customerAuth.js";
import { customerBySessionToken } from "./customerDb.js";

/** يُرجع صف العميل الخام (فيه passwordHash) — لا تمرّره للمتصفح. */
export async function getCurrentCustomer() {
  try {
    const token = cookies().get(CUSTOMER_COOKIE)?.value;
    if (!token) return null;
    return await customerBySessionToken(hashToken(token));
  } catch {
    return null;
  }
}
