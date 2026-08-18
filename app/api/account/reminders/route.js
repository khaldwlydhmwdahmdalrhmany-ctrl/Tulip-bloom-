import { NextResponse } from "next/server";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";
import { listReminders, createReminder, deleteReminder } from "../../../../lib/customerDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentCustomer();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });
  return NextResponse.json({ reminders: await listReminders(me.id) });
}

export async function POST(request) {
  const me = await getCurrentCustomer();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });
  const b = await request.json().catch(() => ({}));

  const month = Number(b.month), day = Number(b.day);
  if (!String(b.title || "").trim()) return NextResponse.json({ error: "عنوان التذكير مطلوب." }, { status: 400 });
  if (!(month >= 1 && month <= 12)) return NextResponse.json({ error: "الشهر غير صحيح." }, { status: 400 });
  if (!(day >= 1 && day <= 31)) return NextResponse.json({ error: "اليوم غير صحيح." }, { status: 400 });

  await createReminder(me.id, { ...b, title: String(b.title).trim(), month, day });
  return NextResponse.json({ reminders: await listReminders(me.id) }, { status: 201 });
}

export async function DELETE(request) {
  const me = await getCurrentCustomer();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (id) await deleteReminder(me.id, id);
  return NextResponse.json({ reminders: await listReminders(me.id) });
}
