"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ExternalLink, FileText, Eye, EyeOff } from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };

export default function PagesBoard({ pages: initial = [] }) {
  const [pages, setPages] = useState(initial);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const card = { background: "#fff", border: `1px solid ${T.line}` };

  const create = async () => {
    if (!title.trim()) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || "تعذّر الإنشاء."); return; }
      router.push(`/admin/pages/${d.page.id}`);
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/pages?id=${id}`, { method: "DELETE" });
      if (res.ok) setPages((l) => l.filter((p) => p.id !== id));
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="p-5 rounded-2xl flex flex-col gap-3" style={card}>
        <h2 className="text-sm" style={{ color: T.primary, ...H }}>صفحة جديدة</h2>
        <div className="flex gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && create()}
                 placeholder="عنوان الصفحة — مثال: سياسة التوصيل"
                 className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                 style={{ border: `1px solid ${T.line}`, background: T.surfaceAlt }} />
          <button onClick={create} disabled={busy || !title.trim()}
                  className="px-6 rounded-xl text-[13px] font-bold flex items-center gap-1.5 shrink-0"
                  style={{ background: T.primary, color: "#fff", opacity: title.trim() ? 1 : .5 }}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} إنشاء
          </button>
        </div>
        {error && <p className="text-xs font-bold" style={{ color: T.danger }}>{error}</p>}
      </div>

      {pages.length === 0 ? (
        <div className="p-10 rounded-2xl text-center" style={card}>
          <FileText size={22} style={{ color: T.mutedLight }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: T.muted }}>لا صفحات بعد.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {pages.map((p) => {
            const live = p.status === "published";
            return (
              <div key={p.id} className="p-4 rounded-2xl flex flex-wrap items-center gap-3" style={card}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold" style={{ color: T.primary }}>{p.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                          style={live
                            ? { background: `${T.success}15`, color: T.success }
                            : { background: T.surfaceAlt, color: T.muted }}>
                      {live ? <Eye size={9} /> : <EyeOff size={9} />} {live ? "منشورة" : "مسودّة"}
                    </span>
                    {p.showInFooter && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: T.softTint, color: T.primary }}>
                        في الفوتر
                      </span>
                    )}
                  </div>
                  <p className="text-[11px]" dir="ltr" style={{ color: T.mutedLight, textAlign: "right" }}>
                    /p/{p.slug} · {p.blocks} بلوك
                  </p>
                </div>
                <Link href={`/admin/pages/${p.id}`}
                      className="px-4 py-2 rounded-xl text-[12px] font-bold shrink-0"
                      style={{ background: T.softTint, color: T.primary }}>تحرير</Link>
                <a href={`/p/${p.slug}`} target="_blank" rel="noopener noreferrer"
                   className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: T.surfaceAlt, color: T.muted }}>
                  <ExternalLink size={14} />
                </a>
                <button onClick={() => remove(p.id)} disabled={busy}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${T.danger}10`, color: T.danger }}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
