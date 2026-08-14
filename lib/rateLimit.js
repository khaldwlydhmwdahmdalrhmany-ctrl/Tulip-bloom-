/**
 * تحديد بسيط لمعدّل الطلبات — في الذاكرة.
 *
 * ليس بديلًا عن جدار حماية، لكنه يكفي لمنع إغراق المسارات العامة
 * (إنشاء طلبات وهمية، أو تضخيم أرقام الزيارات) من مصدر واحد.
 * الذاكرة تُصفَّر مع كل نسخة دالة جديدة، وهذا مقبول لهذا الغرض.
 */

const buckets = new Map();
const MAX_KEYS = 5000;   // سقف يمنع تضخّم الذاكرة

export function rateLimit(key, { limit = 20, windowMs = 60_000 } = {}) {
  const now = Date.now();

  // تنظيف دوري كسول عند بلوغ السقف
  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) {
      if (now - v.start > windowMs) buckets.delete(k);
    }
    if (buckets.size > MAX_KEYS) buckets.clear();
  }

  const b = buckets.get(key);
  if (!b || now - b.start > windowMs) {
    buckets.set(key, { count: 1, start: now });
    return { ok: true, remaining: limit - 1 };
  }

  b.count += 1;
  if (b.count > limit) {
    return { ok: false, retryAfter: Math.ceil((b.start + windowMs - now) / 1000) };
  }
  return { ok: true, remaining: limit - b.count };
}

/** عنوان الطالب من ترويسات Vercel. */
export function clientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
