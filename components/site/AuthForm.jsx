"use client";
/**
 * نموذج الدخول والتسجيل.
 *
 * ملاحظات تجربة مهمة:
 *  • `autoComplete` صحيح — بدونه لا يحفظ مدير كلمات المرور
 *    البيانات ولا يعرضها، وهذا وحده يخفض معدّل العودة.
 *  • زر إظهار كلمة المرور — إخفاؤها دائمًا يزيد الأخطاء على
 *    الجوال أكثر مما يحمي من نظرة عابرة.
 *  • رسائل الخطأ من الخادم كما هي — الخادم يوحّدها عمدًا.
 */
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone } from "lucide-react";
import { C } from "../../lib/colors.js";

export default function AuthForm({ mode = "login", next = "/account" }) {
  const isRegister = mode === "register";
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", marketingOptIn: false });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e?.preventDefault();
    setError(""); setBusy(true);
    try {
      const res = await fetch(`/api/account/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "تعذّر إتمام العملية."); setBusy(false); return; }
      router.push(next);
      router.refresh();
    } catch {
      setError("تعذّر الاتصال. تحقّق من الشبكة وحاول مجددًا.");
      setBusy(false);
    }
  };

  const field = "w-full mt-2 px-4 py-3.5 rounded-xl text-sm outline-none transition-colors focus:border-[color:var(--c-accent)]";
  const fieldStyle = { border: `1px solid ${C.line}`, background: C.pearl };
  const label = "text-[10px] font-bold tracking-[.14em] uppercase flex items-center gap-1.5";

  return (
    <form onSubmit={submit} className="w-full max-w-md mx-auto">
      <div className="p-7 sm:p-9 rounded-3xl" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <span className="eyebrow mb-3">{isRegister ? "حساب جديد" : "أهلًا بعودتك"}</span>
        <h1 className="h-section font-display mb-2" style={{ color: C.navy }}>
          {isRegister ? "أنشئ حسابك" : "تسجيل الدخول"}
        </h1>
        <p className="text-sm mb-7 leading-relaxed" style={{ color: C.slate }}>
          {isRegister
            ? "احفظ عناوينك ومستلميك، وتابع طلباتك، ولا تنسَ مناسبة."
            : "ادخل لمتابعة طلباتك وتذكيرات مناسباتك."}
        </p>

        <div className="flex flex-col gap-4">
          {isRegister && (
            <>
              <div>
                <label className={label} style={{ color: C.slateLight }}><User size={12} /> الاسم *</label>
                <input value={form.name} onChange={set("name")} autoComplete="name"
                       placeholder="اسمك الكريم" className={field} style={fieldStyle} required />
              </div>
              <div>
                <label className={label} style={{ color: C.slateLight }}><Phone size={12} /> رقم الجوال</label>
                <input value={form.phone} onChange={set("phone")} type="tel" inputMode="tel" dir="ltr"
                       autoComplete="tel" placeholder="05XXXXXXXX"
                       className={`${field} text-right`} style={fieldStyle} />
              </div>
            </>
          )}

          <div>
            <label className={label} style={{ color: C.slateLight }}><Mail size={12} /> البريد الإلكتروني *</label>
            <input value={form.email} onChange={set("email")} type="email" dir="ltr"
                   autoComplete="email" placeholder="name@example.com"
                   className={`${field} text-right`} style={fieldStyle} required />
          </div>

          <div>
            <label className={label} style={{ color: C.slateLight }}><Lock size={12} /> كلمة المرور *</label>
            <div className="relative">
              <input value={form.password} onChange={set("password")}
                     type={show ? "text" : "password"} dir="ltr"
                     autoComplete={isRegister ? "new-password" : "current-password"}
                     placeholder={isRegister ? "٨ أحرف على الأقل" : "••••••••"}
                     className={`${field} text-right pl-12`} style={fieldStyle} required />
              <button type="button" onClick={() => setShow((v) => !v)}
                      aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      className="absolute left-3 top-1/2 translate-y-[3px] w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ color: C.slateLight }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {isRegister && (
              <p className="text-[11px] mt-2 leading-relaxed" style={{ color: C.slateLight }}>
                عبارة طويلة تتذكّرها أقوى من رموز معقّدة تنساها.
              </p>
            )}
          </div>

          {isRegister && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.marketingOptIn} onChange={set("marketingOptIn")}
                     className="mt-1" style={{ accentColor: C.teal }} />
              <span className="text-[12px] leading-relaxed" style={{ color: C.slate }}>
                أرغب في تلقّي العروض الموسمية وتذكيرات المناسبات.
              </span>
            </label>
          )}

          {error && (
            <p className="text-xs font-bold px-4 py-3 rounded-xl leading-relaxed"
               style={{ background: `${C.danger}12`, color: C.danger }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn w-full py-4 text-sm mt-1"
                  style={{ background: C.navy, color: "#fff", opacity: busy ? .6 : 1 }}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {isRegister ? "إنشاء الحساب" : "دخول"}
          </button>

          <p className="text-[12px] text-center pt-1" style={{ color: C.slate }}>
            {isRegister ? "لديك حساب؟ " : "ما عندك حساب؟ "}
            <Link href={isRegister ? "/account/login" : "/account/register"}
                  className="font-bold" style={{ color: C.teal }}>
              {isRegister ? "سجّل الدخول" : "أنشئ حسابًا"}
            </Link>
          </p>

          {!isRegister && (
            <p className="text-[11px] text-center leading-relaxed" style={{ color: C.slateLight }}>
              نسيت كلمة المرور؟ راسلنا على واتساب ونعيد ضبطها لك.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
