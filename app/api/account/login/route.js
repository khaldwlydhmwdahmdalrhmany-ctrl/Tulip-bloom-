import { NextResponse } from "next/server";
import {
  verifyPassword, normalizeEmail, generateToken, hashToken, sessionExpiry,
  cookieOptions, CUSTOMER_COOKIE, publicCustomer, isLocked, lockUntil,
  MAX_ATTEMPTS, LOCK_MINUTES,
} from "../../../../lib/customerAuth.js";
import {
  findCustomerByEmail, createSession, recordLoginSuccess, recordLoginFailure,
} from "../../../../lib/customerDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** رسالة واحدة لكل حالات الفشل — لا تكشف أي بريد مسجّل. */
const GENERIC = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 }); }

  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!email || !password) return NextResponse.json({ error: GENERIC }, { status: 401 });

  const customer = await findCustomerByEmail(email);

  if (!customer) {
    /**
     * ⚠️ تجزئة وهمية عمدًا.
     * الرد الفوري عند بريد غير مسجّل مقابل تأخّر scrypt عند بريد
     * مسجّل يكشف الفرق بالتوقيت وحده. نصرف زمنًا مشابهًا.
     */
    verifyPassword(password, `scrypt$32768$8$1$${Buffer.alloc(16).toString("base64")}$${Buffer.alloc(64).toString("base64")}`);
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  if (customer.status === "blocked") {
    return NextResponse.json({ error: "هذا الحساب موقوف. تواصل معنا لمعرفة السبب." }, { status: 403 });
  }

  if (isLocked(customer)) {
    return NextResponse.json(
      { error: `محاولات كثيرة خاطئة. حاول بعد ${LOCK_MINUTES} دقيقة.` },
      { status: 429 }
    );
  }

  if (!verifyPassword(password, customer.passwordHash)) {
    const attempts = Number(customer.failedAttempts || 0) + 1;
    await recordLoginFailure(customer.id, attempts, attempts >= MAX_ATTEMPTS ? lockUntil() : null);
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const token = generateToken();
  await createSession({
    tokenHash: hashToken(token),
    customerId: customer.id,
    userAgent: request.headers.get("user-agent") || "",
    expiresAt: sessionExpiry(),
  });
  await recordLoginSuccess(customer.id);

  const res = NextResponse.json({ customer: publicCustomer(customer) });
  res.cookies.set(CUSTOMER_COOKIE, token, cookieOptions());
  return res;
}
