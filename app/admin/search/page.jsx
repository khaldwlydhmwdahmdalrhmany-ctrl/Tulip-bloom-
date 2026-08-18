import React from "react";
import { topQueries, zeroResultQueries, searchStats, loadSearchConfig } from "../../../lib/searchDb.js";
import { getProducts } from "../../../lib/db.js";
import { themeColors, TYPOGRAPHY } from "../../../config/theme.config.js";
import SearchConsole from "../../../components/SearchConsole.jsx";

export const dynamic = "force-dynamic";

const T = themeColors();

export default async function AdminSearchPage() {
  const [top, zero, stats, config, products] = await Promise.all([
    topQueries({ days: 30, limit: 20 }).catch(() => []),
    zeroResultQueries({ days: 30, limit: 20 }).catch(() => []),
    searchStats({ days: 30 }).catch(() => ({ total: 0, zero: 0, zeroRate: 0 })),
    loadSearchConfig(),
    getProducts({ includeHidden: false }).catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl mb-1" style={{ color: T.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
          البحث الداخلي
        </h1>
        <p className="text-xs" style={{ color: T.muted }}>
          ما يبحث عنه عملاؤك، وما لا يجدونه — وأدوات إصلاحه.
        </p>
      </div>

      <SearchConsole
        top={top.map((r) => ({ q: r.sample || r.normalized, norm: r.normalized, hits: Number(r.hits), avg: Math.round(Number(r.avgresults || 0)) }))}
        zero={zero.map((r) => ({ q: r.sample || r.normalized, norm: r.normalized, hits: Number(r.hits) }))}
        stats={stats}
        config={config}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
