"use client";
/**
 * ═══════════════════════════════════════════════════════════
 *  محرّر الصفحات
 * ═══════════════════════════════════════════════════════════
 *
 *  ── لماذا أسهم لا سحب وإفلات ──
 *  السحب والإفلات يبدو أفضل ويعمل أسوأ: يحتاج مكتبة، ويتعثّر
 *  على الجوال، ويصعب استعماله بلوحة المفاتيح. زرّا «أعلى/أسفل»
 *  يعملان في كل مكان ولا يضيفان تبعية.
 *
 *  ── الحفظ صريح لا تلقائي ──
 *  الحفظ التلقائي في محرّر بلوكات يعني نشر أخطاء مؤقتة على
 *  صفحة منشورة. المسودّة تُحفظ بضغطة، والنشر بضغطة منفصلة.
 */
import React, { useState, useRef } from "react";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save, Loader2, Check, Eye, EyeOff,
  Upload, X, Settings2, Copy, Images,
} from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";
import { getIcon } from "../lib/iconMap.js";
import MediaPicker from "./MediaPicker.jsx";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };

/**
 * ⭐ المحرّر يخدم الصفحات والمقالات معًا.
 *
 * `kind="post"` يغيّر: نقطة النهاية، وبادئة المعاينة، والحقول
 * الخاصة (الغلاف، المقتطف، التصنيف، الكاتب، مميّز).
 * البديل كان نسخ ٣٠٠ سطر — وكل تحسين لاحق للبلوكات سيُطبَّق
 * في نسخة وينسى في الأخرى.
 */
export default function PageEditor({ page: initial, blockTypes, kind = "page", categories = [] }) {
  const isPost = kind === "post";
  const endpoint = isPost ? "/api/admin/blog" : "/api/admin/pages";
  const publicPrefix = isPost ? "/blog/" : "/p/";
  const [page, setPage] = useState(initial);
  const [blocks, setBlocks] = useState(initial.blocks || []);
  const [open, setOpen] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [picker, setPicker] = useState(false);
  // منتقي الوسائط: نحتفظ بدالة الإسناد للحقل الذي فتحه
  const [mediaFor, setMediaFor] = useState(null);

  const card = { background: "#fff", border: `1px solid ${T.line}` };
  const field = "w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none";
  const fieldStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt };
  const label = "text-[10px] font-bold tracking-[.12em] uppercase mb-1.5 block";

  const save = async (over = {}) => {
    setBusy(true); setError(""); setSaved(false);
    try {
      const body = { ...page, ...over, blocks };
      const res = await fetch(endpoint, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || "تعذّر الحفظ."); return; }
      setPage((p) => ({ ...p, ...over, slug: (isPost ? d.post?.slug : d.page?.slug) ?? p.slug }));
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } finally { setBusy(false); }
  };

  /* ── البلوكات ── */
  const addBlock = (type) => {
    setBlocks((b) => [...b, { type, props: defaultsFor(type) }]);
    setOpen(blocks.length);
    setPicker(false);
  };
  const defaultsFor = (type) => {
    const d = {};
    for (const [k, f] of Object.entries(blockTypes[type].fields)) {
      if (f.kind === "list") d[k] = [emptyRow(f.item)];
      else if (f.kind === "select") d[k] = f.options[0];
      else if (f.kind === "number") d[k] = 4;
      else d[k] = "";
    }
    return d;
  };
  const emptyRow = (shape) => Object.fromEntries(Object.keys(shape).map((k) => [k, ""]));

  const setProp = (i, key, value) =>
    setBlocks((b) => b.map((blk, j) => (j === i ? { ...blk, props: { ...blk.props, [key]: value } } : blk)));

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    setBlocks((b) => { const c = [...b]; [c[i], c[j]] = [c[j], c[i]]; return c; });
    setOpen(j);
  };
  const removeBlock = (i) => {
    setBlocks((b) => b.filter((_, j) => j !== i));
    setOpen(-1);
  };
  const duplicate = (i) => {
    setBlocks((b) => {
      const c = [...b];
      c.splice(i + 1, 0, JSON.parse(JSON.stringify(b[i])));
      return c;
    });
  };

  /* ── قوائم داخل البلوك ── */
  const setRow = (bi, key, ri, k, v) =>
    setBlocks((b) => b.map((blk, j) => {
      if (j !== bi) return blk;
      const list = [...(blk.props[key] || [])];
      list[ri] = { ...list[ri], [k]: v };
      return { ...blk, props: { ...blk.props, [key]: list } };
    }));
  const addRow = (bi, key, shape) =>
    setBlocks((b) => b.map((blk, j) =>
      j === bi ? { ...blk, props: { ...blk.props, [key]: [...(blk.props[key] || []), emptyRow(shape)] } } : blk));
  const delRow = (bi, key, ri) =>
    setBlocks((b) => b.map((blk, j) =>
      j === bi ? { ...blk, props: { ...blk.props, [key]: (blk.props[key] || []).filter((_, x) => x !== ri) } } : blk));

  /* ── رفع الصور ── */
  const upload = async (file, onDone) => {
    const fd = new FormData();
    fd.append("file", file);
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || "تعذّر رفع الصورة."); return; }
      onDone(d.url);
    } finally { setBusy(false); }
  };

  const ImageField = ({ value, onChange }) => {
    const ref = useRef(null);
    return (
      <div className="flex gap-2">
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} dir="ltr"
               placeholder="https://…" className={`${field} text-right`} style={fieldStyle} />
        <input ref={ref} type="file" accept="image/*" className="hidden"
               onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], onChange)} />
        {/* اختيار من المكتبة — يمنع رفع نفس الصورة مرارًا */}
        <button onClick={() => setMediaFor(() => onChange)} type="button"
                title="اختر من المكتبة"
                className="px-3 rounded-xl shrink-0" style={{ background: T.surfaceAlt, color: T.muted }}>
          <Images size={15} />
        </button>
        <button onClick={() => ref.current?.click()} disabled={busy}
                className="px-3 rounded-xl shrink-0" style={{ background: T.softTint, color: T.primary }}>
          <Upload size={15} />
        </button>
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0"
               style={{ border: `1px solid ${T.line}` }} />
        )}
      </div>
    );
  };

  const renderField = (bi, key, f, value) => {
    const set = (v) => setProp(bi, key, v);
    if (f.kind === "area")
      return <textarea value={value || ""} onChange={(e) => set(e.target.value)} rows={f.rows || 3}
                       className={`${field} resize-none`} style={fieldStyle} />;
    if (f.kind === "select")
      return <select value={value || f.options[0]} onChange={(e) => set(e.target.value)} className={field} style={fieldStyle}>
               {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
             </select>;
    if (f.kind === "number")
      return <input type="number" value={value ?? ""} onChange={(e) => set(e.target.value)} className={field} style={fieldStyle} />;
    if (f.kind === "image")
      return <ImageField value={value} onChange={set} />;
    if (f.kind === "list") {
      const rows = value || [];
      return (
        <div className="flex flex-col gap-2">
          {rows.map((row, ri) => (
            <div key={ri} className="p-3 rounded-xl flex flex-col gap-2" style={{ background: "#fff", border: `1px solid ${T.line}` }}>
              {Object.entries(f.item).map(([ik, ikind]) => (
                <div key={ik}>
                  <span className="text-[10px] font-bold" style={{ color: T.mutedLight }}>{ik}</span>
                  {ikind === "area"
                    ? <textarea value={row[ik] || ""} onChange={(e) => setRow(bi, key, ri, ik, e.target.value)} rows={2}
                                className={`${field} resize-none`} style={fieldStyle} />
                    : ikind === "image"
                    ? <ImageField value={row[ik]} onChange={(v) => setRow(bi, key, ri, ik, v)} />
                    : <input value={row[ik] || ""} onChange={(e) => setRow(bi, key, ri, ik, e.target.value)}
                             className={field} style={fieldStyle} />}
                </div>
              ))}
              <button onClick={() => delRow(bi, key, ri)} className="text-[11px] w-fit" style={{ color: T.danger }}>
                حذف العنصر
              </button>
            </div>
          ))}
          <button onClick={() => addRow(bi, key, f.item)}
                  className="py-2 rounded-xl text-[12px] font-bold"
                  style={{ background: T.softTint, color: T.primary, border: `1px dashed ${T.accent}` }}>
            + عنصر
          </button>
        </div>
      );
    }
    return <input value={value || ""} onChange={(e) => set(e.target.value)}
                  dir={f.kind === "url" ? "ltr" : undefined}
                  className={`${field} ${f.kind === "url" ? "text-right" : ""}`} style={fieldStyle} />;
  };

  const live = page.status === "published";

  return (
    <div className="flex flex-col gap-5">

      <MediaPicker
        open={!!mediaFor}
        onClose={() => setMediaFor(null)}
        onSelect={(url) => mediaFor?.(url)}
      />

      {/* ══ شريط الأدوات ══ */}
      <div className="p-4 rounded-2xl flex flex-wrap items-center gap-3 sticky top-0 z-20"
           style={{ ...card, backdropFilter: "blur(8px)" }}>
        <div className="min-w-0 flex-1">
          <input value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })}
                 className="w-full text-lg outline-none bg-transparent"
                 style={{ color: T.primary, ...H }} />
          <p className="text-[11px]" dir="ltr" style={{ color: T.mutedLight, textAlign: "right" }}>{publicPrefix}{page.slug}</p>
        </div>

        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shrink-0"
              style={live ? { background: `${T.success}15`, color: T.success } : { background: T.surfaceAlt, color: T.muted }}>
          {live ? <Eye size={10} /> : <EyeOff size={10} />} {live ? "منشورة" : "مسودّة"}
        </span>

        {saved && <span className="flex items-center gap-1 text-[12px] font-bold shrink-0" style={{ color: T.success }}><Check size={13} /> حُفظ</span>}
        {busy && <Loader2 size={15} className="animate-spin shrink-0" style={{ color: T.accent }} />}

        <button onClick={() => setShowSettings((v) => !v)}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: T.surfaceAlt, color: T.muted }}>
          <Settings2 size={15} />
        </button>
        <a href={`${publicPrefix}${page.slug}`} target="_blank" rel="noopener noreferrer"
           className="px-4 py-2.5 rounded-xl text-[12px] font-bold shrink-0"
           style={{ background: T.surfaceAlt, color: T.primary }}>معاينة</a>
        <button onClick={() => save()} disabled={busy}
                className="px-4 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 shrink-0"
                style={{ background: T.softTint, color: T.primary }}>
          <Save size={14} /> حفظ
        </button>
        <button onClick={() => save({ status: live ? "draft" : "published" })} disabled={busy}
                className="px-4 py-2.5 rounded-xl text-[12px] font-bold shrink-0"
                style={{ background: live ? T.warning : T.primary, color: "#fff" }}>
          {live ? "إلغاء النشر" : "نشر"}
        </button>
      </div>

      {error && <p className="text-xs font-bold px-4 py-3 rounded-xl" style={{ background: `${T.danger}12`, color: T.danger }}>{error}</p>}

      {/* ══ الإعدادات ══ */}
      {showSettings && (
        <div className="p-5 rounded-2xl grid sm:grid-cols-2 gap-4" style={card}>
          <div>
            <label className={label} style={{ color: T.mutedLight }}>المسار (slug)</label>
            <input value={page.slug} onChange={(e) => setPage({ ...page, slug: e.target.value })}
                   dir="ltr" className={`${field} text-right`} style={fieldStyle} />
          </div>
          <div>
            <label className={label} style={{ color: T.mutedLight }}>ترتيب الظهور</label>
            <input type="number" value={page.sortOrder}
                   onChange={(e) => setPage({ ...page, sortOrder: Number(e.target.value) })}
                   className={field} style={fieldStyle} />
          </div>
          <div>
            <label className={label} style={{ color: T.mutedLight }}>عنوان السيو</label>
            <input value={page.seoTitle} onChange={(e) => setPage({ ...page, seoTitle: e.target.value })}
                   className={field} style={fieldStyle} />
          </div>
          <div>
            <label className={label} style={{ color: T.mutedLight }}>صورة المشاركة</label>
            <ImageField value={page.ogImage} onChange={(v) => setPage({ ...page, ogImage: v })} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} style={{ color: T.mutedLight }}>وصف السيو</label>
            <textarea value={page.seoDescription} onChange={(e) => setPage({ ...page, seoDescription: e.target.value })}
                      rows={2} className={`${field} resize-none`} style={fieldStyle} />
          </div>
          {isPost && (
            <>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>التصنيف</label>
                <select value={page.categoryId || ""} onChange={(e) => setPage({ ...page, categoryId: e.target.value })}
                        className={field} style={fieldStyle}>
                  <option value="">بلا تصنيف</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label} style={{ color: T.mutedLight }}>الكاتب</label>
                <input value={page.author || ""} onChange={(e) => setPage({ ...page, author: e.target.value })}
                       className={field} style={fieldStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className={label} style={{ color: T.mutedLight }}>صورة الغلاف</label>
                <ImageField value={page.coverImage} onChange={(v) => setPage({ ...page, coverImage: v })} />
              </div>
              <div className="sm:col-span-2">
                <label className={label} style={{ color: T.mutedLight }}>
                  المقتطف <span style={{ color: T.mutedLight }}>(يظهر في القائمة وRSS)</span>
                </label>
                <textarea value={page.excerpt || ""} onChange={(e) => setPage({ ...page, excerpt: e.target.value })}
                          rows={2} className={`${field} resize-none`} style={fieldStyle} />
              </div>
            </>
          )}

          <div className="sm:col-span-2 flex flex-wrap gap-5">
            {(isPost
              ? [["featured", "مقال مميّز"], ["noIndex", "منع الفهرسة"]]
              : [["showInFooter", "إظهار في الفوتر"], ["showInHeader", "إظهار في الهيدر"], ["noIndex", "منع الفهرسة"]]
            ).map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!page[k]} onChange={(e) => setPage({ ...page, [k]: e.target.checked })}
                       style={{ accentColor: k === "noIndex" ? T.danger : T.accent }} />
                <span className="text-[12px]" style={{ color: T.ink }}>{l}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ══ البلوكات ══ */}
      <div className="flex flex-col gap-3">
        {blocks.map((b, i) => {
          const def = blockTypes[b.type];
          if (!def) return null;
          const Icon = getIcon(def.icon);
          const isOpen = open === i;
          return (
            <div key={i} className="rounded-2xl overflow-hidden" style={card}>
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                   onClick={() => setOpen(isOpen ? -1 : i)}
                   style={{ background: isOpen ? T.softTint : "transparent" }}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: T.surfaceAlt, color: T.accent }}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold" style={{ color: T.primary }}>{def.label}</p>
                  <p className="text-[11px] truncate" style={{ color: T.mutedLight }}>
                    {b.props?.title || b.props?.text || b.props?.body || def.hint}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => move(i, -1)} disabled={i === 0}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ color: i === 0 ? T.line : T.muted }}><ChevronUp size={14} /></button>
                  <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ color: i === blocks.length - 1 ? T.line : T.muted }}><ChevronDown size={14} /></button>
                  <button onClick={() => duplicate(i)} title="تكرار"
                          className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: T.muted }}>
                    <Copy size={13} />
                  </button>
                  <button onClick={() => removeBlock(i)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: T.danger }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="px-4 py-4 flex flex-col gap-3" style={{ borderTop: `1px solid ${T.line}` }}>
                  {Object.entries(def.fields).map(([key, f]) => (
                    <div key={key}>
                      <label className={label} style={{ color: T.mutedLight }}>
                        {f.label}{f.required ? " *" : ""}
                      </label>
                      {renderField(i, key, f, b.props?.[key])}
                      {f.hint && <p className="text-[10px] mt-1" style={{ color: T.mutedLight }}>{f.hint}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══ إضافة بلوك ══ */}
      {picker ? (
        <div className="p-5 rounded-2xl" style={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm" style={{ color: T.primary, ...H }}>اختر نوع البلوك</h3>
            <button onClick={() => setPicker(false)} style={{ color: T.muted }}><X size={16} /></button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {Object.entries(blockTypes).map(([key, def]) => {
              const Icon = getIcon(def.icon);
              return (
                <button key={key} onClick={() => addBlock(key)}
                        className="p-4 rounded-xl text-right flex flex-col gap-2"
                        style={{ background: T.surfaceAlt, border: `1px solid ${T.line}` }}>
                  <span className="flex items-center gap-2">
                    <Icon size={15} style={{ color: T.accent }} />
                    <span className="text-[13px] font-bold" style={{ color: T.primary }}>{def.label}</span>
                  </span>
                  <span className="text-[11px] leading-relaxed" style={{ color: T.muted }}>{def.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button onClick={() => setPicker(true)}
                className="py-4 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2"
                style={{ background: T.softTint, color: T.primary, border: `1px dashed ${T.accent}` }}>
          <Plus size={16} /> أضف بلوكًا
        </button>
      )}
    </div>
  );
}
