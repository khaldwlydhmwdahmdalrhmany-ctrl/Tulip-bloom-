import React from "react";
import { SECTIONS } from "./registry.jsx";

/**
 * محرّك عرض الأقسام.
 *
 * يقرأ قائمة الأقسام من التهيئة ويعرضها بالترتيب.
 * الصفحة لا تعرف شيئًا عن الأقسام — تجلب البيانات وتسلّمها لهذا المكوّن.
 *
 * قسم غير معرّف في السجل يُتخطّى مع تحذير في السجلات،
 * بدل أن يُسقط الصفحة كلها بخطأ.
 */
export default function SectionRenderer({ sections = [], data = {} }) {
  return (
    <>
      {sections.map((section, i) => {
        if (section.enabled === false) return null;

        const render = SECTIONS[section.type];
        if (!render) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(`[sections] نوع غير معروف: "${section.type}" — تُخطّي`);
          }
          return null;
        }

        const node = render(section.props || {}, data);
        if (!node) return null;   // القسم قرر ألا يُعرض (بيانات فارغة مثلًا)

        return <React.Fragment key={`${section.type}-${i}`}>{node}</React.Fragment>;
      })}
    </>
  );
}
