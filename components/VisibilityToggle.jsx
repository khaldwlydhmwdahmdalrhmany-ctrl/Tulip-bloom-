"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

/**
 * مفتاح إظهار/إخفاء سريع من القائمة — بلا فتح صفحة التعديل.
 * الإخفاء لا يحذف شيئًا؛ يمكن التراجع فورًا.
 */
export default function VisibilityToggle({ id, visible, endpoint, field = "published", labels }) {
  const router = useRouter();
  const [on, setOn] = useState(visible);
  const [busy, setBusy] = useState(false);

  const L = labels || { shown: "ظاهر", hidden: "مخفي" };

  const toggle = async () => {
    const next = !on;
    setOn(next); setBusy(true);
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setOn(!next);   // تراجع بصري عند فشل الشبكة
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={on ? "إخفاء عن الزوار" : "إظهار للزوار"}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
      style={on
        ? { background: "#E7F7EF", color: "#1B7A52" }
        : { background: "#FDECEC", color: "#B93030" }}
    >
      {busy ? <Loader2 size={12} className="animate-spin" /> : on ? <Eye size={12} /> : <EyeOff size={12} />}
      {on ? L.shown : L.hidden}
    </button>
  );
}
