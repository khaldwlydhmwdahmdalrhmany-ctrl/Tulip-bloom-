import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getContact, listNotes, listTasks, SEGMENTS } from "../../../../lib/crmDb.js";
import {
  listAddresses, listRecipients, listReminders, listFavoriteIds,
} from "../../../../lib/customerDb.js";
import { themeColors, TYPOGRAPHY } from "../../../../config/theme.config.js";
import ContactDetail from "../../../../components/ContactDetail.jsx";
import { STORE } from "../../../../config/store.config.js";

export const dynamic = "force-dynamic";
const T = themeColors();

export default async function ContactPage({ params }) {
  const key = decodeURIComponent(params.key);
  const contact = await getContact(key);
  if (!contact) notFound();

  const [notes, tasks] = await Promise.all([
    listNotes(key).catch(() => []),
    listTasks(key).catch(() => []),
  ]);

  // بيانات الحساب متاحة للمسجّلين فقط — الضيف لا يملك عناوين محفوظة
  let account = null;
  if (contact.customerId) {
    const [addresses, recipients, reminders, favorites] = await Promise.all([
      listAddresses(contact.customerId).catch(() => []),
      listRecipients(contact.customerId).catch(() => []),
      listReminders(contact.customerId).catch(() => []),
      listFavoriteIds(contact.customerId).catch(() => []),
    ]);
    account = {
      addresses: addresses.map((a) => ({ id: a.id, label: a.label || "", city: a.city || "", district: a.district || "" })),
      recipients: recipients.map((r) => ({ id: r.id, name: r.name, relation: r.relation || "", city: r.city || "" })),
      reminders: reminders.map((r) => ({ id: r.id, title: r.title, month: r.month, day: r.day, occasion: r.occasion || "" })),
      favoritesCount: favorites.length,
    };
  }

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/customers" className="flex items-center gap-1.5 text-[12px] font-bold w-fit"
            style={{ color: T.muted }}>
        <ArrowRight size={14} /> كل العملاء
      </Link>

      <ContactDetail
        contact={{
          key: contact.key, name: contact.name, phone: contact.phone, email: contact.email,
          registered: contact.registered, status: contact.status,
          marketingOptIn: contact.marketingOptIn,
          orderCount: contact.orderCount, lifetimeValue: contact.lifetimeValue,
          avgOrder: contact.avgOrder, lastOrderAt: contact.lastOrderAt, firstOrderAt: contact.firstOrderAt,
          createdAt: contact.createdAt, segments: contact.segments, tags: contact.tags,
          orders: contact.orders,
        }}
        notes={notes.map((x) => ({ id: x.id, body: x.body, author: x.author || "", createdAt: x.createdAt }))}
        tasks={tasks.map((x) => ({ id: x.id, title: x.title, dueAt: x.dueAt, done: x.done === true || x.done === 1 }))}
        account={account}
        segmentLabels={Object.fromEntries(SEGMENTS.map((s) => [s.key, s.label]))}
        currency={STORE.currencyLabel}
      />
    </div>
  );
}
