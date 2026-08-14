"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, Filter, Star } from "lucide-react";
import VisibilityToggle from "../../../components/VisibilityToggle.jsx";
import { badgeColor } from "../../../lib/badges.js";

const C = { navy: "#0C1C77", teal: "#00C6C7", line: "#E1ECE8", slate: "#5C6B72", offWhite: "#F6FAF9", danger: "#c05050" };

export default function AdminProductsPage() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const load = () => fetch("/api/products?all=1").then((r) => r.json()).then(setProducts).catch(() => setError("تعذّر تحميل المنتجات"));
  useEffect(() => { load(); }, []);

  const remove = async (id, name) => {
    if (!confirm(`تأكيد حذف "${name}"؟\n\nإن كنت تريد إخفاءه مؤقتًا فقط، استخدم زر «ظاهر/مخفي» بدل الحذف.`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) load(); else setError("تعذّر حذف المنتج");
  };

  const shown = useMemo(() => {
    if (!products) return [];
    const term = q.trim().toLowerCase();
    return products.filter((p) => {
      if (term && !`${p.name} ${p.brand || ""} ${p.badge || ""}`.toLowerCase().includes(term)) return false;
      if (filter === "hidden") return p.published === false;
      if (filter === "offers") return p.badge || (p.oldPrice > p.price);
      if (filter === "nostock") return p.stock === "out_of_stock";
      return true;
    });
  }, [products, q, filter]);

  const FILTERS = [
    { k: "all", label: "الكل" },
    { k: "offers", label: "عليها شارة أو خصم" },
    { k: "hidden", label: "المخفية" },
    { k: "nostock", label: "غير متوفرة" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="font-display text-xl" style={{ color: C.navy, fontWeight: 800 }}>المنتجات</h1>
        <Link href="/admin/products/new" className="btn px-4 py-2.5 text-sm shrink-0" style={{ background: C.navy, color: "#fff" }}>
          <Plus size={16} /> منتج جديد
        </Link>
      </div>

      {/* بحث وفلترة */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="relative">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3.5 pointer-events-none" color={C.teal} />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالاسم أو الماركة أو الشارة…"
            className="w-full pr-10 pl-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: `1.5px solid ${C.line}`, background: "#fff" }}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {FILTERS.map((f) => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className="shrink-0 px-3.5 py-2 rounded-full text-[11px] font-bold transition-colors"
              style={filter === f.k ? { background: C.navy, color: "#fff" } : { background: "#fff", color: C.slate, border: `1px solid ${C.line}` }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm mb-3" style={{ color: C.danger }}>{error}</p>}

      {!products ? (
        <p style={{ color: C.slate }}>جارٍ التحميل…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm p-6 rounded-2xl text-center" style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.slate }}>
          {products.length === 0 ? "لا توجد منتجات بعد. ابدأ بإضافة أول منتج." : "لا نتائج مطابقة."}
        </p>
      ) : (
        <>
          <p className="text-[11px] mb-3" style={{ color: C.slate }}>{shown.length} منتج</p>

          {/* بطاقات — تعمل على كل المقاسات بلا سحب أفقي */}
          <div className="flex flex-col gap-2.5">
            {shown.map((p) => (
              <div key={p.id} className="p-3 rounded-2xl flex items-center gap-3"
                   style={{ background: "#fff", border: `1px solid ${C.line}`, opacity: p.published === false ? 0.65 : 1 }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: C.offWhite }} />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm truncate" style={{ color: C.navy }}>{p.name}</span>
                    {p.featuredOffer && <Star size={12} color="#F2B01E" fill="#F2B01E" />}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="font-bold text-xs" style={{ color: C.navy }}>
                      {Number(p.price).toLocaleString("ar-SA")} ر.س
                    </span>
                    {p.oldPrice > p.price && (
                      <span className="text-[11px] line-through" style={{ color: "#D64545" }}>
                        {Number(p.oldPrice).toLocaleString("ar-SA")}
                      </span>
                    )}
                    <span className="text-[11px]" style={{ color: C.slate }}>· {p.category?.name}</span>
                    {p.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: badgeColor(p.badge) }}>
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <VisibilityToggle id={p.id} visible={p.published !== false} endpoint="/api/products" field="published" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <Link href={`/admin/products/${p.id}/edit`} className="p-2 rounded-lg block" style={{ background: C.offWhite }} title="تعديل">
                    <Pencil size={15} color={C.navy} />
                  </Link>
                  <button onClick={() => remove(p.id, p.name)} className="p-2 rounded-lg" style={{ background: "#FDEDED" }} title="حذف">
                    <Trash2 size={15} color={C.danger} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
