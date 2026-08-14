import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "لم يتم إرفاق ملف" }, { status: 400 });
    }

    // الامتداد يُشتق من نوع MIME لا من اسم الملف — اسم الملف قد يكون
    // بلا امتداد أو بامتداد مضلّل، وكلاهما ينتج رابطًا لا يُعرض كصورة.
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "صيغة الصورة غير مدعومة (jpg, png, webp فقط)" },
        { status: 400 }
      );
    }

    // الضغط يتم في المتصفح قبل الرفع؛ هذا الحد شبكة أمان لا أكثر
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "حجم الصورة أكبر من 8 ميغابايت" }, { status: 400 });
    }

    const fileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;

    const blob = await put(fileName, file, {
      access: "public",
      contentType: file.type,
      // مهم: الحساب فيه أكثر من Blob Store — بدون تحديد المتجر العام
      // يقع الرفع على متجر خاص ويفشل بخطأ "Cannot use public access on a private store".
      storeId: process.env.PUBLIC_BLOB_STORE_ID,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[upload] فشل رفع الصورة:", error);
    return NextResponse.json(
      { error: error.message || "تعذّر رفع الصورة" },
      { status: 500 }
    );
  }
}
