"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Loader2, Check, AlertTriangle } from "lucide-react";
import { C } from "../../lib/colors.js";

export default function ResetForm({ token }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const field = "w-full mt-2 px-4 py-3.5 rounded-xl text-sm outline-none transition-colors focus:border-[color:var(--c-accent)]";
  const fieldStyle = { border: `1px solid ${C.line}`, background: C.pearl };

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/account/reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || "تعذّر تغيير كلمة المرور."); return; }
      setDone(true);
      setTimeout(() => router.push("/account/login"), 2000);
    } finally { setBusy(false); }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-3xl text-center"
           style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <AlertTriangle size={22} style={{ color: C.warning }} className="mx-auto mb-4" />
        <p className="text-sm mb-5" style={{ color: C.slate }}>
          الرابط ناقص. اطلب رابطًا جديدًا منّا على واتساب.
        </p>
        <Link href="/account/login" className="btn px-6 py-3 text-sm" style={{ background: C.navy, color: "#fff" }}>
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-3xl text-center"
           style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <Check size={24} style={{ color: C.success }} className="mx-auto mb-4" />
        <p className="text-sm" style={{ color: C.navy }}>تم تغيير كلمة المرور. جارٍ تحويلك…</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md mx-auto">
      <div className="p-7 sm:p-9 rounded-3xl" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <span className="eyebrow mb-3">استعادة الوصول</span>
        <h1 className="h-section font-display mb-2" style={{ color: C.navy }}>كلمة مرور جديدة</h1>
        <p className="text-sm mb-7 leading-relaxed" style={{ color: C.slate }}>
          تغييرها يُسجّل خروجك من كل الأجهزة.
        </p>

        <label className="text-[10px] font-bold tracking-[.14em] uppercase flex items-center gap-1.5"
               style={{ color: C.slateLight }}>
          <Lock size={12} /> كلمة المرور الجديدة *
        </label>
        <input value={password} onChange={(e) => setPassword(e.target.value)}
               type="password" dir="ltr" autoComplete="new-password"
               placeholder="٨ أحرف على الأقل"
               className={`${field} text-right`} style={fieldStyle} required />

        {error && (
          <p className="text-xs font-bold px-4 py-3 rounded-xl mt-4" style={{ background: `${C.danger}12`, color: C.danger }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn w-full py-4 text-sm mt-5"
                style={{ background: C.navy, color: "#fff", opacity: busy ? .6 : 1 }}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : null} تغيير كلمة المرور
        </button>
      </div>
    </form>
  );
}
