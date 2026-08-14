import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

/**
 * محاولات فاشلة لكل عنوان — يبطّئ التخمين الآلي.
 * في الذاكرة فقط: يكفي لصدّ محاولة تخمين متتابعة، ويُصفَّر عند إعادة التشغيل.
 */
const attempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function tooMany(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) { attempts.delete(ip); return false; }
  return rec.count >= MAX_ATTEMPTS;
}

function recordFail(ip) {
  const rec = attempts.get(ip);
  if (!rec || Date.now() - rec.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: Date.now() });
  } else {
    rec.count += 1;
  }
}

/** مقارنة ثابتة الزمن — تمنع استنتاج كلمة المرور من فروق التوقيت. */
function safeEqual(a = "", b = "") {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (tooMany(ip)) {
    return NextResponse.json(
      { error: "محاولات كثيرة. انتظر عشر دقائق ثم أعد المحاولة." },
      { status: 429 }
    );
  }

  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;

  // فشل مغلق: بلا بيانات اعتماد مضبوطة لا يُسمح بالدخول إطلاقًا.
  // المقارنة السابقة (undefined !== undefined) كانت تُرجع false،
  // فيمرّ الطلب الفارغ ويُنشئ جلسة مسؤول كاملة.
  if (!validUser || !validPass) {
    console.error("[login] ADMIN_USERNAME أو ADMIN_PASSWORD غير مضبوط");
    return NextResponse.json({ error: "تسجيل الدخول غير مُهيّأ على الخادم" }, { status: 500 });
  }

  let username, password;
  try {
    ({ username, password } = await request.json());
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const ok = safeEqual(String(username ?? ""), validUser) &&
             safeEqual(String(password ?? ""), validPass);

  if (!ok) {
    recordFail(ip);
    // رسالة واحدة للحالتين — لا نكشف أي الحقلين كان خاطئًا
    return NextResponse.json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" }, { status: 401 });
  }

  attempts.delete(ip);

  const token = await createSessionToken(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
