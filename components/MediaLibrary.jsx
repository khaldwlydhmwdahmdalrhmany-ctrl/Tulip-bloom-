"use client";
/**
 * ═══════════════════════════════════════════════════════════
 *  مكتبة الوسائط
 * ═══════════════════════════════════════════════════════════
 *  شبكة صور مع رفع متعدّد، وتحرير النص البديل، وحذف واعٍ
 *  بالاستعمال.
 */
import React, { useState, useRef, useMemo } from "react";
import {
  Upload, Search, Trash2, Copy, Check, Loader2, X, AlertTriangle,
  Image as ImageIcon, HardDrive, ExternalLink,
} from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };
const n = (v) => Number(v || 0).toLocaleString("ar-SA");

const humanSize = (b) => {
  if (!b) return "—";
  if (b < 1024) return `${b} بايت`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} ك.ب`;
  return `${(b / 1048576).toFixed(1)} م.ب`;
};

export default function MediaLibrary({ initial = [], stats = {}, pickMode = false, onPick }) {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);   // { item, usage }
  const fileRef = useRef(null);

  const card = { background: "#fff", border: `1px solid ${T.line}` };
  const field = "w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none";
  const fieldStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((m) => m.filename.toLowerCase().includes(s) || m.alt.toLowerCase().includes(s));
  }, [items, q]);

  /* ── الرفع المتعدّد ── */
  const uploadFiles = async (files) => {
    setBusy(true); setError("");
    const added = [];
    for (const file of Array.from(files).slice(0, 20)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) { setError(d.error || `تعذّر رفع ${file.name}`); continue; }
        added.push({
          id: `tmp-${Math.random().toString(36).slice(2)}`,
          url: d.url, filename: file.name, alt: "",
          mime: file.type, size: file.size,
          storage: d.storage || "blob", createdAt: new Date().toISOString(),
        });
      } catch { setError("تعذّر الاتصال أثناء الرفع."); }
    }
    if (added.length) setItems((l) => [...added, ...l]);
    setBusy(false);
  };

  const saveAlt = async (item, alt) => {
    setItems((l) => l.map((m) => (m.id === item.id ? { ...m, alt } : m)));
    if (String(item.id).startsWith("tmp-")) return;   // لم يُحمَّل معرّفه الحقيقي بعد
    await fetch("/api/admin/media", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, alt }),
    }).catch(() => {});
  };

  const askDelete = async (item, force = false) => {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/admin/media?id=${item.id}${force ? "&force=1" : ""}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (res.status === 409) { setConfirm({ item, usage: d.usage || [] }); return; }
      if (!res.ok) { setError(d.error || "تعذّر الحذف."); return; }
      setItems((l) => l.filter((m) => m.id !== item.id));
      setSelected(null); setConfirm(null);
    } finally { setBusy(false); }
  };

  const copy = (url, id) => {
    navigator.clipboard?.writeText(url);
    setCopied(id); setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="flex flex-col gap-5">

      {!pickMode && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: "عدد الملفات", v: n(stats.count), icon: ImageIcon },
            { l: "الحجم الكلي", v: humanSize(stats.bytes), icon: HardDrive },
          ].map((s) => (
            <div key={s.l} className="p-4 rounded-2xl flex items-center gap-3"
                 style={{ background: T.softTint, border: `1px solid ${T.line}` }}>
              <s.icon size={16} style={{ color: T.accent }} />
              <div>
                <p className="text-[11px] font-bold" style={{ color: T.muted }}>{s.l}</p>
                <p className="text-base leading-none num" style={{ color: T.primary, ...H }}>{s.v}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ الرفع والبحث ══ */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none" color={T.mutedLight} />
          <input value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="ابحث بالاسم أو النص البديل…"
                 className="w-full pr-11 pl-4 py-3 rounded-xl text-sm outline-none"
                 style={{ border: `1px solid ${T.line}`, background: "#fff" }} />
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
               onChange={(e) => e.target.files?.length && uploadFiles(e.target.files)} />
        <button onClick={() => fileRef.current?.click()} disabled={busy}
                className="px-5 py-3 rounded-xl text-[13px] font-bold flex items-center gap-2 justify-center shrink-0"
                style={{ background: T.primary, color: "#fff" }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} رفع صور
        </button>
      </div>

      {error && (
        <p className="text-xs font-bold px-4 py-3 rounded-xl" style={{ background: `${T.danger}12`, color: T.danger }}>{error}</p>
      )}

      {/* ══ تأكيد حذف صورة مستعملة ══ */}
      {confirm && (
        <div className="p-5 rounded-2xl flex flex-col gap-3"
             style={{ background: `${T.danger}0D`, border: `1px solid ${T.danger}44` }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={17} style={{ color: T.danger }} className="shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold mb-1.5" style={{ color: T.ink }}>
                هذه الصورة مستعملة في {n(confirm.usage.length)} موضع
              </p>
              <ul className="text-[12px] flex flex-col gap-1 mb-2" style={{ color: T.muted }}>
                {confirm.usage.map((u, i) => (
                  <li key={i}>• {u.type}: {u.label}</li>
                ))}
              </ul>
              <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>
                حذفها يترك مربّعًا مكسورًا في هذه المواضع. استبدلها أولًا أو احذفها رغم ذلك.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => askDelete(confirm.item, true)} disabled={busy}
                    className="px-4 py-2.5 rounded-xl text-[12px] font-bold"
                    style={{ background: T.danger, color: "#fff" }}>
              احذفها رغم ذلك
            </button>
            <button onClick={() => setConfirm(null)} className="px-4 py-2.5 rounded-xl text-[12px]"
                    style={{ color: T.muted }}>إلغاء</button>
          </div>
        </div>
      )}

      {/* ══ الشبكة ══ */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl text-center" style={card}>
          <ImageIcon size={24} style={{ color: T.mutedLight }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: T.muted }}>
            {items.length === 0 ? "لا صور بعد — ارفع أول صورة." : "لا نتائج مطابقة."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filtered.map((m) => (
            <div key={m.id} className="rounded-2xl overflow-hidden group relative" style={card}>
              <button
                onClick={() => (pickMode ? onPick?.(m) : setSelected(m))}
                className="block w-full aspect-square overflow-hidden"
                style={{ background: T.surfaceAlt }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt || ""} loading="lazy"
                     className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </button>
              <div className="p-2.5">
                <p className="text-[11px] truncate mb-1" style={{ color: T.ink }}>{m.filename || "بلا اسم"}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] num" style={{ color: T.mutedLight }}>{humanSize(m.size)}</span>
                  {!m.alt && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{ background: `${T.warning}18`, color: T.warning }}>بلا نص بديل</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ تفاصيل الصورة ══ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: "rgba(26,23,24,.6)" }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "#fff" }}
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.line}` }}>
              <h3 className="text-sm" style={{ color: T.primary, ...H }}>تفاصيل الصورة</h3>
              <button onClick={() => setSelected(null)} style={{ color: T.muted }}><X size={17} /></button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.url} alt={selected.alt || ""}
                 className="w-full max-h-72 object-contain" style={{ background: T.surfaceAlt }} />

            <div className="p-5 flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold tracking-[.12em] uppercase mb-1.5 block" style={{ color: T.mutedLight }}>
                  النص البديل
                </label>
                <input defaultValue={selected.alt}
                       onBlur={(e) => saveAlt(selected, e.target.value)}
                       placeholder="وصف مختصر لما تعرضه الصورة"
                       className={field} style={fieldStyle} />
                <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: T.mutedLight }}>
                  يظهر لقارئات الشاشة وحين تفشل الصورة، وتقرؤه محركات البحث.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px]" style={{ color: T.muted }}>
                <span>{humanSize(selected.size)}</span>
                <span>·</span>
                <span>{selected.mime}</span>
                <span>·</span>
                <span>{selected.storage === "local" ? "تخزين محلي" : "Vercel Blob"}</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => copy(selected.url, selected.id)}
                        className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5"
                        style={{ background: T.softTint, color: T.primary }}>
                  {copied === selected.id ? <Check size={14} /> : <Copy size={14} />}
                  {copied === selected.id ? "نُسخ الرابط" : "نسخ الرابط"}
                </button>
                <a href={selected.url} target="_blank" rel="noopener noreferrer"
                   className="w-11 rounded-xl flex items-center justify-center"
                   style={{ background: T.surfaceAlt, color: T.muted }}>
                  <ExternalLink size={15} />
                </a>
                <button onClick={() => askDelete(selected)} disabled={busy}
                        className="w-11 rounded-xl flex items-center justify-center"
                        style={{ background: `${T.danger}10`, color: T.danger }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
