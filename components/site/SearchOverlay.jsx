"use client";
/**
 * البحث الفوري.
 *
 * ── قرارات تجربة ──
 *  • تأخير ٢٥٠ مللي قبل الطلب: الكتابة العربية سريعة، وطلب لكل
 *    حرف يُغرق الخادم ويُنتج وميضًا في النتائج.
 *  • التسجيل (`log=1`) بعد ٩٠٠ مللي فقط — لا مع كل ضغطة، وإلا
 *    امتلأ تقرير اللوحة بأجزاء كلمات بلا معنى.
 *  • التنقّل بالأسهم و Enter: من يبحث بالكيبورد لا يريد الفأرة.
 *  • Escape يغلق، والنقر خارج اللوحة يغلق.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, CornerDownLeft, TrendingUp } from "lucide-react";
import { C, formatPrice } from "../../lib/colors.js";

export default function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState({ results: [], suggestions: [], total: 0 });
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
    else { setQ(""); setData({ results: [], suggestions: [], total: 0 }); setActive(0); }
  }, [open]);

  // جلب النتائج
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setData({ results: [], suggestions: [], total: 0 }); return; }
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=6`);
        const d = await res.json();
        setData(d); setActive(0);
      } catch { /* الشبكة — نُبقي آخر نتيجة بدل إفراغ الشاشة */ }
      finally { setBusy(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // التسجيل المنفصل — بعد توقّف الكتابة
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}&limit=1&suggest=0&log=1`).catch(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, [q]);

  const go = useCallback((href) => { onClose(); router.push(href); }, [onClose, router]);

  const onKey = (e) => {
    const items = data.results || [];
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      if (items[active]) go(`/product/${items[active].id}`);
      else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  if (!open) return null;

  const term = q.trim();
  const empty = term.length >= 2 && !busy && data.results.length === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[8vh] px-4"
         style={{ background: "rgba(26,23,24,.55)", backdropFilter: "blur(4px)" }}
         onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden rise"
           style={{ background: "#fff", boxShadow: "0 40px 80px -30px rgba(0,0,0,.45)" }}
           onClick={(e) => e.stopPropagation()}>

        {/* حقل البحث */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${C.line}` }}>
          <Search size={19} style={{ color: C.slateLight }} className="shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="ابحث عن باقة، مناسبة، أو نوع زهرة…"
            className="flex-1 text-base outline-none bg-transparent"
            style={{ color: C.ink }}
          />
          {busy && <Loader2 size={16} className="animate-spin shrink-0" style={{ color: C.teal }} />}
          <button onClick={onClose} aria-label="إغلاق"
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ color: C.slateLight }}>
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {term.length < 2 && (
            <p className="px-5 py-8 text-sm text-center" style={{ color: C.slateLight }}>
              اكتب حرفين على الأقل. جرّب «بوكيه» أو «تخرّج» أو «ورد أحمر».
            </p>
          )}

          {empty && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-bold mb-1.5" style={{ color: C.navy }}>
                لا نتائج لـ «{term}»
              </p>
              <p className="text-xs mb-5 leading-relaxed" style={{ color: C.slate }}>
                جرّب كلمة أعمّ، أو راسلنا على واتساب ونجهّزها لك خصيصًا.
              </p>
              <Link href="/shop" onClick={onClose} className="btn px-5 py-2.5 text-xs"
                    style={{ background: C.navy, color: "#fff" }}>
                تصفّح كل التشكيلة
              </Link>
            </div>
          )}

          {data.results.map((r, i) => {
            const soldOut = r.stock === "out_of_stock";
            return (
              <Link key={r.id} href={`/product/${r.id}`} onClick={onClose}
                    onMouseEnter={() => setActive(i)}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors"
                    style={{ background: i === active ? C.pearl : "transparent" }}>
                <span className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
                      style={{ background: C.mintTint }}>
                  {r.imageUrl
                    ? <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />
                    : <Search size={15} style={{ color: C.teal }} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate" style={{ color: C.navy }}>{r.name}</p>
                  <p className="text-[11px]" style={{ color: C.slateLight }}>
                    {r.categoryName}{soldOut ? " · غير متوفر" : ""}
                  </p>
                </div>
                <p className="num text-sm font-bold shrink-0" style={{ color: C.navy }}>
                  {formatPrice(r.price)} <span className="text-[10px] font-normal">ر.س</span>
                </p>
              </Link>
            );
          })}

          {data.suggestions?.length > 0 && (
            <div className="px-5 py-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
              <p className="text-[10px] font-bold tracking-[.14em] uppercase mb-2" style={{ color: C.slateLight }}>
                اقتراحات
              </p>
              <div className="flex flex-wrap gap-2">
                {data.suggestions.map((s) => (
                  <button key={s.label}
                          onClick={() => (s.href ? go(s.href) : setQ(s.label))}
                          className="px-3 py-1.5 rounded-lg text-[12px] flex items-center gap-1.5"
                          style={{ background: C.pearl, color: C.slate, border: `1px solid ${C.line}` }}>
                    {s.type === "popular" && <TrendingUp size={11} style={{ color: C.teal }} />}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {data.total > 0 && (
          <button onClick={() => go(`/search?q=${encodeURIComponent(term)}`)}
                  className="w-full px-5 py-3.5 text-[12px] font-bold flex items-center justify-center gap-2"
                  style={{ background: C.pearl, color: C.navy, borderTop: `1px solid ${C.line}` }}>
            عرض كل النتائج ({data.total}) <CornerDownLeft size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
