import React from "react";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";
import { listAddresses } from "../../../../lib/customerDb.js";
import AccountManager from "../../../../components/site/AccountManager.jsx";
import { C } from "../../../../lib/colors.js";

export const dynamic = "force-dynamic";
export const metadata = { title: "عناويني" };

export default async function AddressesPage() {
  const me = await getCurrentCustomer();
  if (!me) redirect("/account/login");
  const addresses = await listAddresses(me.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="eyebrow mb-2">التسليم</span>
        <h1 className="h-section font-display mb-1" style={{ color: C.navy }}>عناويني</h1>
        <p className="text-sm" style={{ color: C.slate }}>
          احفظ عناوينك المتكرّرة لتسريع الطلب.
        </p>
      </div>
      <AccountManager kind="addresses" initial={addresses} />
    </div>
  );
}
