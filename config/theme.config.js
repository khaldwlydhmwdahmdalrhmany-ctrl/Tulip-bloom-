/**
 * ═══════════════════════════════════════════════════════════
 *  نظام الثيم — الألوان والخطوط والأشكال
 * ═══════════════════════════════════════════════════════════
 *
 * تغيير `ACTIVE_THEME` وحده يقلب مظهر المتجر بالكامل.
 * الألوان تُحقن كمتغيّرات CSS في :root، فتسري على كل مكوّن
 * بلا تعديل أي ملف.
 */

/* ── الثيمات الجاهزة ── */

export const THEMES = {
  /** أزرق/فيروزي — تقني ونظيف. يناسب: الأجهزة، المياه، الإلكترونيات، الطبي */
  aqua: {
    label: "أزرق فيروزي",
    colors: {
      primary: "#0C1C77", primaryDeep: "#071233",
      accent: "#00C6C7", accentAlt: "#00B9D6",
      soft: "#A9E2BD", softTint: "#EAF8F1",
      surface: "#FFFFFF", surfaceAlt: "#F6FAF9", surfaceMuted: "#FBFDFC",
      ink: "#0B1220", muted: "#4A5A63", mutedLight: "#6B7A82",
      line: "#E1ECE8", lineSoft: "#EEF5F2",
      danger: "#D64545", success: "#1B9C68", warning: "#E08A1E", gold: "#F2B01E",
    },
  },

  /** أسود/ذهبي — فاخر. يناسب: العطور، المجوهرات، الأزياء الراقية */
  luxe: {
    label: "أسود وذهبي",
    colors: {
      primary: "#111111", primaryDeep: "#000000",
      accent: "#C9A227", accentAlt: "#E0BC4A",
      soft: "#E8DCC0", softTint: "#FAF6EC",
      surface: "#FFFFFF", surfaceAlt: "#FAF9F7", surfaceMuted: "#FDFCFA",
      ink: "#141414", muted: "#5A544A", mutedLight: "#8A8378",
      line: "#EAE5DA", lineSoft: "#F4F1EA",
      danger: "#B93030", success: "#2E7D52", warning: "#C98A1E", gold: "#C9A227",
    },
  },

  /** بيج/تراكوتا — دافئ. يناسب: العبايات، الأثاث، المنتجات اليدوية */
  warm: {
    label: "بيج ترابي",
    colors: {
      primary: "#6B4632", primaryDeep: "#3E2A1E",
      accent: "#C87941", accentAlt: "#D99058",
      soft: "#E8D5C4", softTint: "#FAF3EC",
      surface: "#FFFFFF", surfaceAlt: "#FBF7F3", surfaceMuted: "#FEFCFA",
      ink: "#2B2118", muted: "#6B5D52", mutedLight: "#948578",
      line: "#EDE2D6", lineSoft: "#F6EFE7",
      danger: "#C0453C", success: "#4A7C59", warning: "#D08C2C", gold: "#C9954A",
    },
  },

  /** أخضر — عضوي. يناسب: الأغذية، المنتجات الطبيعية، المشاتل */
  fresh: {
    label: "أخضر طبيعي",
    colors: {
      primary: "#1B5E3F", primaryDeep: "#0D3524",
      accent: "#4CAF7D", accentAlt: "#6BC694",
      soft: "#C8E6D4", softTint: "#EDF7F1",
      surface: "#FFFFFF", surfaceAlt: "#F7FBF8", surfaceMuted: "#FCFEFD",
      ink: "#132018", muted: "#4A5F53", mutedLight: "#748A7D",
      line: "#DDEAE1", lineSoft: "#EFF6F2",
      danger: "#C74444", success: "#2E8B57", warning: "#D89A22", gold: "#D4A017",
    },
  },

  /**
   * فحمي/وردي مغبّر — حديث أنيق بسيط.
   * ثيم مخصّص لمتجر «توليب بلوم». يناسب: الورود، الهدايا، الشوكولاتة، الشموع.
   *
   * منطق اللوحة:
   *   • primary فحمي دافئ لا أسود — الحياد يترك الورد نفسه بطل الصفحة
   *   • accent وردي مغبّر لا فاقع — الأناقة في خفض التشبّع
   *   • surfaceAlt آيفوري دافئ — يمنع برودة الأبيض الخالص
   *   • success أخضر مريمي — يظهر في شارات التوفّر، إشارة نباتية بلا افتعال
   */
  tulip: {
    label: "فحمي ووردي مغبّر",
    colors: {
      primary: "#2E2A2B", primaryDeep: "#1A1718",
      accent: "#C4707F", accentAlt: "#D89AA5",
      soft: "#F0D9DD", softTint: "#FBF3F2",
      surface: "#FFFFFF", surfaceAlt: "#FAF6F4", surfaceMuted: "#FDFBFA",
      ink: "#241F20", muted: "#6B5F61", mutedLight: "#9A8D8F",
      line: "#EDE3E1", lineSoft: "#F6EFEE",
      danger: "#C0392B", success: "#4F7A5A", warning: "#D19A3E", gold: "#C2A15A",
    },
  },

  /** رمادي/أزرق — عملي. يناسب: قطع الغيار، الأدوات، B2B */
  steel: {
    label: "رمادي صناعي",
    colors: {
      primary: "#1F3A5F", primaryDeep: "#0F2138",
      accent: "#3D7EA6", accentAlt: "#5599BF",
      soft: "#CBD9E3", softTint: "#EEF3F7",
      surface: "#FFFFFF", surfaceAlt: "#F7F9FB", surfaceMuted: "#FCFDFE",
      ink: "#14202E", muted: "#4E5D6C", mutedLight: "#78848F",
      line: "#DDE4EA", lineSoft: "#EFF3F6",
      danger: "#C4453D", success: "#2D7A56", warning: "#C98A22", gold: "#C9A227",
    },
  },
};

/* ── الثيم النشط ── */
export const ACTIVE_THEME = "tulip";

/* ── التايبوغرافيا ── */
export const TYPOGRAPHY = {
  fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
  googleFontUrl:
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&display=swap",
  // العربية تحتاج ارتفاع سطر أعلى من اللاتينية للقراءة المريحة
  bodyLineHeight: 1.85,
  headingLineHeight: 1.35,
  // 700 بدل 800 — العناوين العريضة جدًا تُفقد الهوية أناقتها
  headingWeight: 700,
};

/* ── الأشكال ── */
export const SHAPES = {
  radius: "0.875rem",
  radiusLg: "1.25rem",
  radiusSm: "0.5rem",
  // مستطيل ناعم بدل الكبسولة — أهدأ وأقرب للطابع الحديث المينيمال
  buttonRadius: "0.75rem",
  cardRadius: "0.875rem",
  imageRadius: "0.875rem",
};

/* ── الحركة ── */
export const MOTION = {
  enabled: true,
  liftOnHover: true,
  zoomImageOnHover: true,
  duration: "0.32s",
  easing: "cubic-bezier(.22,.61,.36,1)",
};

/* ── الاتجاه ── */
export const DIRECTION = {
  dir: "rtl",
  lang: "ar",
};

/** يعيد ألوان الثيم النشط. */
export function themeColors(name = ACTIVE_THEME) {
  return (THEMES[name] || THEMES.tulip).colors;
}

/** يبني نص متغيّرات CSS لحقنها في :root. */
export function themeCssVars(name = ACTIVE_THEME) {
  const c = themeColors(name);
  const lines = Object.entries(c).map(
    ([k, v]) => `  --c-${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}: ${v};`
  );
  return [
    ":root {",
    ...lines,
    `  --radius: ${SHAPES.radius};`,
    `  --radius-lg: ${SHAPES.radiusLg};`,
    `  --btn-radius: ${SHAPES.buttonRadius};`,
    `  --card-radius: ${SHAPES.cardRadius};`,
    `  --font-body: ${TYPOGRAPHY.fontFamily};`,
    `  --lh-body: ${TYPOGRAPHY.bodyLineHeight};`,
    "}",
  ].join("\n");
}
