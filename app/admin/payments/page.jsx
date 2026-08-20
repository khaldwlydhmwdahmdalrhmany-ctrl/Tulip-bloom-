import React from "react";
import {
  listGatewayConfigs, maskGatewayConfigs, listPayments, paymentStats, listEvents,
} from "../../../lib/paymentsDb.js";
import { GATEWAY_LIST, METHOD_LABELS } from "../../../lib/gateways.js";
import { siteUrl } from "../../../lib/seo.jsx";
import { themeColors, TYPOGRAPHY } from "../../../config/theme.config.js";
import PaymentsConsole from "../../../components/PaymentsConsole.jsx";
import { STORE } from "../../../config/store.config.js";

export const dynamic = "force-dynamic";
const T = themeColors();

export default async function AdminPaymentsPage() {
  const [configs, payments, stats, events] = await Promise.all([
    listGatewayConfigs().catch(() => ({})),
    listPayments({ limit: 60 }).catch(() => []),
    paymentStats({ days: 30 }).catch(() => ({})),
    listEvents({ limit: 25 }).catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl mb-1" style={{ color: T.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
          الدفع والمدفوعات
        </h1>
        <p className="text-xs" style={{ color: T.muted }}>
          بوابات الدفع، وسجلّ العمليات، وأحداث التأكيد.
        </p>
      </div>

      <PaymentsConsole
        // ⚠️ المقنّعة فقط — المفاتيح السرّية لا تغادر الخادم
        gateways={maskGatewayConfigs(configs)}
        gatewayList={GATEWAY_LIST.map((g) => ({
          code: g.code, name: g.name, hint: g.hint, needsKeys: g.needsKeys,
          fields: g.fields || [], methods: g.methods || [], docs: g.docs || "",
        }))}
        methodLabels={METHOD_LABELS}
        payments={payments.map((p) => ({
          id: p.id, orderId: p.orderId, gateway: p.gateway, method: p.method || "",
          amount: Number(p.amount || 0), status: p.status,
          providerRef: p.providerRef || "", failureReason: p.failureReason || "",
          createdAt: p.createdAt,
        }))}
        stats={stats}
        events={events.map((e) => ({
          id: e.id, gateway: e.gateway, eventId: e.eventId, type: e.type || "", createdAt: e.createdAt,
        }))}
        webhookBase={`${siteUrl()}/api/payments/webhook/`}
        currency={STORE.currencyLabel}
      />
    </div>
  );
}
