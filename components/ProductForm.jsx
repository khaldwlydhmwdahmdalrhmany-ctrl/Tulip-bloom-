"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Star } from "lucide-react";
import BadgePicker from "./BadgePicker.jsx";
import ImageUploader from "./ImageUploader.jsx";

const C = { navy: "#0C1C77", teal: "#00C6C7", line: "#E1ECE8", slate: "#5C6B72", mintTint: "#EAF8F1" };

export default function ProductForm({ initial, productId }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(
    initial || {
      name: "", description: "", fullDescription: "", price: "", oldPrice: "",
      badge: "", imageUrl: "", freeShipping: false, freeInstall: false, categoryId: "",
      brand: "", stock: "in_stock", rating: "", reviewCount: "",
      published: true, sortOrder: 0, featuredOffer: false,
    }
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((data) => {
      setCategories(data);
      setForm((f) => (f.categoryId ? f : { ...f, categoryId: data[0]?.id || "" }));
    });
  }, []);

  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.categoryId || form.price === "") {
      setError("الاسم والتصنيف والسعر حقول مطلوبة");
      return;
    }
    setSaving(true);
    const url = productId ? `/api/products/${productId}` : "/api/products";
    const method = productId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        oldPrice: form.oldPrice === "" ? null : form.oldPrice,
        rating: form.rating === "" ? null : form.rating,
        reviewCount: form.reviewCount === "" ? null : form.reviewCount,
        brand: form.brand?.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
      }),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "حدث خطأ أثناء الحفظ");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 w-full max-w-xl">
      <div>
        <label className="text-xs font-bold" style={{ color: C.navy }}>اسم المنتج</label>
        <input value={form.name} onChange={set("name")} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0" style={{ border: `1.5px solid ${C.line}` }} />
      </div>

      <div>
        <label className="text-xs font-bold" style={{ color: C.navy }}>التصنيف</label>
        <select value={form.categoryId} onChange={set("categoryId")} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none bg-white" style={{ border: `1.5px solid ${C.line}` }}>
          {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
      </div>

      <div>
        <label className="text-xs font-bold" style={{ color: C.navy }}>وصف مختصر (يظهر في بطاقة المنتج)</label>
        <textarea value={form.description} onChange={set("description")} rows={2} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ border: `1.5px solid ${C.line}` }} />
      </div>

      <div>
        <label className="text-xs font-bold" style={{ color: C.navy }}>الوصف الكامل (يظهر في صفحة المنتج)</label>
        <textarea value={form.fullDescription} onChange={set("fullDescription")} rows={4} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ border: `1.5px solid ${C.line}` }} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>السعر (ريال)</label>
          <input type="number" value={form.price} onChange={set("price")} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0" style={{ border: `1.5px solid ${C.line}` }} />
        </div>
        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>السعر قبل الخصم (اختياري)</label>
          <input type="number" value={form.oldPrice} onChange={set("oldPrice")} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0" style={{ border: `1.5px solid ${C.line}` }} />
        </div>
      </div>

      <BadgePicker value={form.badge} onChange={(v) => setForm((f) => ({ ...f, badge: v }))} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>الماركة (اختياري)</label>
          <input
            value={form.brand || ""}
            onChange={set("brand")}
            placeholder="مثال: GuldenPRO"
            className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0"
            style={{ border: `1.5px solid ${C.line}` }}
          />
          <p className="text-[11px] mt-1" style={{ color: C.slate }}>تظهر كخيار في فلتر الماركات بالمتجر.</p>
        </div>
        <div>
          <label className="text-xs font-bold" style={{ color: C.navy }}>حالة التوفر</label>
          <select
            value={form.stock || "in_stock"}
            onChange={set("stock")}
            className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none bg-white"
            style={{ border: `1.5px solid ${C.line}` }}
          >
            <option value="in_stock">متوفر</option>
            <option value="low_stock">كمية محدودة</option>
            <option value="out_of_stock">غير متوفر حاليًا</option>
            <option value="preorder">حجز مسبق</option>
          </select>
          <p className="text-[11px] mt-1" style={{ color: C.slate }}>«غير متوفر» يعطّل أزرار الشراء تلقائيًا.</p>
        </div>
      </div>

      <div className="p-4 rounded-xl" style={{ background: "#FFF8E7", border: "1px solid #F2B01E44" }}>
        <p className="text-xs font-bold mb-1" style={{ color: "#8A6200" }}>التقييمات — أدخل أرقامًا حقيقية فقط</p>
        <p className="text-[11px] leading-relaxed mb-3" style={{ color: "#8A6200" }}>
          اتركهما فارغين إن لم توجد تقييمات فعلية؛ عندها لا تظهر أي نجوم في المتجر.
          نشر تقييمات غير حقيقية مخالف لنظام التجارة الإلكترونية السعودي وقد يعاقب عليه محرك البحث.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>متوسط التقييم (1–5)</label>
            <input
              type="number" step="0.1" min="1" max="5"
              value={form.rating ?? ""}
              onChange={set("rating")}
              placeholder="فارغ = بلا تقييم"
              className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0"
              style={{ border: `1.5px solid ${C.line}` }}
            />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: C.navy }}>عدد التقييمات</label>
            <input
              type="number" min="0"
              value={form.reviewCount ?? ""}
              onChange={set("reviewCount")}
              placeholder="فارغ = بلا تقييم"
              className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0"
              style={{ border: `1.5px solid ${C.line}` }}
            />
          </div>
        </div>
      </div>

      <div>
        <ImageUploader
          value={form.imageUrl}
          onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
          preset="product"
          label="صورة المنتج"
        />
      </div>

      {/* الظهور والترتيب */}
      <div className="p-4 rounded-xl flex flex-col gap-4" style={{ background: C.mintTint }}>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
          className="flex items-center justify-between gap-3 text-right"
        >
          <span className="flex items-center gap-2">
            {form.published ? <Eye size={16} color="#1B9C68" /> : <EyeOff size={16} color="#D64545" />}
            <span className="flex flex-col">
              <span className="text-xs font-bold" style={{ color: C.navy }}>
                {form.published ? "المنتج ظاهر في المتجر" : "المنتج مخفي عن الزوار"}
              </span>
              <span className="text-[11px]" style={{ color: C.slate }}>
                الإخفاء لا يحذف المنتج ولا بياناته — يمكنك إعادته في أي وقت.
              </span>
            </span>
          </span>
          <span
            className="w-11 h-6 rounded-full shrink-0 flex items-center px-0.5 transition-colors"
            style={{ background: form.published ? "#1B9C68" : "#C9D4D0" }}
          >
            <span
              className="w-5 h-5 rounded-full bg-white transition-transform"
              style={{ transform: form.published ? "translateX(-20px)" : "translateX(0)" }}
            />
          </span>
        </button>

        <div className="grid sm:grid-cols-2 gap-4 pt-1" style={{ borderTop: `1px solid ${C.line}` }}>
          <div className="pt-3">
            <label className="text-xs font-bold" style={{ color: C.navy }}>ترتيب الظهور</label>
            <input
              type="number"
              value={form.sortOrder ?? 0}
              onChange={set("sortOrder")}
              className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none min-w-0"
              style={{ border: `1.5px solid ${C.line}` }}
            />
            <p className="text-[11px] mt-1" style={{ color: C.slate }}>الأصغر يظهر أولًا. اتركه 0 للترتيب الافتراضي.</p>
          </div>

          <label className="pt-3 flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.featuredOffer}
              onChange={set("featuredOffer")}
              className="mt-0.5 w-4 h-4 shrink-0"
              style={{ accentColor: "#F2B01E" }}
            />
            <span className="flex flex-col">
              <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: C.navy }}>
                <Star size={13} color="#F2B01E" /> تثبيت كصفقة الصدارة
              </span>
              <span className="text-[11px]" style={{ color: C.slate }}>
                يظهر في أعلى صفحة العروض ببطاقة كبيرة بدل الاختيار التلقائي.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm font-bold" style={{ color: C.navy }}>
          <input type="checkbox" checked={form.freeShipping} onChange={set("freeShipping")} /> شحن مجاني
        </label>
        <label className="flex items-center gap-2 text-sm font-bold" style={{ color: C.navy }}>
          <input type="checkbox" checked={form.freeInstall} onChange={set("freeInstall")} /> تركيب مجاني
        </label>
      </div>

      {error && <p className="text-sm" style={{ color: "#c05050" }}>{error}</p>}

      <button type="submit" disabled={saving} className="w-full py-3 rounded-full font-bold text-sm" style={{ background: C.navy, color: "#fff" }}>
        {saving ? "جاري الحفظ..." : productId ? "حفظ التعديلات" : "إضافة المنتج"}
      </button>
    </form>
  );
}
