import { NextResponse } from "next/server";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";
import { listRecipients, createRecipient, deleteRecipient } from "../../../../lib/customerDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentCustomer();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });
  return NextResponse.json({ recipients: await listRecipients(me.id) });
}

export async function POST(request) {
  const me = await getCurrentCustomer();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  if (!String(b.name || "").trim()) {
    return NextResponse.json({ error: "اسم المستلم مطلوب." }, { status: 400 });
  }
  await createRecipient(me.id, { ...b, name: String(b.name).trim() });
  return NextResponse.json({ recipients: await listRecipients(me.id) }, { status: 201 });
}

export async function DELETE(request) {
  const me = await getCurrentCustomer();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (id) await deleteRecipient(me.id, id);
  return NextResponse.json({ recipients: await listRecipients(me.id) });
}
