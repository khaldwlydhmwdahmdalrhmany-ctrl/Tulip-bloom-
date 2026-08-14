"use client";
import React, { useState } from "react";
import { Send, User, Phone, MessageSquare, Tag } from "lucide-react";
import { C, buildWhatsAppLink } from "../../lib/colors.js";
import { trackLead } from "../../lib/analytics.js";
import { STORE } from "../../config/store.config.js";

import { CONTACT_FORM } from "../../config/content.config.js";

const REQUEST_TYPES = CONTACT_FORM.requestTypes;

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", phone: "", type: REQUEST_TYPES[0], message: "" });
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("الاسم ورقم الجوال مطلوبان.");
      return;
    }
    // رقم سعودي: يبدأ بـ 05 أو 5 أو 9665، ويُقبل مع مسافات أو شرطات
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setError("رقم الجوال غير مكتمل — تأكد منه من فضلك.");
      return;
    }
    setError("");

    const msg =
      `السلام عليكم ${STORE.shortName} 🌿\n\n` +
      `• الاسم: ${form.name}\n` +
      `• الجوال: ${form.phone}\n` +
      `• نوع الطلب: ${form.type}\n` +
      (form.message.trim() ? `\n${form.message.trim()}` : "");

    trackLead("contact_form", null);
    window.open(buildWhatsAppLink(msg), "_blank");
  };

  const field = "w-full mt-1.5 px-4 py-3 rounded-xl text-sm outline-none transition-shadow";
  const fieldStyle = { border: `1.5px solid ${C.line}`, background: "#fff" };

  return (
    <div className="p-6 sm:p-8 rounded-3xl" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <h2 className="h-card font-display mb-1" style={{ color: C.navy }}>أرسل لنا رسالة</h2>
      <p className="text-sm mb-6" style={{ color: C.slate }}>
        نرد عادة خلال دقائق في أوقات العمل.
      </p>

      <div className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: C.navy }}>
              <User size={13} /> الاسم *
            </label>
            <input value={form.name} onChange={set("name")} placeholder="اسمك الكريم" className={field} style={fieldStyle} />
          </div>
          <div>
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: C.navy }}>
              <Phone size={13} /> رقم الجوال *
            </label>
            <input
              value={form.phone}
              onChange={set("phone")}
              type="tel"
              inputMode="tel"
              dir="ltr"
              placeholder="05XXXXXXXX"
              className={`${field} text-right`}
              style={fieldStyle}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: C.navy }}>
            <Tag size={13} /> نوع الطلب
          </label>
          <select value={form.type} onChange={set("type")} className={field} style={fieldStyle}>
            {REQUEST_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: C.navy }}>
            <MessageSquare size={13} /> الرسالة
          </label>
          <textarea
            value={form.message}
            onChange={set("message")}
            rows={4}
            placeholder={CONTACT_FORM.messagePlaceholder}
            className={`${field} resize-none`}
            style={fieldStyle}
          />
        </div>

        {error && (
          <p className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: `${C.danger}12`, color: C.danger }}>
            {error}
          </p>
        )}

        <button onClick={submit} className="btn w-full py-3.5 text-sm" style={{ background: C.navy, color: "#fff" }}>
          <Send size={16} /> إرسال عبر واتساب
        </button>

        <p className="text-[11px] text-center" style={{ color: C.slateLight }}>
          يفتح واتساب برسالة جاهزة تحتوي بياناتك — تراجعها قبل الإرسال.
        </p>
      </div>
    </div>
  );
}
