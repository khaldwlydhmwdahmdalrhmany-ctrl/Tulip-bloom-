import React from "react";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";
import { listRecipients, listReminders } from "../../../../lib/customerDb.js";
import AccountManager from "../../../../components/site/AccountManager.jsx";
import { C } from "../../../../lib/colors.js";

export const dynamic = "force-dynamic";
export const metadata = { title: "المستلمون والمناسبات" };

export default async function RecipientsPage() {
  const me = await getCurrentCustomer();
  if (!me) redirect("/account/login");
  const [recipients, reminders] = await Promise.all([listRecipients(me.id), listReminders(me.id)]);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <div>
          <span className="eyebrow mb-2">دفتر المستلمين</span>
          <h1 className="h-section font-display mb-1" style={{ color: C.navy }}>من ترسل لهم</h1>
          <p className="text-sm leading-relaxed" style={{ color: C.slate }}>
            احفظ أهلك وأصدقاءك وزملاءك بعناوينهم — لا تعيد كتابتها كل مرة.
          </p>
        </div>
        <AccountManager kind="recipients" initial={recipients} />
      </section>

      <section className="flex flex-col gap-6">
        <div>
          <span className="eyebrow mb-2">لا تنسَ</span>
          <h2 className="h-section font-display mb-1" style={{ color: C.navy }}>تذكيرات المناسبات</h2>
          <p className="text-sm leading-relaxed" style={{ color: C.slate }}>
            التاريخ يتكرّر سنويًا — نحفظ اليوم والشهر فقط.
          </p>
        </div>
        <AccountManager kind="reminders" initial={reminders} recipients={recipients} />
      </section>
    </div>
  );
}
