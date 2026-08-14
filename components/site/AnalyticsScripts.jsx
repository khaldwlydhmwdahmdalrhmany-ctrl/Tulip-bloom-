import React from "react";
import Script from "next/script";

/**
 * حقن أكواد التتبّع — كلها من لوحة التحكم، لا شيء مكتوب في الكود.
 *
 * strategy="afterInteractive" تُحمّل الأكواد بعد أن تصبح الصفحة قابلة
 * للتفاعل، فلا تؤخّر ظهور المحتوى ولا تضر بمؤشرات Core Web Vitals.
 *
 * dataLayer يُهيَّأ قبل GTM ليلتقط أي حدث يُدفع مبكرًا.
 */
export default function AnalyticsScripts({ settings = {} }) {
  const gtm = (settings.gtm_id || "").trim();
  const ga4 = (settings.ga4_id || "").trim();
  const gads = (settings.gads_id || "").trim();
  const clarity = (settings.clarity_id || "").trim();
  const uet = (settings.uet_id || "").trim();

  const gtagId = ga4 || gads;

  return (
    <>
      {/* تهيئة dataLayer قبل أي شيء */}
      <Script id="dl-init" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || [];`}
      </Script>

      {/* Google Tag Manager — الحاوية التي تُدار منها كل البكسلات */}
      {gtm && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      )}

      {/* GA4 / Google Ads مباشرة — لمن لا يريد إدارتهما من GTM */}
      {gtagId && (
        <>
          <Script id="gtag-src" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`} />
          <Script id="gtag-init" strategy="afterInteractive">
            {`function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
${ga4 ? `gtag('config', '${ga4}', { anonymize_ip: true });` : ""}
${gads ? `gtag('config', '${gads}');` : ""}`}
          </Script>
        </>
      )}

      {/* Microsoft Clarity — خرائط حرارية وتسجيل جلسات */}
      {clarity && (
        <Script id="clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");`}
        </Script>
      )}

      {/* Microsoft Advertising UET */}
      {uet && (
        <Script id="uet" strategy="afterInteractive">
          {`(function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:"${uet}",enableAutoSpaTracking:true};
o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,
n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},
i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,"script","//bat.bing.com/bat.js","uetq");`}
        </Script>
      )}
    </>
  );
}

/** بديل GTM لمتصفحات JavaScript معطّل — يوضع أول <body>. */
export function GtmNoScript({ settings = {} }) {
  const gtm = (settings.gtm_id || "").trim();
  if (!gtm) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
        height="0" width="0" style={{ display: "none", visibility: "hidden" }}
        title="gtm"
      />
    </noscript>
  );
}
