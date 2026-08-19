"use client";
/**
 * منتقي الوسائط — نافذة تختار صورة من المكتبة أو ترفع جديدة.
 *
 * ⚠️ يعيد استخدام `MediaLibrary` بوضع `pickMode` بدل نسخ الشبكة
 * والرفع مرة ثانية. النسخ يعني أن أي تحسين لاحق (كالبحث أو
 * تحرير النص البديل) يجب تطبيقه مرتين، وسينسى أحدهما.
 */
import React, { useState, useEffect } from "react";
import { X, Images, Loader2 } from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";
import MediaLibrary from "./MediaLibrary.jsx";

const T = themeColors();

export default function MediaPicker({ open, onClose, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) =>
        setItems(
          (d.media || []).map((m) => ({
            id: m.id, url: m.url, filename: m.filename || "", alt: m.alt || "",
            mime: m.mime || "", size: Number(m.size || 0), storage: m.storage || "blob",
          }))
        )
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 overflow-y-auto"
         style={{ background: "rgba(26,23,24,.6)" }} onClick={onClose}>
      <div className="w-full max-w-4xl rounded-3xl overflow-hidden my-8"
           style={{ background: "#fff" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.line}` }}>
          <h3 className="text-sm flex items-center gap-2"
              style={{ color: T.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
            <Images size={16} /> اختر من المكتبة
          </h3>
          <button onClick={onClose} style={{ color: T.muted }}><X size={17} /></button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 size={20} className="animate-spin" style={{ color: T.accent }} />
            </div>
          ) : (
            <MediaLibrary
              initial={items}
              pickMode
              onPick={(m) => { onSelect(m.url, m); onClose(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
