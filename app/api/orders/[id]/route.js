import { NextResponse } from "next/server";
import { updateOrderStatus } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  try {
    const { status, notes } = await request.json();
    if (!status) {
      return NextResponse.json({ error: "الحالة مطلوبة" }, { status: 400 });
    }
    const order = await updateOrderStatus(params.id, status, notes);
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (err) {
    console.error("[api] فشل تحديث الطلب:", err.message);
    return NextResponse.json({ error: "تعذّر تحديث الطلب" }, { status: 400 });
  }
}
