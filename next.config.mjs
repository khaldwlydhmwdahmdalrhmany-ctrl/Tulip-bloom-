/** @type {import('next').NextConfig} */

/**
 * ترويسات الأمان.
 *
 * ملاحظة على CSP: لا نضع `Content-Security-Policy` مقيّدة لأن Google Tag
 * Manager يحقن سكربتات من نطاقات لا نعرفها مسبقًا (كل بكسل تضيفه لاحقًا).
 * سياسة صارمة كانت ستكسر التتبّع بصمت. نكتفي بترويسات لا تتعارض معه،
 * ونعتمد على حصر الكتابة خلف الجلسة كخط الدفاع الأساسي.
 */
const securityHeaders = [
  // منع تضمين الموقع في إطار — يحبط هجمات clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  // منع المتصفح من تخمين نوع الملف — يحبط رفع ملف يُنفَّذ كسكربت
  { key: "X-Content-Type-Options", value: "nosniff" },

  // لا نُسرّب المسار الكامل للمواقع الخارجية، مع إبقاء المصدر لأدوات التحليل
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // تعطيل صلاحيات لا يحتاجها المتجر
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },

  // فرض HTTPS لسنتين شاملًا النطاقات الفرعية
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },

  // منع تحميل موارد من نطاقنا داخل صفحات أخرى بلا إذن
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  poweredByHeader: false,   // إخفاء "X-Powered-By: Next.js" — لا نُعلن عن مكدّسنا
  compress: true,
  reactStrictMode: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.blob.vercel-storage.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // لوحة التحكم لا تُفهرس ولا تُخزَّن مؤقتًا
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        // الصور الثابتة — تخزين طويل، فهي لا تتغيّر
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
