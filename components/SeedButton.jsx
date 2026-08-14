"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Database } from "lucide-react";

const C = { navy: "#0C1C77", slate: "#5C6B72" };

export default function SeedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const run = async () => {
    if (!confirm("سيتم إضافة 6 تصنيفات و22 منتجًا تجريبيًا لقاعدة البيانات. تابع؟")) return;
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/admin/seed", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage({ type: "ok", text: `✅ تمت الإضافة: ${data.categories} تصنيفات، ${data.products} منتج.` });
      router.refresh();
    } else {
      setMessage({ type: "error", text: data.error || "حدث خطأ" });
    }
  };

  return (
    <div className="p-4 rounded-2xl flex flex-col gap-2" style={{ background: "#fff", border: "1px solid #E1ECE8" }}>
      <div className="flex items-center gap-2">
        <Database size={16} color={C.navy} />
        <span className="text-sm font-bold" style={{ color: C.navy }}>تعبئة البيانات الأولية (مرة واحدة)</span>
      </div>
      <p className="text-xs" style={{ color: C.slate }}>
        يضيف تصنيفات ومنتجات المتجر الحالية إلى قاعدة البيانات المتصلة. يعمل مرة واحدة فقط — إذا كانت القاعدة فيها منتجات بالفعل لن يكرر الإضافة.
      </p>
      <button
        onClick={run}
        disabled={loading}
        className="self-start px-4 py-2 rounded-full text-xs font-bold"
        style={{ background: C.navy, color: "#fff" }}
      >
        {loading ? "جاري التعبئة..." : "تعبئة الآن"}
      </button>
      {message && (
        <p className="text-xs" style={{ color: message.type === "ok" ? "#1a8a5a" : "#c05050" }}>{message.text}</p>
      )}
    </div>
  );
}
