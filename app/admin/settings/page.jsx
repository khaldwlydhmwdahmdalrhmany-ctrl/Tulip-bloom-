import React from "react";
import { getSettings } from "../../../lib/db.js";
import SettingsForm from "../../../components/SettingsForm.jsx";

const C = { navy: "#0C1C77", slate: "#4A5A63" };

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings().catch(() => ({}));

  return (
    <div>
      <h1 className="font-display text-xl mb-1" style={{ color: C.navy, fontWeight: 800 }}>الإعدادات</h1>
      <p className="text-xs mb-5" style={{ color: C.slate }}>
        روابط التواصل الاجتماعي وبيانات الاتصال التي تظهر في الموقع.
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
