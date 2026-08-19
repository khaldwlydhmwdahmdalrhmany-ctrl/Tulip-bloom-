import { NextResponse } from "next/server";
import {
  createPost, updatePost, deletePost, getPostById,
  createPostCategory, deletePostCategory, listPostCategories,
} from "../../../../lib/blogDb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** محمي عبر middleware — كل /api يتطلب جلسة مسؤول إلا القائمة البيضاء. */
export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  try {
    if (b.action === "create-category") {
      if (!String(b.name || "").trim()) {
        return NextResponse.json({ error: "اسم التصنيف مطلوب." }, { status: 400 });
      }
      await createPostCategory(b);
      return NextResponse.json({ ok: true, categories: await listPostCategories() }, { status: 201 });
    }
    if (b.action === "delete-category") {
      await deletePostCategory(b.id);
      return NextResponse.json({ ok: true, categories: await listPostCategories() });
    }

    if (!String(b.title || "").trim()) {
      return NextResponse.json({ error: "عنوان المقال مطلوب." }, { status: 400 });
    }
    const id = await createPost(b);
    return NextResponse.json({ ok: true, post: await getPostById(id) }, { status: 201 });
  } catch (err) {
    const dup = /unique|duplicate/i.test(err.message || "");
    return NextResponse.json(
      { error: dup ? "هذا المسار مستخدم بالفعل." : err.message || "تعذّر التنفيذ." },
      { status: 400 }
    );
  }
}

export async function PUT(request) {
  const b = await request.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: "معرّف المقال مطلوب." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, post: await updatePost(b.id, b) });
  } catch (err) {
    const dup = /unique|duplicate/i.test(err.message || "");
    return NextResponse.json(
      { error: dup ? "هذا المسار مستخدم بالفعل." : err.message || "تعذّر الحفظ." },
      { status: 400 }
    );
  }
}

export async function DELETE(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "المعرّف مطلوب." }, { status: 400 });
  await deletePost(id);
  return NextResponse.json({ ok: true });
}
