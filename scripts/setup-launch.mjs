/**
 * ═══════════════════════════════════════════════════════════
 *  تهيئة الإطلاق — تشغيل لمرة واحدة
 * ═══════════════════════════════════════════════════════════
 *
 *  npm run setup:launch
 *
 *  يُنشئ الحد الأدنى الذي يجعل المتجر يستقبل طلبات فعلية:
 *  مناطق شحن وأسعارها، نوافذ تسليم، وتفعيل الدفع عند الاستلام
 *  والتحويل البنكي، ومحتوى الصفحات القانونية.
 *
 *  ⚠️ آمن للتكرار: يتخطّى ما هو موجود ولا يكرّره.
 */

import {
  listZones, createZone, listRates, createRate, listSlots, createSlot,
} from "../lib/shippingDb.js";
import { listGatewayConfigs, saveGatewayConfig } from "../lib/paymentsDb.js";
import { getAllLegalPages, updateLegalPage } from "../lib/db.js";
import { STORE } from "../config/store.config.js";

const log = (m) => console.log("  " + m);

/* ── الشحن ── */
async function shipping() {
  const zones = await listZones();
  if (zones.length) { log("⏭  المناطق موجودة — تُركت كما هي"); return; }

  const riyadh = await createZone({
    name: "الرياض",
    cities: "الرياض، الدرعية، الخرج، الدلم، حريملاء، ضرما",
  });
  const rest = await createZone({
    name: "بقية المملكة",
    cities: "",
    isDefault: true,
    sortOrder: 9,
  });
  log("✔ منطقتان: الرياض · بقية المملكة (افتراضية)");

  await createRate({
    zoneId: riyadh, name: "توصيل نفس اليوم", price: 25,
    freeOver: STORE.freeShippingThreshold, etaText: "خلال ٣–٥ ساعات",
    sameDay: true, cutoffHour: 18, carrier: "manual", sortOrder: 1,
  });
  await createRate({
    zoneId: riyadh, name: "توصيل الغد", price: 15,
    freeOver: STORE.freeShippingThreshold, etaText: "غدًا",
    carrier: "manual", sortOrder: 2,
  });
  await createRate({
    zoneId: rest, name: "شحن قياسي", price: 35,
    etaText: "٢–٤ أيام عمل", carrier: "smsa", sortOrder: 1,
  });
  log("✔ ثلاثة أسعار");

  if (!(await listSlots()).length) {
    await createSlot({ label: "صباحًا", startHour: 9, endHour: 12, sortOrder: 1 });
    await createSlot({ label: "ظهرًا", startHour: 12, endHour: 16, sortOrder: 2 });
    await createSlot({ label: "مساءً", startHour: 16, endHour: 21, surcharge: 10, sortOrder: 3 });
    log("✔ ثلاث نوافذ تسليم");
  }
}

/* ── الدفع ── */
async function payments() {
  const cfg = await listGatewayConfigs();

  if (!cfg.cod?.enabled) {
    await saveGatewayConfig("cod", { enabled: true, sortOrder: 1 });
    log("✔ الدفع عند الاستلام مفعّل");
  }
  if (!cfg.bank_transfer?.enabled) {
    await saveGatewayConfig("bank_transfer", {
      enabled: true, sortOrder: 2,
      extra: { bankName: "— أدخل اسم البنك —", accountName: STORE.shortName, iban: "— أدخل الآيبان —" },
    });
    log("✔ التحويل البنكي مفعّل (أكمل بيانات الحساب من اللوحة)");
  }
  log("ℹ️  البوابات الإلكترونية تنتظر مفاتيحها في /admin/payments");
}

/* ── الصفحات القانونية ──
   Google Ads وMeta يرفضان المتجر بدونها. المحتوى هنا أساس
   عملي يجب أن يراجعه صاحب المتجر قبل الإطلاق. */
const LEGAL = {
  terms: {
    title: "الشروط والأحكام",
    content: `باستخدامك متجر ${STORE.shortName} فإنك توافق على الشروط التالية.

الطلبات
تُعدّ الطلبات مؤكَّدة بعد تحصيل المبلغ أو تأكيدها من فريقنا. نحتفظ بحق رفض أي طلب مع إعادة المبلغ كاملًا في حال عدم توفّر المنتج.

الأسعار
جميع الأسعار بالريال السعودي وشاملة ضريبة القيمة المضافة. قد تتغيّر الأسعار دون إشعار مسبق، ويُطبَّق على طلبك السعر المعروض وقت التأكيد.

المنتجات
الصور مرجعية. نلتزم بنفس النوع واللون والمقاس المذكور، وقد يختلف توزيع الأزهار بحسب توفّر اليوم لأن الورد منتج طبيعي.

التوصيل
مواعيد التسليم تقديرية ونبذل ما بوسعنا للالتزام بها. لا نتحمّل التأخير الناتج عن ظروف خارجة عن إرادتنا مثل الأحوال الجوية أو تعذّر الوصول للمستلم.

الملكية الفكرية
جميع محتويات الموقع من نصوص وصور وتصاميم مملوكة للمتجر ولا يجوز استخدامها دون إذن.

القانون الواجب التطبيق
تخضع هذه الشروط لأنظمة المملكة العربية السعودية.`,
  },
  returns: {
    title: "سياسة الاستبدال والاسترجاع",
    content: `الورد الطبيعي
منتج قابل للتلف ولا يخضع للاسترجاع بعد التسليم. إن وصل بحالة غير مرضية، صوّره وراسلنا خلال ٤ ساعات من الاستلام ونستبدله أو نعوّضك.

المنتجات غير القابلة للتلف
الشوكولاتة والشموع والعطور والنباتات: تُستبدل خلال ٣ أيام من الاستلام بشرط بقائها في تغليفها الأصلي دون استخدام.

إلغاء الطلب
يمكن إلغاء الطلب واسترداد المبلغ كاملًا قبل بدء التجهيز. بعد بدء التجهيز لا يمكن الإلغاء لأن الباقة تُنسَّق خصيصًا لطلبك.

مدة استرداد المبالغ
تُعاد المبالغ بنفس وسيلة الدفع خلال ٧ إلى ١٤ يوم عمل بحسب البنك أو بوابة الدفع.

تعذّر التسليم
إن تعذّر الوصول للمستلم نتواصل معك لإعادة المحاولة. المحاولة الثانية مجانية، وما بعدها يُحتسب عليه رسم توصيل جديد.`,
  },
  shipping: {
    title: "الشحن والدفع",
    content: `مناطق التغطية
داخل الرياض: توصيل في نفس اليوم للطلبات المؤكَّدة قبل ٦ مساءً، أو في اليوم التالي لما بعدها.
بقية مناطق المملكة: شحن خلال ٢ إلى ٤ أيام عمل للمنتجات غير القابلة للتلف.

رسوم الشحن
تُحتسب حسب المدينة وتظهر بوضوح قبل تأكيد الطلب. الشحن مجاني للطلبات فوق ${STORE.freeShippingThreshold} ريال داخل نطاق التغطية.

نوافذ التسليم
يمكنك اختيار وقت تسليم مفضّل عند إتمام الطلب. بعض النوافذ قد يُحتسب عليها رسم إضافي بسيط.

وسائل الدفع
الدفع عند الاستلام · التحويل البنكي · البطاقات ومدى وApple Pay عبر بوابات الدفع المعتمدة · خيارات التقسيط عند توفّرها.

أمان الدفع
لا نحتفظ ببيانات بطاقتك البنكية إطلاقًا. تُعالَج المدفوعات مباشرة عبر بوابات الدفع المرخّصة وفق معاييرها الأمنية.

تتبّع الشحنة
نرسل لك رقم الطلب فور تأكيده، ورقم البوليصة عند شحن الطلبات خارج الرياض.`,
  },
};

async function legal() {
  const pages = await getAllLegalPages().catch(() => []);
  for (const [slug, data] of Object.entries(LEGAL)) {
    const existing = pages.find((p) => p.slug === slug);
    if (existing?.content?.trim()) { log(`⏭  ${data.title} — فيها محتوى، لم تُلمس`); continue; }
    await updateLegalPage(slug, { ...data, published: true });
    log(`✔ ${data.title}`);
  }
  log("⚠️  راجع النصوص القانونية وعدّلها بما يطابق سياستك الفعلية");
}

async function main() {
  console.log("\n🌿 تهيئة الإطلاق — توليب بلوم\n");
  console.log("── الشحن ──");      await shipping();
  console.log("\n── الدفع ──");     await payments();
  console.log("\n── الصفحات القانونية ──"); await legal();
  console.log("\n✅ جاهز. راجع /admin/shipping و /admin/payments و /admin/legal\n");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
