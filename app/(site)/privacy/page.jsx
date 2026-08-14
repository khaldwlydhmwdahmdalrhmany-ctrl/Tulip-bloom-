import React from "react";
import { ShieldCheck } from "lucide-react";
import { C } from "../../../lib/colors.js";
import PageHero from "../../../components/site/PageHero.jsx";
import { STORE } from "../../../config/store.config.js";
import { PRIVACY_SECTIONS } from "../../../config/content.config.js";

const SECTIONS = PRIVACY_SECTIONS;

export default function PrivacyPage() {
  return (
    <div>
      <PageHero
        title="سياسة الخصوصية"
        subtitle="كيف نجمع بياناتك ونستخدمها ونحميها."
        icon="Lock"
        color={C.navy}
        compact
      />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14 flex flex-col gap-8">
        <p className="text-sm leading-relaxed" style={{ color: C.slate }}>
          نحرص في {STORE.shortName} على خصوصية عملائنا، وتوضح هذه الصفحة طبيعة البيانات التي نجمعها وكيفية استخدامها وحمايتها.
        </p>
        {SECTIONS.map((s, i) => (
          <div key={i}>
            <h2 className="font-display text-lg mb-2" style={{ color: C.navy }}>{s.t}</h2>
            <p className="text-sm leading-relaxed" style={{ color: C.slate }}>{s.d}</p>
          </div>
        ))}
        <p className="text-xs" style={{ color: C.slate }}>آخر تحديث: {new Date().getFullYear()}</p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
        <div className="max-w-3xl flex flex-col gap-4">
          <h2 className="h-card font-display" style={{ color: C.navy }}>ملفات التتبّع والتحليلات</h2>
          <div className="text-sm leading-loose flex flex-col gap-3" style={{ color: C.slate }}>
            <p>
              نستخدم أدوات تحليل مثل Google Analytics وGoogle Tag Manager وMicrosoft Clarity
              لفهم كيفية استخدام الموقع وتحسين تجربة التسوّق. قد تضع هذه الأدوات ملفات تعريف
              ارتباط (Cookies) على متصفحك.
            </p>
            <p>
              كما نسجّل داخليًا بيانات مجهّلة الهوية عن مصدر الزيارة (مثل: جاءت من بحث جوجل أو
              من إعلان على إنستغرام) والصفحات التي زرتها. <strong>لا نجمع عنوان IP ولا بصمة
              الجهاز ولا أي بيانات تعرّف بك شخصيًا</strong> ضمن هذه السجلات.
            </p>
            <p>
              نستخدم هذه البيانات لقياس أداء حملاتنا التسويقية فقط. يمكنك تعطيل ملفات تعريف
              الارتباط من إعدادات متصفحك، وقد يؤثر ذلك على بعض وظائف الموقع.
            </p>
            <p>
              للاستفسار عن بياناتك أو طلب حذفها، راسلنا عبر صفحة «تواصل معنا».
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
