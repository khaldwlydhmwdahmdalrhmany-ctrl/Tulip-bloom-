import { NextResponse } from "next/server";
import { availableMethods } from "../../../../lib/paymentsDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** طرق الدفع المتاحة — عام. لا يُرجع أي مفتاح. */
export async function GET() {
  return NextResponse.json({ methods: await availableMethods() });
}
