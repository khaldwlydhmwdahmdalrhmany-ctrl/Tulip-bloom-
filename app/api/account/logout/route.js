import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE, hashToken, cookieOptions } from "../../../../lib/customerAuth.js";
import { destroySession } from "../../../../lib/customerDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const token = request.cookies.get(CUSTOMER_COOKIE)?.value;
  // تُحذف من القاعدة أيضًا — مسح الكوكي وحده يترك الرمز صالحًا
  if (token) await destroySession(hashToken(token)).catch(() => {});
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CUSTOMER_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
  return res;
}
