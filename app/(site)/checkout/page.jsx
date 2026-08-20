import React from "react";
import CheckoutClient from "../../../components/site/CheckoutClient.jsx";
import { STORE } from "../../../config/store.config.js";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "إتمام الطلب",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutClient currency={STORE.currencyLabel} whatsapp={STORE.whatsapp} />;
}
