import { NextResponse } from "next/server";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";
import { publicCustomer, hashPassword, verifyPassword, validatePassword } from "../../../../lib/customerAuth.js";
import { updateCustomerProfile, setCustomerPassword } from "../../../../lib/customerDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentCustomer();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });
  return NextResponse.json({ customer: publicCustomer(me) });
}

export async function PUT(request) {
  const me = await getCurrentCustomer();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  // تغيير كلمة المرور يتطلب الحالية — يمنع من استولى على جهاز
  // مفتوح من قفل صاحب الحساب خارج حسابه.
  if (body.newPassword) {
    if (!verifyPassword(String(body.currentPassword || ""), me.passwordHash)) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة." }, { status: 400 });
    }
    const err = validatePassword(body.newPassword);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    await setCustomerPassword(me.id, hashPassword(body.newPassword));
    // كل الجلسات أُبطلت — بما فيها هذه
    return NextResponse.json({ ok: true, reauth: true });
  }

  const updated = await updateCustomerProfile(me.id, {
    name: String(body.name || "").trim(),
    phone: String(body.phone || "").trim(),
    marketingOptIn: !!body.marketingOptIn,
  });
  return NextResponse.json({ customer: publicCustomer(updated) });
}
