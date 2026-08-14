"use client";
import React, { useState } from "react";
import { Save, Check, Loader2, Eye, EyeOff, ExternalLink, AlertCircle } from "lucide-react";

const C = { navy: "#0C1C77", slate: "#4A5A63", line: "#E1ECE8", teal: "#00C6C7", success: "#1B9C68", danger: "#D64545", offWhite: "#F6FAF9" };

/** قوالب بدء — نقاط استرشادية لا نصًا قانونيًا جاهزًا. */
const TEMPLATES = {
  terms: `## التعريفات
يقصد بـ«المتجر» متجر المتجر، و«العميل» كل من يستخدم الموقع أو يقدّم طلبًا.

## الطلبات والأسعار
- جميع الأسعار المعروضة بالريال السعودي وشاملة ضريبة القيمة المضافة.
- يُعد الطلب مؤكدًا بعد تأكيد فريقنا له عبر واتساب.
- نحتفظ بحق رفض أي طلب في حال نفاد الكمية أو وجود خطأ في السعر.

## الضمان
- مدة الضمان تختلف حسب نوع الجهاز وتُذكر في صفحة كل منتج.
- لا يشمل الضمان سوء الاستخدام أو التركيب من جهة غير معتمدة.

## حدود المسؤولية
اكتب هنا حدود مسؤولية المتجر.

## القانون المطبّق
تخضع هذه الشروط لأنظمة المملكة العربية السعودية.`,

  returns: `## مدة الاسترجاع
يحق للعميل طلب استرجاع المنتج خلال ٧ أيام من تاريخ الاستلام. (عدّل المدة حسب سياستك)

## شروط الاسترجاع
- أن يكون المنتج بحالته الأصلية وبكامل ملحقاته وتغليفه.
- ألا يكون قد تم تركيبه أو استخدامه.
- إرفاق فاتورة الشراء.

## منتجات غير قابلة للاسترجاع
- المنتجات القابلة للاستهلاك بعد فتح تغليفها.
- المنتجات المصنّعة حسب الطلب.

## آلية الاسترجاع
تواصل معنا عبر واتساب مع رقم طلبك، ويتم ترتيب الاستلام وردّ المبلغ خلال المدة النظامية.

## الاستبدال
اكتب هنا شروط الاستبدال إن اختلفت عن الاسترجاع.`,

  shipping: `## مناطق الشحن
نشحن إلى جميع مناطق المملكة العربية السعودية.

## مدة التوصيل
- الرياض وجدة والدمام: ١ – ٣ أيام عمل.
- بقية المناطق: ٣ – ٧ أيام عمل.

## رسوم الشحن
- الشحن مجاني للطلبات فوق ٥٠٠ ريال.
- تُحتسب رسوم الشحن للطلبات الأقل حسب المدينة.

## التركيب
التركيب مجاني على المنتجات التي تحمل شارة «تركيب مجاني».

## طرق الدفع
- الدفع عند الاستلام.
- التحويل البنكي.
- (أضف بقية الطرق المتاحة لديك)`,
};

export default function LegalEditor({ page }) {
  const [form, setForm] = useState({
    title: page.title || "",
    content: page.content || "",
    metaDescription: page.metaDescription || "",
    published: page.published !== false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setDirty(true);
  };

  const loadTemplate = () => {
    if (form.content.trim() && !confirm("سيستبدل القالب المحتوى الحالي. متابعة؟")) return;
    setForm((f) => ({ ...f, content: TEMPLATES[page.slug] || "" }));
    setDirty(true);
  };

  const save = async () => {
    if (!form.title.trim()) { setError("العنوان مطلوب"); return; }
    if (form.published && !form.content.trim()) {
      setError("لا يمكن نشر صفحة فارغة — اكتب المحتوى أولًا أو أبقِها مخفية.");
      return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/legal/${page.slug}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "فشل الحفظ");
      setSaved(true); setDirty(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const field = "w-full px-4 py-2.5 rounded-xl text-sm outline-none min-w-0";
  const fStyle = { border: `1.5px solid ${C.line}`, background: "#fff" };

  return (
    <div className="flex flex-col gap-4">
      <div className="p-5 rounded-2xl flex flex-col gap-4" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h2 className="font-bold text-sm" style={{ color: C.navy }}>{page.title}</h2>
            <p className="text-[11px] mt-0.5" dir="ltr" style={{ color: C.slate }}>/legal/{page.slug}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={loadTemplate} className="btn px-3 py-2 text-[11px]" style={{ background: C.offWhite, color: C.navy }}>
              إدراج قالب
            </button>
            {form.published && form.content.trim() && (
              <a href={`/legal/${page.slug}`} target="_blank" rel="noopener noreferrer" className="btn px-3 py-2 text-[11px]" style={{ background: C.offWhite, color: C.navy }}>
                <ExternalLink size={12} /> معاينة
              </a>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold block mb-1.5" style={{ color: C.navy }}>عنوان الصفحة</label>
          <input value={form.title} onChange={set("title")} className={field} style={fStyle} />
        </div>

        <div>
          <label className="text-xs font-bold block mb-1.5" style={{ color: C.navy }}>وصف مختصر (للسيو)</label>
          <input value={form.metaDescription} onChange={set("metaDescription")} maxLength={300}
                 placeholder="سطر واحد يظهر في نتائج البحث" className={field} style={fStyle} />
        </div>

        <div>
          <label className="text-xs font-bold block mb-1.5" style={{ color: C.navy }}>المحتوى</label>
          <textarea value={form.content} onChange={set("content")} rows={18}
                    placeholder="اكتب المحتوى هنا…"
                    className={`${field} font-mono leading-relaxed`} style={{ ...fStyle, fontSize: "13px" }} />
          <div className="text-[11px] mt-2 leading-relaxed p-3 rounded-lg" style={{ background: C.offWhite, color: C.slate }}>
            <strong>التنسيق:</strong> ابدأ السطر بـ <code>##</code> لعنوان فرعي · ابدأه بـ <code>-</code> لعنصر قائمة ·
            اترك سطرًا فارغًا بين الفقرات.
          </div>
        </div>

        {/* النشر */}
        <button type="button" onClick={() => { setForm((f) => ({ ...f, published: !f.published })); setDirty(true); }}
                className="flex items-center justify-between gap-3 p-3 rounded-xl text-right"
                style={{ background: form.published ? "#E7F7EF" : "#FDECEC" }}>
          <span className="flex items-center gap-2">
            {form.published ? <Eye size={15} color={C.success} /> : <EyeOff size={15} color={C.danger} />}
            <span className="flex flex-col">
              <span className="text-xs font-bold" style={{ color: C.navy }}>
                {form.published ? "الصفحة منشورة" : "الصفحة مخفية"}
              </span>
              <span className="text-[11px]" style={{ color: C.slate }}>
                {form.published ? "تظهر في التذييل وخريطة الموقع" : "لا تظهر للزوار"}
              </span>
            </span>
          </span>
          <span className="w-11 h-6 rounded-full shrink-0 flex items-center px-0.5 transition-colors"
                style={{ background: form.published ? C.success : "#C9D4D0" }}>
            <span className="w-5 h-5 rounded-full bg-white transition-transform"
                  style={{ transform: form.published ? "translateX(-20px)" : "translateX(0)" }} />
          </span>
        </button>

        {error && (
          <p className="text-xs font-bold px-3 py-2.5 rounded-lg flex items-center gap-2" style={{ background: `${C.danger}12`, color: C.danger }}>
            <AlertCircle size={14} className="shrink-0" /> {error}
          </p>
        )}

        <button onClick={save} disabled={saving || !dirty}
                className="btn w-full py-3 text-sm disabled:opacity-50"
                style={{ background: saved ? C.success : C.navy, color: "#fff" }}>
          {saving ? <><Loader2 size={15} className="animate-spin" /> جارٍ الحفظ…</>
            : saved ? <><Check size={15} /> حُفظت</>
            : <><Save size={15} /> حفظ التغييرات</>}
        </button>
      </div>
    </div>
  );
}
