"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";

const C = { navy: "#0C1C77", teal: "#00C6C7", line: "#E1ECE8", slate: "#5C6B72" };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id, name) => {
    if (!confirm(`تأكيد حذف تصنيف "${name}"؟`)) return;
    setError("");
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const data = await res.json();
      setError(data.error || "تعذّر حذف التصنيف");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl" style={{ color: C.navy, fontWeight: 800 }}>التصنيفات</h1>
        <Link href="/admin/categories/new" className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm" style={{ background: C.navy, color: "#fff" }}>
          <Plus size={16} /> تصنيف جديد
        </Link>
      </div>

      {error && <p className="text-sm mb-3" style={{ color: "#c05050" }}>{error}</p>}

      {!categories ? (
        <p style={{ color: C.slate }}>جاري التحميل...</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl flex items-center justify-between gap-3" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-3 min-w-0">
                {c.bannerUrl ? (
                  <img src={c.bannerUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: `${c.color}20` }} />
                )}
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: "#0B1220" }}>{c.name}</p>
                  <p className="text-xs truncate" style={{ color: C.slate }}>{c.tagline}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#F6FAF9", color: C.navy }}>
                  {c._count?.products ?? 0} منتج
                </span>
                <Link href={`/admin/categories/${c.id}/edit`} className="p-2 rounded-lg" style={{ background: "#F6FAF9" }}>
                  <Pencil size={15} color={C.navy} />
                </Link>
                <button onClick={() => remove(c.id, c.name)} className="p-2 rounded-lg" style={{ background: "#FDEDED" }}>
                  <Trash2 size={15} color="#c05050" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
