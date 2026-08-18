"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Package, MapPin, Users, CalendarHeart, LogOut } from "lucide-react";
import { C } from "../../lib/colors.js";

const ITEMS = [
  { href: "/account", label: "نظرة عامة", icon: User, exact: true },
  { href: "/account/orders", label: "طلباتي", icon: Package },
  { href: "/account/recipients", label: "المستلمون والمناسبات", icon: CalendarHeart },
  { href: "/account/addresses", label: "عناويني", icon: MapPin },
  { href: "/account/profile", label: "بياناتي", icon: Users },
];

export default function AccountNav({ customer }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/account/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="rounded-2xl p-4 lg:sticky lg:top-24"
           style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <div className="px-2 py-3 mb-2">
        <p className="font-display text-base truncate" style={{ color: C.navy }}>
          {customer?.name || "حسابي"}
        </p>
        <p className="text-[11px] truncate" dir="ltr" style={{ color: C.slateLight, textAlign: "right" }}>
          {customer?.email}
        </p>
      </div>

      <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
        {ITEMS.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href}
                  className="relative shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-all whitespace-nowrap"
                  style={active
                    ? { background: C.softTint || C.mintTint, color: C.navy, fontWeight: 700 }
                    : { color: C.slate, fontWeight: 500 }}>
              {active && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                      style={{ background: C.teal }} />
              )}
              <it.icon size={16} style={{ color: active ? C.teal : C.slateLight }} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <button onClick={logout}
              className="mt-3 pt-3 w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-bold"
              style={{ color: C.danger, borderTop: `1px solid ${C.lineSoft}` }}>
        <LogOut size={15} /> تسجيل الخروج
      </button>
    </aside>
  );
}
