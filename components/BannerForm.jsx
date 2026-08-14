"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BANNER_PLACEMENTS, BANNER_RATIOS, getRatioCss } from "../lib/banners.js";
import ImageUploader from "./ImageUploader.jsx";

const C = { navy: "#0C1C77", line: "#E1ECE8", slate: "#5C6B72" };

export default function BannerForm({ initial, bannerId }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(
    initial || {
      title: "", subtitle: "", placement: "home", categoryId: "", imageUrl: "",
      sortOrder: 0, active: true, ratio: "auto", ctaLabel: "", ctaHref: "",
    }
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("عنوان البنر مطلوب"); return; }
    if (form.placement === "category" && !form.categoryId) { setError("اختر التصنيف اللي بيظهر فيه البنر"); return; }

    const selectedCat = categories.find((c) => c.id === form.categoryId);
    const payload = { ...form, linkCategorySlug: selectedCat ? selectedCat.slug : null };

    setSaving(true);
    const url = bannerId ? `/api/banners/${bannerId}` : "/api/banners";
    const method = bannerId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/banners");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "حدث خطأ أثناء الحفظ");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 w-full max-w-xl">
      <div>
        <label className="text-xs font-bold" style={{ color: C.navy }}>عنوان البنر</label>
        <input value={form.title} onChange={set("title")} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0" style={{ border: `1.5px solid ${C.line}` }} />
      </div>

      <div>
        <label className="text-xs font-bold" style={{ color: C.navy }}>نص فرعي (اختياري)</label>
        <input value={form.subtitle || ""} onChange={set("subtitle")} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0" style={{ border: `1.5px solid ${C.line}` }} />
      </div>

      <div>
        <label className="text-xs font-bold" style={{ color: C.navy }}>مكان الظهور</label>
        <select value={form.placement} onChange={set("placement")} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none bg-white" style={{ border: `1.5px solid ${C.line}` }}>
          {BANNER_PLACEMENTS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
        <p className="text-xs mt-1" style={{ color: C.slate }}>
          {BANNER_PLACEMENTS.find((p) => p.key === form.placement)?.note}
        </p>
      </div>

      {(form.placement === "home" || form.placement === "category") && (
      <div>
        <label className="text-xs font-bold" style={{ color: C.navy }}>
          التصنيف {form.placement === "home" ? "(اختياري — وجهة النقر عند الضغط على البنر)" : "(الصفحة اللي بيظهر فيها البنر)"}
        </label>
        <select value={form.categoryId || ""} onChange={set("categoryId")} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none bg-white" style={{ border: `1.5px solid ${C.line}` }}>
          <option value="">— بدون —</option>
          {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
      </div>
      )}

      <ImageUploader
        value={form.imageUrl}
        onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
        preset="banner"
        label="صورة البنر"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>نص زر البنر (اختياري)</label>
          <input value={form.ctaLabel || ""} onChange={set("ctaLabel")} placeholder="مثال: تسوّق العرض" className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0" style={{ border: `1.5px solid ${C.line}` }} />
        </div>
        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>رابط الزر</label>
          <input value={form.ctaHref || ""} onChange={set("ctaHref")} placeholder="/offers" dir="ltr" className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none text-right" style={{ border: `1.5px solid ${C.line}` }} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>ترتيب الظهور</label>
          <input type="number" value={form.sortOrder ?? 0} onChange={set("sortOrder")} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0" style={{ border: `1.5px solid ${C.line}` }} />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold mt-6" style={{ color: C.navy }}>
          <input type="checkbox" checked={form.active !== false} onChange={set("active")} /> نشط (يظهر للزوار)
        </label>
      </div>

      {error && <p className="text-sm" style={{ color: "#c05050" }}>{error}</p>}

      <button type="submit" disabled={saving} className="w-full py-3 rounded-full font-bold text-sm" style={{ background: C.navy, color: "#fff" }}>
        {saving ? "جاري الحفظ..." : bannerId ? "حفظ التعديلات" : "إضافة البنر"}
      </button>
    </form>
  );
}
