/**
 * التحقّق من جلسة المسؤول داخل صفحات المتجر.
 *
 * يُستعمل لمعاينة المسودّات: الصفحة غير المنشورة تُعرض للمسؤول
 * وتُعطي ٤٠٤ لغيره. نعيد استخدام مصادقة النواة نفسها ولا نُنشئ
 * آلية ثانية.
 */
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "./auth.js";

export async function getCurrentAdmin() {
  try {
    const token = cookies().get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
