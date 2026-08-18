"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, ShieldCheck } from "lucide-react";
import { C } from "../../lib/colors.js";

export default function ProfileForm({ customer }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: customer.name || "", phone: customer.phone || "",
    marketingOptIn: !!customer.marketingOptIn,
  });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  const field = "w-full mt-2 px-4 py-3.5 rounded-xl text-sm outline-none transition-colors focus:border-[color:var(--c-accent)]";
  const fieldStyle = { border: `1px solid ${C.line}`, background: C.pearl };
  const label = "text-[10px] font-bold tracking-[.14em] uppercase";

  const save = async (payload, successMsg) => {
    setBusy(true); setError(""); setMsg("");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "تعذّر الحفظ."); return; }
      if (data.reauth) {
        // تغيير كلمة المرور أبطل كل الجلسات — بما فيها هذه
        router.push("/account/login"); router.refresh(); return;
      }
      setMsg(successMsg); router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* البيانات */}
      <div className="p-6 sm:p-7 rounded-2xl flex flex-col gap-4" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <h2 className="h-card font-display" style={{ color: C.navy }}>المعلومات الأساسية</h2>

        <div>
          <label className={label} style={{ color: C.slateLight }}>البريد الإلكتروني</label>
          <input value={customer.email} disabled dir="ltr"
                 className={`${field} text-right`} style={{ ...fieldStyle, opacity: .6 }} />
          <p className="text-[11px] mt-2" style={{ color: C.slateLight }}>
            لتغيير البريد راسلنا على واتساب — نتحقّق من الهوية أولًا حمايةً لحسابك.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label} style={{ color: C.slateLight }}>الاسم</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                   autoComplete="name" className={field} style={fieldStyle} />
          </div>
          <div>
            <label className={label} style={{ color: C.slateLight }}>رقم الجوال</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                   type="tel" dir="ltr" autoComplete="tel" className={`${field} text-right`} style={fieldStyle} />
          </div>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.marketingOptIn}
                 onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })}
                 className="mt-1" style={{ accentColor: C.teal }} />
          <span className="text-[12px] leading-relaxed" style={{ color: C.slate }}>
            أرغب في تلقّي العروض الموسمية وتذكيرات المناسبات.
          </span>
        </label>

        <button onClick={() => save(form, "حُفظت بياناتك.")} disabled={busy}
                className="btn w-fit px-6 py-3 text-sm" style={{ background: C.navy, color: "#fff" }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} حفظ
        </button>
      </div>

      {/* كلمة المرور */}
      <div className="p-6 sm:p-7 rounded-2xl flex flex-col gap-4" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <h2 className="h-card font-display flex items-center gap-2" style={{ color: C.navy }}>
          <ShieldCheck size={17} style={{ color: C.teal }} /> كلمة المرور
        </h2>
        <p className="text-[12px] leading-relaxed" style={{ color: C.slate }}>
          تغييرها يُسجّل خروجك من كل الأجهزة — بما فيها هذا الجهاز.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label} style={{ color: C.slateLight }}>الحالية</label>
            <input type="password" dir="ltr" autoComplete="current-password"
                   value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                   className={`${field} text-right`} style={fieldStyle} />
          </div>
          <div>
            <label className={label} style={{ color: C.slateLight }}>الجديدة</label>
            <input type="password" dir="ltr" autoComplete="new-password"
                   value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                   className={`${field} text-right`} style={fieldStyle} />
          </div>
        </div>
        <button onClick={() => save(pw, "")} disabled={busy || !pw.currentPassword || !pw.newPassword}
                className="btn w-fit px-6 py-3 text-sm"
                style={{ background: C.navy, color: "#fff", opacity: (!pw.currentPassword || !pw.newPassword) ? .5 : 1 }}>
          تغيير كلمة المرور
        </button>
      </div>

      {msg && <p className="text-xs font-bold px-4 py-3 rounded-xl" style={{ background: `${C.success}12`, color: C.success }}>{msg}</p>}
      {error && <p className="text-xs font-bold px-4 py-3 rounded-xl" style={{ background: `${C.danger}12`, color: C.danger }}>{error}</p>}
    </div>
  );
}
