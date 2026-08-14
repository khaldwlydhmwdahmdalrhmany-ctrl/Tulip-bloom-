"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Star, ArrowUp, ArrowDown, Tag, Percent, AlertTriangle, Plus, X,
  Loader2, Check, Pencil, Eye, EyeOff,
} from "lucide-react";
import { BADGES, OFFER_BADGES, badgeColor, isOfferProduct, normalizeBadge } from "../lib/badges.js";

const C = { navy: "#0C1C77", slate: "#4A5A63", line: "#E1ECE8", teal: "#00C6C7", offWhite: "#F6FAF9", gold: "#F2B01E", danger: "#D64545", success: "#1B9C68" };

const money = (v) => Number(v || 0).toLocaleString("ar-SA");
const saving = (p) => (p.oldPrice > p.price ? Math.round(p.oldPrice - p.price) : 0);
const pct = (p) => (p.oldPrice > p.price ? Math.round(100 - (p.price / p.oldPrice) * 100) : 0);

/** لماذا يظهر هذا المنتج في صفحة العروض؟ */
const byPriceOnly = (p) => p.oldPrice > p.price;

function reason(p) {
  const byPrice = p.oldPrice > p.price;
  const byBadge = !byPriceOnly(p) && isOfferProduct(p);
  if (byPrice && byBadge) return { text: `خصم ${pct(p)}% + شارة`, color: C.success };
  if (byPrice) return { text: `خصم ${pct(p)}%`, color: C.success };
  if (byBadge) return { text: `شارة «${p.badge}»`, color: "#7C3AED" };
  return null;
}

/** تحذيرات بيانات تُفسد شكل الصفحة أمام العميل. */
function warnings(p) {
  const w = [];
  if (p.oldPrice !== null && p.oldPrice !== undefined && p.oldPrice < 0) w.push("السعر السابق رقم سالب");
  if (p.oldPrice > 0 && p.oldPrice <= p.price) w.push("السعر السابق لا يزيد عن الحالي — لن يظهر خصم");
  if (pct(p) >= 80) w.push(`خصم ${pct(p)}% — تأكد أنه ليس خطأ إدخال`);
  if (p.published === false) w.push("المنتج مخفي، فلن يظهر في الصفحة");
  if (p.stock === "out_of_stock") w.push("غير متوفر — يظهر بلا أزرار شراء");
  return w;
}

export default function OffersManager() {
  const [products, setProducts] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () =>
    fetch("/api/products?all=1").then((r) => r.json()).then(setProducts).catch(() => setError("تعذّر التحميل"));
  useEffect(() => { load(); }, []);

  const patch = async (id, body) => {
    setBusy(id); setError("");
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "فشل الحفظ");
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(null); }
  };

  const inOffers = useMemo(() => {
    if (!products) return [];
    return products
      .filter(isOfferProduct)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [products]);

  const candidates = useMemo(() => {
    if (!products) return [];
    const ids = new Set(inOffers.map((p) => p.id));
    return products.filter((p) => !ids.has(p.id));
  }, [products, inOffers]);

  /** تبديل موضع منتجين وحفظ الترتيب الجديد للاثنين. */
  const move = async (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= inOffers.length) return;
    const a = inOffers[idx], b = inOffers[target];
    setBusy(a.id);
    try {
      await Promise.all([
        fetch(`/api/products/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: target + 1 }) }),
        fetch(`/api/products/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: idx + 1 }) }),
      ]);
      await load();
    } catch { setError("تعذّر تغيير الترتيب"); }
    finally { setBusy(null); }
  };

  const pin = (p) => patch(p.id, { featuredOffer: !p.featuredOffer, ...(p.featuredOffer ? {} : {}) });

  if (!products) return <p className="text-sm" style={{ color: C.slate }}>جارٍ التحميل…</p>;

  const pinned = inOffers.find((p) => p.featuredOffer);
  const totalSaving = inOffers.reduce((s, p) => s + saving(p), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* ملخّص */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { icon: Tag, label: "منتج في العروض", value: inOffers.length, color: C.navy },
          { icon: Percent, label: "مجموع التوفير", value: `${money(totalSaving)} ر.س`, color: C.success },
          { icon: Star, label: "صفقة الصدارة", value: pinned ? "مثبّتة" : "تلقائية", color: C.gold },
        ].map((s, i) => (
          <div key={i} className="p-3.5 rounded-2xl flex flex-col gap-1.5" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
              <s.icon size={14} color={s.color} strokeWidth={2} />
            </span>
            <span className="text-[10px] font-bold leading-tight" style={{ color: C.slate }}>{s.label}</span>
            <span className="font-display text-base leading-none" style={{ color: C.navy, fontWeight: 800 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {error && <p className="text-xs font-bold px-4 py-3 rounded-xl" style={{ background: `${C.danger}12`, color: C.danger }}>{error}</p>}

      {/* القائمة */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-bold text-sm" style={{ color: C.navy }}>المنتجات المعروضة</h2>
          <button onClick={() => setAdding((v) => !v)} className="btn px-3.5 py-2 text-[11px]"
                  style={adding ? { background: C.offWhite, color: C.slate } : { background: C.navy, color: "#fff" }}>
            {adding ? <><X size={13} /> إغلاق</> : <><Plus size={13} /> إضافة منتج</>}
          </button>
        </div>

        {/* إضافة سريعة */}
        {adding && (
          <div className="p-4 rounded-2xl mb-3" style={{ background: C.offWhite, border: `1px dashed ${C.line}` }}>
            <p className="text-[11px] mb-3" style={{ color: C.slate }}>
              اختر منتجًا لإضافة شارة «عرض خاص» إليه — يظهر في صفحة العروض فورًا حتى بلا خصم سعري.
            </p>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
              {candidates.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: C.slate }}>كل المنتجات معروضة بالفعل.</p>
              ) : candidates.map((p) => (
                <button key={p.id} onClick={() => patch(p.id, { badge: "عرض خاص" })} disabled={busy === p.id}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-right transition-colors hover:bg-white disabled:opacity-50"
                        style={{ background: "#fff" }}>
                  {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                              : <span className="w-8 h-8 rounded-lg shrink-0" style={{ background: C.line }} />}
                  <span className="flex-1 min-w-0 text-xs font-bold truncate" style={{ color: C.navy }}>{p.name}</span>
                  <span className="text-[11px] shrink-0" style={{ color: C.slate }}>{money(p.price)} ر.س</span>
                  {busy === p.id ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Plus size={13} color={C.teal} className="shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {inOffers.length === 0 ? (
          <div className="p-8 rounded-2xl text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
            <p className="text-sm font-bold mb-1" style={{ color: C.navy }}>لا توجد عروض حاليًا</p>
            <p className="text-xs" style={{ color: C.slate }}>
              أضف سعرًا سابقًا لمنتج، أو امنحه شارة ترويجية — وستظهر صفحة العروض تلقائيًا.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {inOffers.map((p, i) => {
              const r = reason(p);
              const warns = warnings(p);
              const isBusy = busy === p.id;

              return (
                <div key={p.id} className="p-3 rounded-2xl flex flex-col gap-2.5"
                     style={{ background: "#fff", border: `1px solid ${p.featuredOffer ? C.gold : C.line}`, opacity: p.published === false ? 0.6 : 1 }}>
                  <div className="flex items-start gap-3">
                    {/* الترتيب */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => move(i, -1)} disabled={i === 0 || isBusy}
                              className="w-7 h-6 rounded-md flex items-center justify-center disabled:opacity-25"
                              style={{ background: C.offWhite }} title="تحريك لأعلى">
                        <ArrowUp size={12} color={C.navy} />
                      </button>
                      <span className="text-[10px] text-center font-bold" style={{ color: C.slate }}>{i + 1}</span>
                      <button onClick={() => move(i, 1)} disabled={i === inOffers.length - 1 || isBusy}
                              className="w-7 h-6 rounded-md flex items-center justify-center disabled:opacity-25"
                              style={{ background: C.offWhite }} title="تحريك لأسفل">
                        <ArrowDown size={12} color={C.navy} />
                      </button>
                    </div>

                    {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                                : <span className="w-12 h-12 rounded-xl shrink-0" style={{ background: C.offWhite }} />}

                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm block truncate" style={{ color: C.navy }}>{p.name}</span>

                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="font-bold text-xs" style={{ color: C.navy }}>{money(p.price)} ر.س</span>
                        {p.oldPrice > p.price && (
                          <>
                            <span className="text-[11px] line-through" style={{ color: C.danger }}>{money(p.oldPrice)}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#E7F7EF", color: C.success }}>
                              وفّر {money(saving(p))} ر.س
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {r && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${r.color}15`, color: r.color }}>
                            {r.text}
                          </span>
                        )}
                        {p.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: badgeColor(p.badge) }}>
                            {p.badge}
                          </span>
                        )}
                        {p.published === false && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background: "#FDECEC", color: "#B93030" }}>
                            <EyeOff size={9} /> مخفي
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* تحذيرات البيانات */}
                  {warns.length > 0 && (
                    <div className="flex flex-col gap-1 px-2 py-2 rounded-lg" style={{ background: "#FFF8E7" }}>
                      {warns.map((w, k) => (
                        <span key={k} className="text-[10px] font-bold flex items-center gap-1.5" style={{ color: "#8A6200" }}>
                          <AlertTriangle size={10} className="shrink-0" /> {w}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* إجراءات */}
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => pin(p)} disabled={isBusy}
                            className="btn px-3 py-2 text-[11px] disabled:opacity-50"
                            style={p.featuredOffer ? { background: C.gold, color: "#3D2A00" } : { background: C.offWhite, color: C.navy }}>
                      {isBusy ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} fill={p.featuredOffer ? "#3D2A00" : "none"} />}
                      {p.featuredOffer ? "صفقة الصدارة" : "تثبيت كصدارة"}
                    </button>

                    {normalizeBadge(p.badge).startsWith("عرض") && (
                      <button onClick={() => patch(p.id, { badge: "" })} disabled={isBusy}
                              className="btn px-3 py-2 text-[11px]" style={{ background: "#FDECEC", color: C.danger }}>
                        <X size={12} /> إزالة من العروض
                      </button>
                    )}

                    <Link href={`/admin/products/${p.id}/edit`} className="btn px-3 py-2 text-[11px]" style={{ background: C.offWhite, color: C.navy }}>
                      <Pencil size={12} /> تعديل
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
