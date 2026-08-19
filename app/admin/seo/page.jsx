import React from "react";
import { listOverrides, listRedirects, seoAudit, seoPaths } from "../../../lib/seoDb.js";
import { getSettings } from "../../../lib/db.js";
import { siteUrl } from "../../../lib/seo.jsx";
import { themeColors, TYPOGRAPHY } from "../../../config/theme.config.js";
import SeoConsole from "../../../components/SeoConsole.jsx";

export const dynamic = "force-dynamic";
const T = themeColors();

export default async function AdminSeoPage() {
  const [overrides, redirects, audit, paths, settings] = await Promise.all([
    listOverrides().catch(() => []),
    listRedirects().catch(() => []),
    seoAudit().catch(() => ({ issues: [], counts: {}, scanned: {} })),
    seoPaths().catch(() => []),
    getSettings().catch(() => ({})),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl mb-1" style={{ color: T.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
          تحسين محركات البحث
        </h1>
        <p className="text-xs" style={{ color: T.muted }}>
          فحص الصحّة، وتجاوزات الصفحات، والتحويلات، وبيانات النشاط المحلي.
        </p>
      </div>

      <SeoConsole
        audit={audit}
        overrides={overrides.map((o) => ({
          id: o.id, path: o.path, title: o.title || "", description: o.description || "",
          ogImage: o.ogImage || "", keywords: o.keywords || "",
          noIndex: o.noIndex === true || o.noIndex === 1, canonical: o.canonical || "",
        }))}
        redirects={redirects.map((r) => ({
          id: r.id, fromPath: r.fromPath, toPath: r.toPath,
          permanent: r.permanent === true || r.permanent === 1, hits: Number(r.hits || 0),
        }))}
        paths={paths}
        settings={{
          gsc_verification: settings.gsc_verification || "",
          bing_verification: settings.bing_verification || "",
          seo_business_type: settings.seo_business_type || "Store",
          seo_geo_lat: settings.seo_geo_lat || "",
          seo_geo_lng: settings.seo_geo_lng || "",
          seo_opening_hours: settings.seo_opening_hours || "",
          seo_price_range: settings.seo_price_range || "",
          seo_robots_extra: settings.seo_robots_extra || "",
        }}
        siteUrl={siteUrl()}
      />
    </div>
  );
}
