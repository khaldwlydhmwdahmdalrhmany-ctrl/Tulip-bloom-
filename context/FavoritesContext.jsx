"use client";
/**
 * حالة المفضّلة المشتركة.
 *
 * ⚠️ لماذا سياق واحد لا طلب لكل زر:
 * صفحة المتجر تعرض ٢٥ بطاقة. لو جلب كل زر حالته وحده لصارت
 * ٢٥ طلبًا متوازيًا عند كل تحميل. هنا طلب واحد يملأ الجميع.
 *
 * التحديث متفائل (optimistic): القلب يمتلئ فورًا ثم يُصحَّح لو
 * فشل الخادم. الانتظار نصف ثانية لتأكيد الشبكة يجعل الزر يبدو
 * معطّلًا.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const Ctx = createContext(null);

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState(() => new Set());
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/account/favorites")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setAuthed(!!d.auth);
        setIds(new Set(d.favorites || []));
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => { alive = false; };
  }, []);

  const isFavorite = useCallback((id) => ids.has(id), [ids]);

  const toggle = useCallback(async (productId) => {
    // تحديث متفائل
    const wasOn = ids.has(productId);
    setIds((prev) => {
      const next = new Set(prev);
      wasOn ? next.delete(productId) : next.add(productId);
      return next;
    });

    try {
      const res = await fetch("/api/account/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) {
        // تراجع + إشارة للزر ليعرض دعوة لتسجيل الدخول
        setIds((prev) => { const n = new Set(prev); wasOn ? n.add(productId) : n.delete(productId); return n; });
        setAuthed(false);
        return { needsAuth: true };
      }
      const data = await res.json();
      setIds(new Set(data.favorites || []));
      return { on: data.on };
    } catch {
      setIds((prev) => { const n = new Set(prev); wasOn ? n.add(productId) : n.delete(productId); return n; });
      return { error: true };
    }
  }, [ids]);

  return (
    <Ctx.Provider value={{ ids, isFavorite, toggle, authed, ready, count: ids.size }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFavorites() {
  return useContext(Ctx) || {
    isFavorite: () => false, toggle: async () => ({}),
    authed: false, ready: false, count: 0, ids: new Set(),
  };
}
