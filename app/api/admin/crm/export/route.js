import { buildContacts, contactsToCsv } from "../../../../../lib/crmDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const seg = new URL(request.url).searchParams.get("segment") || "";
  let contacts = await buildContacts();
  if (seg) contacts = contacts.filter((c) => c.segments.includes(seg));

  const csv = contactsToCsv(contacts);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
