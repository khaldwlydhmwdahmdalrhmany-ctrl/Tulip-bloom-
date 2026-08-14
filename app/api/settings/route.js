import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "../../../lib/db.js";
import { ALL_SETTING_KEYS } from "../../../lib/settings.js";
import { invalidateSettings } from "../../../lib/cache.js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    invalidateSettings();
    return NextResponse.json(await getSettings());
  } catch (err) {
    console.error("[api] خطأ:", err.message);
    // رسالة عامة — تفاصيل الخطأ قد تكشف أسماء الجداول وبنية القاعدة
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    // لا نقبل إلا المفاتيح المعروفة — يمنع حشو جدول الإعدادات بمدخلات عشوائية
    const clean = Object.fromEntries(
      Object.entries(body).filter(([k]) => ALL_SETTING_KEYS.includes(k))
    );
    invalidateSettings();
    return NextResponse.json(await saveSettings(clean));
  } catch (err) {
    console.error("[api] فشل الحفظ:", err.message);
    return NextResponse.json({ error: "تعذّر حفظ الإعدادات" }, { status: 400 });
  }
}
