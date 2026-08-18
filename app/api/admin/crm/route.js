import { NextResponse } from "next/server";
import {
  addNote, deleteNote, addTask, toggleTask, deleteTask,
  addTag, removeTag, listNotes, listTasks,
} from "../../../../lib/crmDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** محمي عبر middleware — كل /api يتطلب جلسة مسؤول إلا القائمة البيضاء. */
export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const { action, contactKey } = b;

  if (!contactKey || !/^[cp]:.+/.test(contactKey)) {
    return NextResponse.json({ error: "مفتاح جهة اتصال غير صالح." }, { status: 400 });
  }

  try {
    switch (action) {
      case "add-note":
        if (!String(b.body || "").trim()) {
          return NextResponse.json({ error: "الملاحظة فارغة." }, { status: 400 });
        }
        await addNote(contactKey, b.body, b.author || "الإدارة");
        return NextResponse.json({ ok: true, notes: await listNotes(contactKey) }, { status: 201 });

      case "delete-note":
        await deleteNote(b.id);
        return NextResponse.json({ ok: true, notes: await listNotes(contactKey) });

      case "add-task":
        if (!String(b.title || "").trim()) {
          return NextResponse.json({ error: "عنوان المهمة مطلوب." }, { status: 400 });
        }
        await addTask(contactKey, { title: b.title, dueAt: b.dueAt || null });
        return NextResponse.json({ ok: true, tasks: await listTasks(contactKey) }, { status: 201 });

      case "toggle-task":
        await toggleTask(b.id, !!b.done);
        return NextResponse.json({ ok: true, tasks: await listTasks(contactKey) });

      case "delete-task":
        await deleteTask(b.id);
        return NextResponse.json({ ok: true, tasks: await listTasks(contactKey) });

      case "add-tag":
        await addTag(contactKey, b.tag);
        return NextResponse.json({ ok: true });

      case "remove-tag":
        await removeTag(contactKey, b.tag);
        return NextResponse.json({ ok: true });

      default:
        return NextResponse.json({ error: "إجراء غير معروف." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "تعذّر تنفيذ الإجراء." }, { status: 400 });
  }
}
