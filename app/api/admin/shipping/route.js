import { NextResponse } from "next/server";
import {
  createZone, updateZone, deleteZone, setDefaultZone, listZones,
  createRate, deleteRate, toggleRate, listRates,
  createSlot, deleteSlot, listSlots,
  saveCarrierConfig, listCarrierConfigs, maskCarrierConfigs,
  createShipmentRow, updateShipmentStatus, deleteShipment, listShipments,
} from "../../../../lib/shippingDb.js";
import { CARRIERS } from "../../../../lib/carriers.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** محمي عبر middleware — كل /api يتطلب جلسة مسؤول إلا القائمة البيضاء. */
export async function POST(request) {
  const b = await request.json().catch(() => ({}));

  try {
    switch (b.action) {
      case "create-zone":
        if (!String(b.name || "").trim()) return NextResponse.json({ error: "اسم المنطقة مطلوب." }, { status: 400 });
        await createZone(b);
        return NextResponse.json({ ok: true, zones: await listZones() }, { status: 201 });

      case "update-zone":
        await updateZone(b.id, b);
        return NextResponse.json({ ok: true, zones: await listZones() });

      case "default-zone":
        await setDefaultZone(b.id);
        return NextResponse.json({ ok: true, zones: await listZones() });

      case "delete-zone":
        await deleteZone(b.id);
        return NextResponse.json({ ok: true, zones: await listZones(), rates: await listRates() });

      case "create-rate":
        if (!b.zoneId || !String(b.name || "").trim()) {
          return NextResponse.json({ error: "المنطقة والاسم مطلوبان." }, { status: 400 });
        }
        await createRate(b);
        return NextResponse.json({ ok: true, rates: await listRates() }, { status: 201 });

      case "toggle-rate":
        await toggleRate(b.id, !!b.active);
        return NextResponse.json({ ok: true, rates: await listRates() });

      case "delete-rate":
        await deleteRate(b.id);
        return NextResponse.json({ ok: true, rates: await listRates() });

      case "create-slot":
        if (!String(b.label || "").trim()) return NextResponse.json({ error: "اسم النافذة مطلوب." }, { status: 400 });
        await createSlot(b);
        return NextResponse.json({ ok: true, slots: await listSlots() }, { status: 201 });

      case "delete-slot":
        await deleteSlot(b.id);
        return NextResponse.json({ ok: true, slots: await listSlots() });

      case "save-carrier": {
        if (!CARRIERS[b.code]) return NextResponse.json({ error: "شركة غير معروفة." }, { status: 400 });
        await saveCarrierConfig(b.code, b);
        // ⚠️ نُرجع النسخة المقنّعة دائمًا — لا مفاتيح خام إلى المتصفح
        return NextResponse.json({ ok: true, carriers: maskCarrierConfigs(await listCarrierConfigs()) });
      }

      case "create-shipment":
        if (!b.orderId || !b.carrier) return NextResponse.json({ error: "الطلب والشركة مطلوبان." }, { status: 400 });
        await createShipmentRow(b);
        return NextResponse.json({ ok: true, shipments: await listShipments({ orderId: b.orderId }) }, { status: 201 });

      case "update-shipment":
        await updateShipmentStatus(b.id, b.status || "created", b.awb);
        return NextResponse.json({ ok: true, shipments: await listShipments({ orderId: b.orderId }) });

      case "delete-shipment":
        await deleteShipment(b.id);
        return NextResponse.json({ ok: true, shipments: await listShipments({ orderId: b.orderId }) });

      default:
        return NextResponse.json({ error: "إجراء غير معروف." }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message || "تعذّر التنفيذ." }, { status: 400 });
  }
}
