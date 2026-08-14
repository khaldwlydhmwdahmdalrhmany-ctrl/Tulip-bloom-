"use client";
import React, { useState, useRef } from "react";
import { Upload, X, Loader2, Check, ImageIcon } from "lucide-react";
import { compressImage, formatBytes } from "../lib/imageProcessing.js";

const C = { navy: "#0C1C77", slate: "#4A5A63", line: "#E1ECE8", teal: "#00C6C7", success: "#1B9C68", danger: "#D64545", offWhite: "#F6FAF9" };

/**
 * رافع صور موحّد — يضغط ويحوّل إلى WebP في المتصفح قبل الرفع.
 * يُستخدم في نماذج المنتجات والتصنيفات والبنرات.
 */
export default function ImageUploader({ value, onChange, preset = "product", label = "الصورة", hint }) {
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true); setError(""); setStats(null);
    try {
      const result = await compressImage(file, preset);

      const fd = new FormData();
      fd.append("file", result.file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "فشل رفع الصورة");

      onChange(data.url);
      setStats(result);
    } catch (err) {
      setError(err.message || "تعذّر رفع الصورة");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="text-xs font-bold block mb-1.5" style={{ color: C.navy }}>{label}</label>

      <div className="flex items-start gap-3">
        {/* المعاينة */}
        <div
          className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: C.offWhite, border: `1.5px dashed ${value ? "transparent" : C.line}` }}
        >
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={22} color={C.line} />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="btn px-4 py-2.5 text-xs"
              style={{ background: C.navy, color: "#fff" }}
            >
              {busy ? <><Loader2 size={14} className="animate-spin" /> جارٍ الضغط والرفع…</>
                    : <><Upload size={14} /> {value ? "تغيير الصورة" : "رفع صورة"}</>}
            </button>

            {value && !busy && (
              <button
                type="button"
                onClick={() => { onChange(""); setStats(null); }}
                className="btn px-3 py-2.5 text-xs"
                style={{ background: C.offWhite, color: C.danger }}
              >
                <X size={14} /> إزالة
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={handle}
            className="hidden"
          />

          {/* نتيجة الضغط */}
          {stats && !busy && (
            <p className="text-[11px] flex items-center gap-1.5 flex-wrap" style={{ color: stats.saved > 0 ? C.success : C.slate }}>
              <Check size={12} className="shrink-0" />
              {stats.saved > 0 ? (
                <>
                  ضُغطت من {formatBytes(stats.before)} إلى <strong>{formatBytes(stats.after)}</strong>
                  {" "}(توفير {stats.saved}%)
                  {stats.dimensions && <span style={{ color: C.slate }}>· {stats.dimensions}</span>}
                  {stats.format === "image/webp" && <span style={{ color: C.slate }}>· WebP</span>}
                </>
              ) : (
                <>رُفعت بحجمها الأصلي ({formatBytes(stats.before)}) — كانت مضغوطة بالفعل.</>
              )}
            </p>
          )}

          {error && <p className="text-[11px] font-bold" style={{ color: C.danger }}>{error}</p>}

          {!stats && !error && (
            <p className="text-[11px] leading-relaxed" style={{ color: C.slate }}>
              {hint || "تُضغط الصورة وتُحوَّل إلى WebP تلقائيًا قبل الرفع — بلا خطوات منك."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
