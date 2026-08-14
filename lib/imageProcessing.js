/**
 * ضغط الصور وتحويلها إلى WebP — يُنفَّذ في المتصفح قبل الرفع.
 *
 * لماذا في المتصفح لا على الخادم؟
 * • لا يستهلك وقت تنفيذ دوال Vercel (المحدود في الخطة المجانية)
 * • يرفع ملفًا أصغر بكثير، فالرفع نفسه أسرع على شبكة الجوال
 * • لا يحتاج مكتبات ثقيلة مثل sharp في الحزمة
 *
 * WebP يوفّر عادة 25–40% مقارنة بـ JPEG عند نفس الجودة البصرية،
 * وتدعمه كل المتصفحات الحديثة منذ 2020.
 */

export const PRESETS = {
  product: { maxW: 1200, maxH: 1200, quality: 0.82, label: "صورة منتج" },
  banner:  { maxW: 1920, maxH: 1080, quality: 0.85, label: "بنر" },
  icon:    { maxW: 512,  maxH: 512,  quality: 0.9,  label: "أيقونة" },
};

const SUPPORTED = ["image/jpeg", "image/png", "image/webp"];

/** هل يدعم المتصفح إخراج WebP؟ (كل المتصفحات الحديثة تدعمه) */
function supportsWebP() {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    return c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("تعذّر قراءة الصورة")); };
    img.src = url;
  });
}

/**
 * يضغط الصورة ويحوّلها إلى WebP.
 * يعيد { file, before, after, saved, format } — أو الملف الأصلي إن تعذّر.
 */
export async function compressImage(file, preset = "product") {
  const cfg = PRESETS[preset] || PRESETS.product;
  const before = file.size;

  // صيغ لا نلمسها: SVG متجهة أصلًا، وGIF قد تكون متحركة فيقتلها التحويل
  if (!SUPPORTED.includes(file.type)) {
    return { file, before, after: before, saved: 0, format: file.type, skipped: true };
  }

  try {
    const img = await loadImage(file);

    // نصغّر فقط إن كانت أكبر من الحد — لا نكبّر صورة صغيرة فتفقد حدّتها
    let { width, height } = img;
    const scale = Math.min(cfg.maxW / width, cfg.maxH / height, 1);
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // PNG قد تحوي شفافية؛ WebP يحفظها، فلا نضع خلفية بيضاء
    ctx.drawImage(img, 0, 0, width, height);

    const useWebP = supportsWebP();
    const mime = useWebP ? "image/webp" : "image/jpeg";

    const blob = await new Promise((res) => canvas.toBlob(res, mime, cfg.quality));
    if (!blob) return { file, before, after: before, saved: 0, format: file.type };

    // لو خرج الملف أكبر من الأصل (يحدث مع صور بسيطة جدًا) نُبقي الأصل
    if (blob.size >= before) {
      return { file, before, after: before, saved: 0, format: file.type, skipped: true };
    }

    const ext = useWebP ? "webp" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
    const out = new File([blob], name, { type: mime, lastModified: Date.now() });

    return {
      file: out,
      before,
      after: out.size,
      saved: Math.round((1 - out.size / before) * 100),
      format: mime,
      dimensions: `${width}×${height}`,
    };
  } catch {
    return { file, before, after: before, saved: 0, format: file.type, skipped: true };
  }
}

export const formatBytes = (b) =>
  b >= 1048576 ? `${(b / 1048576).toFixed(1)} م.ب` : `${Math.round(b / 1024)} ك.ب`;
