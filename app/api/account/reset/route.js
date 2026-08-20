import { NextResponse } from "next/server";
import { consumePasswordReset, setCustomerPassword } from "../../../../lib/customerDb.js";
import { hashToken, hashPassword, validatePassword } from "../../../../lib/customerAuth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * إتمام إعادة تعيين كلمة المرور.
 *
 * ⚠️ الرمز يُستهلك مرة واحدة (`consumePasswordReset` يعلّمه
 * مستخدَمًا داخل نفس الاستدعاء)، وتغيير كلمة المرور يُبطل كل
 * الجلسات — فلو كان الحساب مخترقًا يُطرد المهاجم فورًا.
 */
export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const token = String(b.token || "").trim();
  const password = String(b.password || "");

  if (!token) return NextResponse.json({ error: "الرابط غير صالح." }, { status: 400 });

  const err = validatePassword(password);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const row = await consumePasswordReset(hashToken(token));
  // رسالة موحّدة: لا نفرّق بين رمز خاطئ ومنتهٍ ومستخدَم
  if (!row) return NextResponse.json({ error: "الرابط غير صالح أو انتهت صلاحيته." }, { status: 400 });

  await setCustomerPassword(row.customerId, hashPassword(password));
  return NextResponse.json({ ok: true });
}
