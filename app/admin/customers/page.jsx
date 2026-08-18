import React from "react";
import { listCustomers, ordersForCustomer } from "../../../lib/customerDb.js";
import { themeColors, TYPOGRAPHY } from "../../../config/theme.config.js";
import CustomersBoard from "../../../components/CustomersBoard.jsx";

export const dynamic = "force-dynamic";

const T = themeColors();

export default async function AdminCustomersPage() {
  const customers = await listCustomers({ limit: 300 });

  // إحصاءات كل عميل — تُحسب مرة على الخادم لا في المتصفح
  const enriched = await Promise.all(
    customers.map(async (c) => {
      const orders = await ordersForCustomer(c.id).catch(() => []);
      const total = orders.reduce((s, o) => s + Number(o.total || 0), 0);
      return {
        id: c.id,
        email: c.email,
        name: c.name || "",
        phone: c.phone || "",
        status: c.status || "active",
        emailVerified: !!c.emailVerified,
        marketingOptIn: !!c.marketingOptIn,
        createdAt: c.createdAt,
        lastLoginAt: c.lastLoginAt,
        orderCount: orders.length,
        lifetimeValue: Math.round(total),
        // ⚠️ passwordHash لا يُمرَّر إطلاقًا
      };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl mb-1" style={{ color: T.primary, fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 }}>
          العملاء
        </h1>
        <p className="text-xs" style={{ color: T.muted }}>
          حسابات مسجّلة في المتجر. الطلبات كضيف لا تظهر هنا.
        </p>
      </div>
      <CustomersBoard customers={enriched} />
    </div>
  );
}
