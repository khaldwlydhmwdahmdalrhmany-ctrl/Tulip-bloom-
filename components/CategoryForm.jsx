"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader.jsx";

const C = { navy: "#0C1C77", line: "#E1ECE8", slate: "#5C6B72" };

const ICONS = ["Droplet", "Filter", "Wrench", "Package", "Building2", "Refrigerator", "Tag", "Star", "Snowflake", "Coffee", "Waves"];

const slugify = (text) =>
  text
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export default function CategoryForm({ initial, categoryId }) {
  const router = useRouter();
  const [form, setForm] = useState(
    initial || { name: "", slug: "", tagline: "", color: "#0C1C77", icon: "Package", bannerUrl: "", sortOrder: 0 }
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onNameChange = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: categoryId ? f.slug : slugify(name) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || (!categoryId && !form.slug.trim())) {
      setError("الاسم مطلوب");
      return;
    }
    setSaving(true);
    const url = categoryId ? `/api/categories/${categoryId}` : "/api/categories";
    const method = categoryId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/categories");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "حدث خطأ أثناء الحفظ");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 w-full max-w-xl">
      <div>
        <label className="text-xs font-bold" style={{ color: C.navy }}>اسم التصنيف</label>
        <input value={form.name} onChange={onNameChange} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0" style={{ border: `1.5px solid ${C.line}` }} />
      </div>

      {!categoryId && (
        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>المعرّف بالإنجليزي (slug) — يُستخدم في رابط الصفحة</label>
          <input value={form.slug} onChange={set("slug")} dir="ltr" className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0" style={{ border: `1.5px solid ${C.line}` }} />
        </div>
      )}

      <div>
        <label className="text-xs font-bold" style={{ color: C.navy }}>وصف قصير (يظهر أسفل اسم التصنيف)</label>
        <input value={form.tagline || ""} onChange={set("tagline")} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0" style={{ border: `1.5px solid ${C.line}` }} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>اللون</label>
          <input type="color" value={form.color} onChange={set("color")} className="w-full mt-1 h-11 rounded-xl" style={{ border: `1.5px solid ${C.line}` }} />
        </div>
        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>الأيقونة</label>
          <select value={form.icon} onChange={set("icon")} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none bg-white" style={{ border: `1.5px solid ${C.line}` }}>
            {ICONS.map((i) => (<option key={i} value={i}>{i}</option>))}
          </select>
        </div>
      </div>

      <ImageUploader
        value={form.bannerUrl}
        onChange={(url) => setForm((f) => ({ ...f, bannerUrl: url }))}
        preset="banner"
        label="بنر التصنيف (اختياري — يظهر أعلى صفحة هذا التصنيف)"
      />

      <div>
        <label className="text-xs font-bold" style={{ color: C.navy }}>ترتيب الظهور (رقم أصغر = أول)</label>
        <input type="number" value={form.sortOrder ?? 0} onChange={set("sortOrder")} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0" style={{ border: `1.5px solid ${C.line}` }} />
      </div>

      {error && <p className="text-sm" style={{ color: "#c05050" }}>{error}</p>}

      <button type="submit" disabled={saving} className="w-full py-3 rounded-full font-bold text-sm" style={{ background: C.navy, color: "#fff" }}>
        {saving ? "جاري الحفظ..." : categoryId ? "حفظ التعديلات" : "إضافة التصنيف"}
      </button>
    </form>
  );
}
