import { NextResponse } from "next/server";
import {
  hashPassword, validatePassword, normalizeEmail, isValidEmail,
  generateToken, hashToken, sessionExpiry, cookieOptions, CUSTOMER_COOKIE, publicCustomer,
} from "../../../../lib/customerAuth.js";
import { findCustomerByEmail, createCustomer, createSession } from "../../../../lib/customerDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 }); }

  const email = normalizeEmail(body.email);
  const { password, name, phone, marketingOptIn } = body;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "أدخل بريدًا إلكترونيًا صحيحًا." }, { status: 400 });
  }
  const pwError = validatePassword(password);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });
  if (!String(name || "").trim()) {
    return NextResponse.json({ error: "الاسم مطلوب." }, { status: 400 });
  }

  const existing = await findCustomerByEmail(email);
  if (existing) {
    /**
     * ⚠️ عمدًا: رسالة عامة لا تؤكّد أن البريد مسجّل.
     * التأكيد يحوّل النموذج إلى أداة تعداد حسابات — يجرّب
     * المهاجم قائمة بريد ويعرف أيها عميل لديك.
     */
    return NextResponse.json(
      { error: "تعذّر إنشاء حساب بهذا البريد. جرّب تسجيل الدخول أو استخدم بريدًا آخر." },
      { status: 409 }
    );
  }

  const customer = await createCustomer({
    email,
    passwordHash: hashPassword(password),
    name: String(name).trim(),
    phone: String(phone || "").trim() || null,
    marketingOptIn: !!marketingOptIn,
  });

  const token = generateToken();
  await createSession({
    tokenHash: hashToken(token),
    customerId: customer.id,
    userAgent: request.headers.get("user-agent") || "",
    expiresAt: sessionExpiry(),
  });

  const res = NextResponse.json({ customer: publicCustomer(customer) }, { status: 201 });
  res.cookies.set(CUSTOMER_COOKIE, token, cookieOptions());
  return res;
}
