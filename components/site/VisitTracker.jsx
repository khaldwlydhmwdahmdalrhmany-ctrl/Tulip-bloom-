"use client";
import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { resolveAttribution, sessionId, isNewVisitor } from "../../lib/attribution.js";
import { pushEvent } from "../../lib/analytics.js";

/**
 * تسجيل الزيارات في قاعدة بياناتنا (بالإضافة إلى GA).
 *
 * لماذا لا نكتفي بـ Google Analytics؟ لأنه لا يستطيع ربط الطلب المحفوظ
 * في قاعدتنا بمصدره. هذا المكوّن يسجّل المصدر عندنا، فتُظهر لوحة التحكم
 * "كم طلبًا جاء من سناب مقابل جوجل" — وهو ما لا يوفّره GA بلا إعداد معقّد.
 *
 * لا يُرسل IP ولا بصمة جهاز؛ فقط المسار والمصدر ومعرّف جلسة عشوائي.
 */
export default function VisitTracker() {
  const pathname = usePathname();
  const lastPath = useRef(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;

    // لا نتتبّع لوحة التحكم — زياراتنا نحن ليست بيانات تسويقية
    if (pathname.startsWith("/admin")) return;

    const attr = resolveAttribution();
    const sid = sessionId();
    const fresh = isNewVisitor();

    pushEvent("page_view", {
      page_path: pathname,
      traffic_source: attr?.source,
      traffic_medium: attr?.medium,
    });

    const body = JSON.stringify({
      sessionId: sid,
      path: pathname,
      source: attr?.source,
      medium: attr?.medium,
      campaign: attr?.campaign,
      referrer: typeof document !== "undefined" ? document.referrer.slice(0, 300) : null,
      device: typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop",
      isNew: fresh,
    });

    // sendBeacon لا يُلغى عند مغادرة الصفحة، ولا يؤخّر التنقّل
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
      }
    } catch {}
  }, [pathname]);

  return null;
}
