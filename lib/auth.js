// نستخدم Web Crypto API (بدل وحدة crypto التابعة لـ Node) لأن الـ middleware
// يعمل على بيئة Edge Runtime التي لا تدعم وحدات Node التقليدية.

/**
 * مفتاح توقيع الجلسات.
 * في الإنتاج نرفض العمل بمفتاح افتراضي: لو نُشر الموقع بلا SESSION_SECRET
 * لصار بإمكان أي شخص يعرف القيمة الافتراضية تزوير جلسة مسؤول كاملة.
 */
const SECRET = process.env.SESSION_SECRET || (
  process.env.NODE_ENV === "production"
    ? null
    : "insecure-dev-secret-local-only"
);
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // أسبوع

function base64url(bytes) {
  let str = typeof bytes === "string" ? btoa(bytes) : btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  return atob(padded);
}

async function hmacSign(message) {
  if (!SECRET) throw new Error("SESSION_SECRET غير مضبوط في متغيّرات البيئة");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return base64url(sig);
}

export async function createSessionToken(username) {
  const payload = JSON.stringify({ u: username, exp: Date.now() + SESSION_MAX_AGE * 1000 });
  const payloadB64 = base64url(payload);
  const sig = await hmacSign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  if (!SECRET) return null;   // بلا مفتاح لا نثق بأي جلسة
  const [payloadB64, sig] = token.split(".");

  let expectedSig;
  try { expectedSig = await hmacSign(payloadB64); } catch { return null; }

  // مقارنة ثابتة الزمن — المقارنة العادية تتوقف عند أول اختلاف،
  // ففرق التوقيت يسرّب معلومات تساعد على تخمين التوقيع بايتًا بايت.
  if (!timingSafeEqual(sig, expectedSig)) return null;
  try {
    const payload = JSON.parse(base64urlDecode(payloadB64));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** مقارنة نصّين بزمن ثابت لا يعتمد على موضع أول اختلاف. */
function timingSafeEqual(a = "", b = "") {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const SESSION_COOKIE_NAME = "areej_admin_session";
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE;
