import { NextResponse } from "next/server";
import { loadSearchConfig, saveSearchConfig } from "../../../../lib/searchDb.js";
import { invalidateSettings } from "../../../../lib/cache.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** محمي عبر middleware — كل /api يتطلب جلسة مسؤول إلا القائمة البيضاء. */
export async function GET() {
  return NextResponse.json(await loadSearchConfig());
}

export async function PUT(request) {
  const body = await request.json().catch(() => ({}));

  // تنقية المرادفات: مجموعات من كلمتين فأكثر، بلا فراغات
  let synonyms;
  if (Array.isArray(body.synonyms)) {
    synonyms = body.synonyms
      .map((g) => (Array.isArray(g) ? g : String(g).split(/[,،]/)))
      .map((g) => [...new Set(g.map((w) => String(w).trim()).filter(Boolean))])
      .filter((g) => g.length >= 2)
      .slice(0, 400);
  }

  let stopwords;
  if (Array.isArray(body.stopwords)) {
    stopwords = [...new Set(body.stopwords.map((w) => String(w).trim()).filter(Boolean))].slice(0, 500);
  }

  let pins;
  if (body.pins && typeof body.pins === "object") {
    pins = {};
    for (const [k, v] of Object.entries(body.pins).slice(0, 200)) {
      const ids = (Array.isArray(v) ? v : []).map((x) => String(x).slice(0, 64)).filter(Boolean);
      if (String(k).trim() && ids.length) pins[String(k).trim()] = ids.slice(0, 12);
    }
  }

  const saved = await saveSearchConfig({ synonyms, stopwords, pins });
  invalidateSettings();
  return NextResponse.json(saved);
}
