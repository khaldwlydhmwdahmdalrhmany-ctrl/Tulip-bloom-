import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import OffersManager from "../../../components/OffersManager.jsx";

const C = { navy: "#0C1C77", slate: "#4A5A63" };

export const dynamic = "force-dynamic";

export default function AdminOffersPage() {
  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-xl mb-1" style={{ color: C.navy, fontWeight: 800 }}>إدارة العروض</h1>
          <p className="text-xs leading-relaxed" style={{ color: C.slate }}>
            كل ما يظهر في صفحة العروض من مكان واحد — الترتيب، صفقة الصدارة، والإضافة والإزالة.
          </p>
        </div>
        <Link href="/offers" target="_blank" className="btn px-3.5 py-2 text-[11px] shrink-0" style={{ background: "#F6FAF9", color: C.navy }}>
          <ExternalLink size={13} /> معاينة
        </Link>
      </div>

      <OffersManager />
    </div>
  );
}
