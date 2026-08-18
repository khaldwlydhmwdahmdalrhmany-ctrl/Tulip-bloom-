import { NextResponse } from "next/server";
import { setCustomerStatus, createPasswordReset, findCustomerById } from "../../../../lib/customerDb.js";
import { generateToken, hashToken } from "../../../../lib/customerAuth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * إجراءات المسؤول على حسابات العملاء.
 *
 * ⚠️ هذا المسار محمي بالفعل عبر middleware — كل `/api` يتطلب
 * جلسة مسؤول إلا القائمة البيضاء، وهذا ليس منها.
 */
export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const { action, customerId } = b;
  if (!customerId) return NextResponse.json({ error: "معرّف العميل مطلوب." }, { status: 400 });

  const customer = await findCustomerById(customerId);
  if (!customer) return NextResponse.json({ error: "العميل غير موجود." }, { status: 404 });

  if (action === "block" || action === "unblock") {
    // الحظر يحذف كل جلسات العميل فورًا — لا ينتظر انتهاءها
    await setCustomerStatus(customerId, action === "block" ? "blocked" : "active");
    return NextResponse.json({ ok: true, status: action === "block" ? "blocked" : "active" });
  }

  if (action === "reset-link") {
    /**
     * حل مؤقّت حتى يُضاف مزوّد بريد.
     * الرمز صالح ساعة واحدة ومرة واحدة، ويُخزَّن مجزّأً.
     * انسخ الرابط وأرسله للعميل على واتساب.
     */
    const token = generateToken();
    await createPasswordReset(customerId, hashToken(token), new Date(Date.now() + 60 * 60 * 1000));
    const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    return NextResponse.json({ ok: true, url: `${base}/account/reset?token=${token}`, expiresInMinutes: 60 });
  }

  return NextResponse.json({ error: "إجراء غير معروف." }, { status: 400 });
}
