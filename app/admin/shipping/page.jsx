import React from "react";
import {
  listZones, listRates, listSlots, listCarrierConfigs, maskCarrierConfigs,
} from "../../../lib/shippingDb.js";
import { CARRIER_LIST } from "../../../lib/carriers.js";
import { themeColors, TYPOGRAPHY } from "../../../config/theme.config.js";
import ShippingConsole from "../../../components/ShippingConsole.jsx";
import { STORE } from "../../../config/store.config.js";

export const dynamic = "force-dynamic";
const T = themeColors();

export default async function AdminShippingPage() {
  const [zones, rates, slots, configs] = await Promise.all([
    listZones().catch(() => []),
    listRates().catch(() => []),
    listSlots().catch(() => []),
    listCarrierConfigs().catch(() => ({})),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl mb-1" style={{ color: T.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
          الشحن والتوصيل
        </h1>
        <p className="text-xs" style={{ color: T.muted }}>
          مناطق التغطية وأسعارها، ونوافذ التسليم، وربط شركات الشحن.
        </p>
      </div>

      <ShippingConsole
        zones={zones}
        rates={rates}
        slots={slots}
        // ⚠️ المقنّعة فقط — المفاتيح الخام لا تغادر الخادم أبدًا
        carriers={maskCarrierConfigs(configs)}
        carrierList={CARRIER_LIST.map((c) => ({
          code: c.code, name: c.name, hint: c.hint,
          needsCredentials: c.needsCredentials, fields: c.fields || [], docs: c.docs || "",
        }))}
        currency={STORE.currencyLabel}
        defaults={{
          shipping: STORE.defaultShippingCost,
          freeOver: STORE.freeShippingThreshold,
          city: STORE.address,
        }}
      />
    </div>
  );
}
