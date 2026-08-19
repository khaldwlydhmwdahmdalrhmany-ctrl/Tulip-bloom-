"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ExternalLink, Eye, EyeOff, Star, Newspaper, Tag } from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };
const fmt = (d) => (d ? new Date(d).toLocaleDateString("ar-SA") : "—");

export default function BlogBoard({ posts: initial = [], categories: initCats = [] }) {
  const [posts, setPosts] = useState(initial);
  const [cats, setCats] = useState(initCats);
  const [title, setTitle] = useState("");
  const [catName, setCatName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const card = { background: "#fff", border: `1px solid ${T.line}` };
  const field = "w-full px-4 py-3 rounded-xl text-sm outline-none";
  const fieldStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt };

  const call = async (payload, method = "POST") => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/blog", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || "تعذّر التنفيذ."); return null; }
      return d;
    } finally { setBusy(false); }
  };

  const createPost = async () => {
    if (!title.trim()) return;
    const d = await call({ title });
    if (d?.post) router.push(`/admin/blog/${d.post.id}`);
  };

  const addCat = async () => {
    if (!catName.trim()) return;
    const d = await call({ action: "create-category", name: catName });
    if (d?.categories) { setCats(d.categories); setCatName(""); }
  };
  const delCat = async (id) => {
    const d = await call({ action: "delete-category", id });
    if (d?.categories) setCats(d.categories);
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
      if (res.ok) setPosts((l) => l.filter((p) => p.id !== id));
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* مقال جديد */}
      <div className="p-5 rounded-2xl flex flex-col gap-3" style={card}>
        <h2 className="text-sm" style={{ color: T.primary, ...H }}>مقال جديد</h2>
        <div className="flex gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && createPost()}
                 placeholder="عنوان المقال — مثال: كيف تختار باقة التخرّج"
                 className={`flex-1 ${field}`} style={fieldStyle} />
          <button onClick={createPost} disabled={busy || !title.trim()}
                  className="px-6 rounded-xl text-[13px] font-bold flex items-center gap-1.5 shrink-0"
                  style={{ background: T.primary, color: "#fff", opacity: title.trim() ? 1 : .5 }}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} إنشاء
          </button>
        </div>
        {error && <p className="text-xs font-bold" style={{ color: T.danger }}>{error}</p>}
      </div>

      {/* التصنيفات */}
      <div className="p-5 rounded-2xl flex flex-col gap-3" style={card}>
        <h2 className="text-sm flex items-center gap-2" style={{ color: T.primary, ...H }}>
          <Tag size={14} /> تصنيفات المدوّنة
        </h2>
        <div className="flex gap-2">
          <input value={catName} onChange={(e) => setCatName(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && addCat()}
                 placeholder="اسم التصنيف — مثال: العناية بالورد"
                 className={`flex-1 ${field}`} style={fieldStyle} />
          <button onClick={addCat} disabled={busy || !catName.trim()}
                  className="px-5 rounded-xl text-[12px] font-bold shrink-0"
                  style={{ background: T.softTint, color: T.primary }}>إضافة</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <span key={c.id} className="text-[12px] px-3 py-1.5 rounded-lg flex items-center gap-2"
                  style={{ background: T.surfaceAlt, color: T.ink }}>
              {c.name}
              <button onClick={() => delCat(c.id)} style={{ color: T.danger }}>×</button>
            </span>
          ))}
          {cats.length === 0 && <span className="text-[12px]" style={{ color: T.mutedLight }}>لا تصنيفات بعد.</span>}
        </div>
      </div>

      {/* المقالات */}
      {posts.length === 0 ? (
        <div className="p-10 rounded-2xl text-center" style={card}>
          <Newspaper size={22} style={{ color: T.mutedLight }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: T.muted }}>لا مقالات بعد.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {posts.map((p) => {
            const live = p.status === "published";
            return (
              <div key={p.id} className="p-4 rounded-2xl flex flex-wrap items-center gap-3" style={card}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold" style={{ color: T.primary }}>{p.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                          style={live ? { background: `${T.success}15`, color: T.success }
                                      : { background: T.surfaceAlt, color: T.muted }}>
                      {live ? <Eye size={9} /> : <EyeOff size={9} />} {live ? "منشور" : "مسودّة"}
                    </span>
                    {p.featured && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                            style={{ background: `${T.gold}20`, color: T.gold }}>
                        <Star size={9} /> مميّز
                      </span>
                    )}
                  </div>
                  <p className="text-[11px]" style={{ color: T.mutedLight }}>
                    {p.categoryName || "بلا تصنيف"} · <span className="num">{p.readMinutes}</span> دقائق · {fmt(p.publishedAt)}
                  </p>
                </div>
                <Link href={`/admin/blog/${p.id}`} className="px-4 py-2 rounded-xl text-[12px] font-bold shrink-0"
                      style={{ background: T.softTint, color: T.primary }}>تحرير</Link>
                <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer"
                   className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: T.surfaceAlt, color: T.muted }}><ExternalLink size={14} /></a>
                <button onClick={() => remove(p.id)} disabled={busy}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${T.danger}10`, color: T.danger }}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
