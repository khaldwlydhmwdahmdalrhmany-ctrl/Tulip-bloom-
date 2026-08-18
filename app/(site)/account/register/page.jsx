import React from "react";
import { redirect } from "next/navigation";
import AuthForm from "../../../../components/site/AuthForm.jsx";
import { getCurrentCustomer } from "../../../../lib/customerSession.js";
import { C } from "../../../../lib/colors.js";

export const dynamic = "force-dynamic";
export const metadata = { title: "إنشاء حساب" };

export default async function RegisterPage() {
  if (await getCurrentCustomer()) redirect("/account");
  return (
    <section className="section-y px-4 sm:px-6" style={{ background: C.offWhite }}>
      <AuthForm mode="register" />
    </section>
  );
}
