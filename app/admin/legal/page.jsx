import React from "react";
import { AlertTriangle } from "lucide-react";
import { getAllLegalPages } from "../../../lib/db.js";
import LegalEditor from "../../../components/LegalEditor.jsx";

const C = { navy: "#0C1C77", slate: "#4A5A63" };

export const dynamic = "force-dynamic";

export default async function AdminLegalPage() {
  const pages = await getAllLegalPages();
  const missing = pages.filter((p) => !p.content?.trim() || p.published === false);

  return (
    <div>
      <h1 className="font-display text-xl mb-1" style={{ color: C.navy, fontWeight: 800 }}>الصفحات القانونية</h1>
      <p className="text-xs mb-5 leading-relaxed" style={{ color: C.slate }}>
        محتوى هذه الصفحات يُكتب من هنا ويظهر مباشرة في الموقع.
      </p>

      {missing.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl mb-5" style={{ background: "#FFF8E7", border: "1px solid #F2B01E44" }}>
          <AlertTriangle size={18} color="#8A6200" className="shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed" style={{ color: "#8A6200" }}>
            <strong className="block mb-1">{missing.length} صفحة غير جاهزة</strong>
            Google Ads و Meta يرفضان حسابات المتاجر التي تنقصها هذه الصفحات.
            أكملها ثم فعّل النشر قبل إنشاء أي حساب إعلاني.
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {pages.map((p) => (<LegalEditor key={p.slug} page={p} />))}
      </div>
    </div>
  );
}
