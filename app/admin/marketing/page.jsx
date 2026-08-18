import React from "react";
import {
  listCoupons, couponPerformance, listAbandonedCarts, abandonedStats,
  listCampaigns, campaignPerformance,
} from "../../../lib/marketingDb.js";
import { getCategories } from "../../../lib/db.js";
import { themeColors, TYPOGRAPHY } from "../../../config/theme.config.js";
import MarketingConsole from "../../../components/MarketingConsole.jsx";
import { STORE } from "../../../config/store.config.js";

export const dynamic = "force-dynamic";
const T = themeColors();

export default async function AdminMarketingPage() {
  const [coupons, perf, carts, cartStats, campaigns, campaignPerf, categories] = await Promise.all([
    listCoupons().catch(() => []),
    couponPerformance().catch(() => []),
    listAbandonedCarts({ status: "all", limit: 80 }).catch(() => []),
    abandonedStats().catch(() => ({})),
    listCampaigns().catch(() => []),
    campaignPerformance({ days: 30 }).catch(() => []),
    getCategories().catch(() => []),
  ]);

  const perfById = Object.fromEntries(perf.map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl mb-1" style={{ color: T.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
          التسويق والنمو
        </h1>
        <p className="text-xs" style={{ color: T.muted }}>
          كوبونات الخصم، والسلات المتروكة، وأداء الحملات.
        </p>
      </div>

      <MarketingConsole
        coupons={coupons.map((c) => ({
          id: c.id, code: c.code, type: c.type, value: Number(c.value),
          minOrder: Number(c.minOrder || 0),
          maxUses: c.maxUses ? Number(c.maxUses) : null,
          usedCount: Number(c.usedCount || 0),
          perCustomerLimit: c.perCustomerLimit ? Number(c.perCustomerLimit) : null,
          categorySlug: c.categorySlug || "",
          endsAt: c.endsAt || null,
          active: c.active === true || c.active === 1,
          discounted: Math.round(Number(perfById[c.id]?.discounted || 0)),
        }))}
        carts={carts.map((c) => {
          let items = [];
          try { items = JSON.parse(c.itemsJson || "[]"); } catch {}
          return {
            id: c.id, total: Math.round(Number(c.total || 0)), status: c.status,
            name: c.contactName || "", phone: c.contactPhone || "",
            source: c.source || "", updatedAt: c.updatedAt,
            items: items.map((i) => ({ name: i.name, qty: i.qty })),
          };
        })}
        cartStats={cartStats}
        campaigns={campaigns.map((c) => ({
          id: c.id, name: c.name, source: c.source, medium: c.medium || "",
          campaign: c.campaign, landingPath: c.landingPath || "/",
        }))}
        campaignPerf={campaignPerf.map((r) => ({
          source: r.source, medium: r.medium, campaign: r.campaign,
          orders: Number(r.orders), revenue: Math.round(Number(r.revenue)),
        }))}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL || ""}
        currency={STORE.currencyLabel}
      />
    </div>
  );
}
