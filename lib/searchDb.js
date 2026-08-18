/**
 * ═══════════════════════════════════════════════════════════
 *  تخزين البحث: السجلّ والتهيئة القابلة للتحرير
 * ═══════════════════════════════════════════════════════════
 *
 *  التهيئة تُحفظ في جدول `settings` كـJSON. الملف
 *  `config/search.config.js` أساس، ونسخة اللوحة تفوز عليه —
 *  نفس منطق بقية النواة.
 */

import crypto from "node:crypto";
import { getSettings, saveSettings } from "./db.js";
import { normalizeArabic } from "./searchEngine.js";
import {
  SYNONYMS as DEF_SYN, STOPWORDS as DEF_STOP,
  WEIGHTS as DEF_W, PINS as DEF_PINS,
} from "../config/search.config.js";

const raw = (process.env.DATABASE_URL || "").trim();
const isPg = raw.startsWith("postgres");
const newId = () => crypto.randomBytes(12).toString("hex");
const q = (n) => (isPg ? `"${n}"` : n);
const prep = (sql) => { if (!isPg) return sql; let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };

let pool = null;
async function db() {
  if (isPg) {
    if (!pool) {
      const { default: pg } = await import("pg");
      pool = new pg.Pool({ connectionString: raw, ssl: { rejectUnauthorized: false }, max: 5 });
    }
    return {
      all: async (sql, p = []) => (await pool.query(prep(sql), p)).rows,
      run: async (sql, p = []) => { await pool.query(prep(sql), p); },
    };
  }
  const { getDb } = await import("./db.sqlite.js");
  const d = getDb();
  return {
    all: async (sql, p = []) => d.prepare(sql).all(...p),
    run: async (sql, p = []) => { d.prepare(sql).run(...p); },
  };
}

/* ═══════════════ السجلّ ═══════════════ */

/**
 * يسجّل استعلامًا.
 * ⚠️ لا يرمي أبدًا: فشل التسجيل يجب ألا يُفشل بحث العميل.
 */
export async function logSearch({ raw: rawQuery, resultCount, customerId }) {
  try {
    const text = String(rawQuery || "").trim().slice(0, 200);
    if (text.length < 2) return;                    // حروف مفردة ضجيج
    const d = await db();
    await d.run(
      `INSERT INTO search_queries (id, raw, normalized, ${q("resultCount")}, ${q("customerId")})
       VALUES (?, ?, ?, ?, ?)`,
      [newId(), text, normalizeArabic(text), Number(resultCount) || 0, customerId || null]
    );
  } catch { /* التسجيل تفصيل — البحث أهم */ }
}

/** أكثر الاستعلامات تكرارًا. */
export async function topQueries({ days = 30, limit = 25 } = {}) {
  const d = await db();
  const since = new Date(Date.now() - days * 86400000);
  const sinceVal = isPg ? since : since.toISOString().slice(0, 19).replace("T", " ");
  return d.all(
    `SELECT normalized, COUNT(*) AS hits,
            MAX(raw) AS sample,
            AVG(${q("resultCount")}) AS avgresults
       FROM search_queries
      WHERE ${q("createdAt")} >= ?
      GROUP BY normalized
      ORDER BY hits DESC
      LIMIT ?`,
    [sinceVal, limit]
  );
}

/**
 * الاستعلامات بلا نتائج — أثمن تقرير في المتجر.
 * كل صفّ هنا عميل طلب شيئًا ولم يجده: إما منتج ينقصك، أو
 * مرادف ينقص محرّك البحث. كلاهما قابل للإصلاح فورًا.
 */
export async function zeroResultQueries({ days = 30, limit = 25 } = {}) {
  const d = await db();
  const since = new Date(Date.now() - days * 86400000);
  const sinceVal = isPg ? since : since.toISOString().slice(0, 19).replace("T", " ");
  return d.all(
    `SELECT normalized, COUNT(*) AS hits, MAX(raw) AS sample
       FROM search_queries
      WHERE ${q("resultCount")} = 0 AND ${q("createdAt")} >= ?
      GROUP BY normalized
      ORDER BY hits DESC
      LIMIT ?`,
    [sinceVal, limit]
  );
}

export async function searchStats({ days = 30 } = {}) {
  const d = await db();
  const since = new Date(Date.now() - days * 86400000);
  const sinceVal = isPg ? since : since.toISOString().slice(0, 19).replace("T", " ");
  const rows = await d.all(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN ${q("resultCount")} = 0 THEN 1 ELSE 0 END) AS zero
       FROM search_queries WHERE ${q("createdAt")} >= ?`,
    [sinceVal]
  );
  const total = Number(rows[0]?.total || 0);
  const zero = Number(rows[0]?.zero || 0);
  return { total, zero, zeroRate: total ? Math.round((zero / total) * 100) : 0 };
}

/* ═══════════════ التهيئة القابلة للتحرير ═══════════════ */

const parse = (v, fallback) => {
  if (!v) return fallback;
  try { const p = JSON.parse(v); return p ?? fallback; } catch { return fallback; }
};

export async function loadSearchConfig() {
  const s = await getSettings().catch(() => ({}));
  return {
    synonyms: parse(s.search_synonyms, DEF_SYN),
    stopwords: parse(s.search_stopwords, DEF_STOP),
    weights: { ...DEF_W, ...parse(s.search_weights, {}) },
    pins: parse(s.search_pins, DEF_PINS),
  };
}

export async function saveSearchConfig({ synonyms, stopwords, pins, weights }) {
  const entries = {};
  if (synonyms) entries.search_synonyms = JSON.stringify(synonyms);
  if (stopwords) entries.search_stopwords = JSON.stringify(stopwords);
  if (pins) entries.search_pins = JSON.stringify(pins);
  if (weights) entries.search_weights = JSON.stringify(weights);
  await saveSettings(entries);
  return loadSearchConfig();
}
