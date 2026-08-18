import React from "react";
import { buildContacts, crmOverview, SEGMENTS, dueTasks } from "../../../lib/crmDb.js";
import { themeColors, TYPOGRAPHY } from "../../../config/theme.config.js";
import CrmBoard from "../../../components/CrmBoard.jsx";
import { STORE } from "../../../config/store.config.js";

export const dynamic = "force-dynamic";
const T = themeColors();

export default async function AdminCustomersPage() {
  const contacts = await buildContacts().catch(() => []);
  const overview = crmOverview(contacts);
  const tasks = await dueTasks({ limit: 20 }).catch(() => []);

  // نُمرّر ما يلزم العرض فقط — الطلبات الكاملة تُقرأ في صفحة التفاصيل
  const slim = contacts.map((c) => ({
    key: c.key, name: c.name, phone: c.phone, email: c.email,
    registered: c.registered, status: c.status,
    orderCount: c.orderCount, lifetimeValue: c.lifetimeValue, avgOrder: c.avgOrder,
    lastOrderAt: c.lastOrderAt, segments: c.segments, tags: c.tags,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl mb-1" style={{ color: T.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
          العملاء
        </h1>
        <p className="text-xs" style={{ color: T.muted }}>
          الحسابات المسجّلة والضيوف معًا — مدموجين بالجوال.
        </p>
      </div>

      <CrmBoard
        contacts={slim}
        overview={overview}
        segments={SEGMENTS}
        tasks={tasks.map((t) => ({
          id: t.id, title: t.title, contactKey: t.contactKey,
          dueAt: t.dueAt, done: t.done === true || t.done === 1,
        }))}
        currency={STORE.currencyLabel}
      />
    </div>
  );
}
