import { NextResponse } from "next/server";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";
import { listAddresses, createAddress, deleteAddress, setDefaultAddress } from "../../../../lib/customerDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireMe() {
  const me = await getCurrentCustomer();
  return me || null;
}

export async function GET() {
  const me = await requireMe();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });
  return NextResponse.json({ addresses: await listAddresses(me.id) });
}

export async function POST(request) {
  const me = await requireMe();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  if (!String(b.city || "").trim()) {
    return NextResponse.json({ error: "المدينة مطلوبة." }, { status: 400 });
  }
  await createAddress(me.id, b);
  return NextResponse.json({ addresses: await listAddresses(me.id) }, { status: 201 });
}

export async function PATCH(request) {
  const me = await requireMe();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  if (b.setDefault) await setDefaultAddress(me.id, b.setDefault);
  return NextResponse.json({ addresses: await listAddresses(me.id) });
}

export async function DELETE(request) {
  const me = await requireMe();
  if (!me) return NextResponse.json({ error: "غير مسجّل الدخول." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  // ⚠️ الحذف مقيّد بـ customerId أيضًا — بلا ذلك يحذف أي عميل عنوان غيره
  if (id) await deleteAddress(me.id, id);
  return NextResponse.json({ addresses: await listAddresses(me.id) });
}
