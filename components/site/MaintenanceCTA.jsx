"use client";
import React from "react";
import { MessageCircle } from "lucide-react";
import { C, buildWhatsAppLink } from "../../lib/colors.js";
import { STORE } from "../../config/store.config.js";

export default function MaintenanceCTA({ planName }) {
  const requestPlan = () => {
    const msg = `مرحبًا ${STORE.shortName} 🌿\nأرغب بحجز موعد صيانة دورية — ${planName}`;
    window.open(buildWhatsAppLink(msg), "_blank");
  };
  return (
    <button onClick={requestPlan} className="w-full py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2" style={{ background: C.navy, color: C.pearl }}>
      <MessageCircle size={15} /> احجز موعد
    </button>
  );
}
