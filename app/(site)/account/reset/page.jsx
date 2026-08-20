import React from "react";
import ResetForm from "../../../../components/site/ResetForm.jsx";
import { C } from "../../../../lib/colors.js";

export const dynamic = "force-dynamic";
export const metadata = { title: "إعادة تعيين كلمة المرور", robots: { index: false, follow: false } };

export default function ResetPage({ searchParams }) {
  return (
    <section className="section-y px-4 sm:px-6" style={{ background: C.offWhite }}>
      <ResetForm token={searchParams?.token || ""} />
    </section>
  );
}
