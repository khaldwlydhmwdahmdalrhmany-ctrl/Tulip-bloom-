import React from "react";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";
import { publicCustomer } from "../../../../lib/customerAuth.js";
import ProfileForm from "../../../../components/site/ProfileForm.jsx";
import { C } from "../../../../lib/colors.js";

export const dynamic = "force-dynamic";
export const metadata = { title: "بياناتي" };

export default async function ProfilePage() {
  const me = await getCurrentCustomer();
  if (!me) redirect("/account/login");
  // ⚠️ publicCustomer إلزامي — تمرير الصف الخام يسرّب passwordHash إلى HTML
  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="eyebrow mb-2">حسابك</span>
        <h1 className="h-section font-display" style={{ color: C.navy }}>بياناتي</h1>
      </div>
      <ProfileForm customer={publicCustomer(me)} />
    </div>
  );
}
