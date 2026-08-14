"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, EyeOff } from "lucide-react";
import VisibilityToggle from "../../../components/VisibilityToggle.jsx";

const C = { navy: "#0C1C77", teal: "#00C6C7", line: "#E1ECE8", slate: "#5C6B72" };

export default function AdminBannersPage() {
  const [banners, setBanners] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/banners").then((r) => r.json()).then(setBanners);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id, title) => {
    if (!confirm(`تأكيد حذف بنر "${title}"؟`)) return;
    const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("تعذّر حذف البنر");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl" style={{ color: C.navy, fontWeight: 800 }}>البنرات</h1>
        <Link href="/admin/banners/new" className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm" style={{ background: C.navy, color: "#fff" }}>
          <Plus size={16} /> بنر جديد
        </Link>
      </div>

      {error && <p className="text-sm mb-3" style={{ color: "#c05050" }}>{error}</p>}

      {!banners ? (
        <p style={{ color: C.slate }}>جاري التحميل...</p>
      ) : banners.length === 0 ? (
        <p className="text-sm p-6 rounded-2xl" style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.slate }}>
          لا توجد بنرات بعد. أضف أول بنر ترويجي للصفحة الرئيسية أو لأحد التصنيفات.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {banners.map((b) => (
            <div key={b.id} className="p-4 rounded-2xl flex items-center justify-between gap-3" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-3 min-w-0">
                {b.imageUrl ? (
                  <img src={b.imageUrl} alt="" className="w-20 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-12 rounded-lg shrink-0" style={{ background: "linear-gradient(135deg,#0C1C77,#00C6C7)" }} />
                )}
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate flex items-center gap-2" style={{ color: "#0B1220" }}>
                    {b.title}
                    <VisibilityToggle
                      id={b.id}
                      visible={b.active !== false}
                      endpoint="/api/banners"
                      field="active"
                      labels={{ shown: "نشط", hidden: "متوقف" }}
                    />
                  </p>
                  <p className="text-xs truncate" style={{ color: C.slate }}>
                    {b.placement === "home" ? "الصفحة الرئيسية" : "صفحة تصنيف"} {b.subtitle ? `— ${b.subtitle}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/admin/banners/${b.id}/edit`} className="p-2 rounded-lg" style={{ background: "#F6FAF9" }}>
                  <Pencil size={15} color={C.navy} />
                </Link>
                <button onClick={() => remove(b.id, b.title)} className="p-2 rounded-lg" style={{ background: "#FDEDED" }}>
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
