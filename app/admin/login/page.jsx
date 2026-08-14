"use client";
import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const C = { navy: "#0C1C77", teal: "#00C6C7", line: "#E1ECE8", slate: "#5C6B72" };

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(searchParams.get("next") || "/admin");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "حدث خطأ، حاول مرة أخرى");
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl p-8 flex flex-col gap-4">
      <h1 className="font-display text-xl text-center" style={{ color: C.navy, fontWeight: 800 }}>
        لوحة تحكم لوحة التحكم
      </h1>
      <input
        placeholder="اسم المستخدم"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{ border: `1.5px solid ${C.line}` }}
      />
      <input
        type="password"
        placeholder="كلمة المرور"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{ border: `1.5px solid ${C.line}` }}
      />
      {error && <p className="text-xs text-center" style={{ color: "#c05050" }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-full font-bold text-sm"
        style={{ background: C.navy, color: "#fff" }}
      >
        {loading ? "جاري الدخول..." : "تسجيل الدخول"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.navy }}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
