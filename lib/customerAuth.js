/**
 * ═══════════════════════════════════════════════════════════
 *  مصادقة العملاء
 * ═══════════════════════════════════════════════════════════
 *
 *  منفصل تمامًا عن `lib/auth.js` الخاص بالمسؤول. الفصل مقصود:
 *  اختراق حساب عميل يجب ألا يقترب من صلاحيات لوحة التحكم،
 *  والكوكيان مختلفان ولا يتبادلان الثقة إطلاقًا.
 *
 *  ── لماذا scrypt ──
 *  مدمج في `node:crypto`، بلا أي اعتماد خارجي، ومقاوم للذاكرة
 *  (memory-hard) فيرفع تكلفة الهجوم بالعتاد المتخصص. bcryptjs
 *  الخالص بطيء بلا مقابل، و bcrypt الأصلي يتطلب بناءً محليًا
 *  يكسر النشر على Vercel.
 *
 *  ── لماذا الجلسات في قاعدة البيانات ──
 *  الكوكي الموقّع وحده لا يُبطَل قبل انتهائه. تخزين الجلسة
 *  مجزّأة يتيح: تسجيل خروج من كل الأجهزة، وإبطال فوري عند
 *  حظر العميل أو تغيير كلمة المرور.
 *
 *  ⚠️ هذا الملف يستعمل `node:crypto` فلا يعمل على Edge Runtime.
 *     لذلك حماية صفحات /account تتم في layout (Node) لا في
 *     middleware (Edge).
 */

import crypto from "node:crypto";

export const CUSTOMER_COOKIE = "tb_customer_session";
export const SESSION_DAYS = 30;

/* ── معاملات scrypt ──
 * N=2^15 يوازن بين الأمان وزمن الاستجابة على دوال Vercel.
 * maxmem يجب رفعه يدويًا وإلا رفض Node العملية عند N الكبيرة. */
const SCRYPT = { N: 32768, r: 8, p: 1, keylen: 64, maxmem: 64 * 1024 * 1024 };

/* ═══════════════ كلمات المرور ═══════════════ */

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const dk = crypto.scryptSync(password.normalize("NFKC"), salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${dk.toString("base64")}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, N, r, p, saltB64, hashB64] = String(stored).split("$");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const dk = crypto.scryptSync(password.normalize("NFKC"), salt, expected.length, {
      N: Number(N), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem,
    });
    // مقارنة ثابتة الزمن — المقارنة العادية تتوقف عند أول اختلاف
    // ففرق التوقيت يسرّب معلومات تساعد على التخمين بايتًا بايت.
    return crypto.timingSafeEqual(dk, expected);
  } catch {
    return false;
  }
}

/**
 * قواعد كلمة المرور.
 *
 * الطول هو العامل الأهم بفارق كبير — فرض رموز وأرقام يدفع
 * الناس إلى أنماط متوقّعة مثل `Password1!` وهي أضعف من عبارة
 * طويلة بسيطة. لذلك: ٨ أحرف حدًّا أدنى، ومنع القوائم الشائعة.
 */
const COMMON = new Set([
  "12345678", "123456789", "password", "qwerty123", "11111111",
  "abc12345", "password1", "iloveyou", "00000000", "1q2w3e4r",
]);

export function validatePassword(pw) {
  if (typeof pw !== "string" || pw.length < 8) {
    return "كلمة المرور يجب ألا تقل عن ٨ أحرف.";
  }
  if (pw.length > 200) return "كلمة المرور طويلة أكثر من اللازم.";
  if (COMMON.has(pw.toLowerCase())) {
    return "كلمة المرور هذه شائعة جدًا — اختر غيرها.";
  }
  return null;
}

/* ═══════════════ البريد ═══════════════ */

/** تطبيع البريد — يمنع تسجيل نفس العنوان مرتين باختلاف حالة الأحرف. */
export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isValidEmail(email) {
  const e = normalizeEmail(email);
  // تحقّق عملي لا مطابق لـ RFC: يمنع الأخطاء الشائعة بلا رفض عناوين صحيحة
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;
}

/* ═══════════════ الرموز والجلسات ═══════════════ */

/** رمز عشوائي ٣٢ بايت — يُعطى للعميل مرة واحدة ولا يُحفظ خامًا. */
export function generateToken() {
  return crypto.randomBytes(32).toString("base64url");
}

/** بصمة الرمز — هي وحدها ما يُخزَّن. تسريب القاعدة لا يمنح جلسات. */
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry(days = SESSION_DAYS) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * خيارات كوكي الجلسة.
 *
 * httpOnly  — يمنع قراءتها من JavaScript فلا تُسرق بـXSS
 * sameSite  — lax يحمي من CSRF مع إبقاء الروابط الخارجية تعمل
 * secure    — في الإنتاج فقط، وإلا انكسر التطوير على http محلي
 */
export function cookieOptions(maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/* ═══════════════ تحديد المحاولات ═══════════════ */

export const MAX_ATTEMPTS = 6;
export const LOCK_MINUTES = 15;

export function lockUntil() {
  return new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
}

export function isLocked(customer) {
  if (!customer?.lockedUntil) return false;
  return new Date(customer.lockedUntil).getTime() > Date.now();
}

/* ═══════════════ التنظيف للعرض ═══════════════ */

/**
 * ⚠️ استعملها قبل إرسال أي بيانات عميل إلى المتصفح.
 * تمرير الصف الخام يسرّب `passwordHash` إلى HTML الصفحة.
 */
export function publicCustomer(c) {
  if (!c) return null;
  return {
    id: c.id,
    email: c.email,
    name: c.name || "",
    phone: c.phone || "",
    emailVerified: !!c.emailVerified,
    marketingOptIn: !!c.marketingOptIn,
    createdAt: c.createdAt,
  };
}
