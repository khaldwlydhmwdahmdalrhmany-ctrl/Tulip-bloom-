"use client";
/**
 * مدير قوائم الحساب — العناوين، المستلمون، التذكيرات.
 *
 * مكوّن واحد يخدم الثلاثة بدل ثلاثة مكوّنات متطابقة: الفارق
 * بينها هو الحقول ومسار API فقط، والتكرار يضاعف مواضع الخطأ.
 */
import React, { useState } from "react";
import { Plus, Trash2, Loader2, Star, CalendarHeart, MapPin, Users } from "lucide-react";
import { C } from "../../lib/colors.js";

const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const ICONS = { addresses: MapPin, recipients: Users, reminders: CalendarHeart };

export default function AccountManager({ kind, initial = [], recipients = [] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const key = kind;                     // addresses | recipients | reminders
  const Icon = ICONS[kind] || MapPin;

  const call = async (method, body, qs = "") => {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/account/${key}${qs}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "تعذّر إتمام العملية."); return false; }
      setItems(data[key] || []);
      return true;
    } finally { setBusy(false); }
  };

  const add = async () => {
    const ok = await call("POST", form);
    if (ok) { setForm({}); setOpen(false); }
  };

  const remove = (id) => call("DELETE", null, `?id=${encodeURIComponent(id)}`);

  const field = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors focus:border-[color:var(--c-accent)]";
  const fieldStyle = { border: `1px solid ${C.line}`, background: C.pearl };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  /* ── وصف كل عنصر في القائمة ── */
  const describe = (it) => {
    if (kind === "addresses") {
      return [it.district, it.street].filter(Boolean).join("، ") || "بلا تفاصيل";
    }
    if (kind === "recipients") {
      return [it.relation, it.city, it.phone].filter(Boolean).join(" · ") || "بلا تفاصيل";
    }
    return [
      `${it.day} ${MONTHS[it.month - 1]}`,
      it.occasion,
      it.recipientName,
    ].filter(Boolean).join(" · ");
  };

  const titleOf = (it) =>
    kind === "addresses" ? (it.label || it.city || "عنوان") : (it.name || it.title);

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && !open && (
        <div className="p-8 rounded-2xl text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <span className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: C.mintTint, color: C.teal }}>
            <Icon size={20} />
          </span>
          <p className="text-sm mb-1" style={{ color: C.navy, fontWeight: 700 }}>
            {kind === "addresses" && "لا عناوين محفوظة"}
            {kind === "recipients" && "دفتر المستلمين فارغ"}
            {kind === "reminders" && "لا تذكيرات بعد"}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: C.slate }}>
            {kind === "addresses" && "احفظ عناوينك لتسريع الطلبات القادمة."}
            {kind === "recipients" && "احفظ من ترسل لهم الورد — أهلك وأصدقاؤك وزملاؤك."}
            {kind === "reminders" && "لن تنسى ميلادًا أو ذكرى بعد اليوم."}
          </p>
        </div>
      )}

      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-3 p-4 rounded-2xl"
             style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: C.softTint || C.mintTint, color: C.teal }}>
            <Icon size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold flex items-center gap-2" style={{ color: C.navy }}>
              {titleOf(it)}
              {it.isDefault ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                      style={{ background: C.teal, color: "#fff" }}>
                  <Star size={9} /> الافتراضي
                </span>
              ) : null}
            </p>
            <p className="text-xs truncate" style={{ color: C.slate }}>{describe(it)}</p>
          </div>
          <button onClick={() => remove(it.id)} disabled={busy}
                  aria-label="حذف"
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ color: C.danger, background: `${C.danger}0D` }}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      {open ? (
        <div className="p-5 rounded-2xl flex flex-col gap-3"
             style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          {kind === "addresses" && (
            <>
              <input className={field} style={fieldStyle} placeholder="التسمية (البيت، المكتب…)" value={form.label || ""} onChange={set("label")} />
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={field} style={fieldStyle} placeholder="المدينة *" value={form.city || ""} onChange={set("city")} />
                <input className={field} style={fieldStyle} placeholder="الحي" value={form.district || ""} onChange={set("district")} />
              </div>
              <input className={field} style={fieldStyle} placeholder="الشارع ورقم المبنى" value={form.street || ""} onChange={set("street")} />
              <input className={field} style={fieldStyle} placeholder="ملاحظات للمندوب" value={form.notes || ""} onChange={set("notes")} />
            </>
          )}

          {kind === "recipients" && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={field} style={fieldStyle} placeholder="الاسم *" value={form.name || ""} onChange={set("name")} />
                <input className={field} style={fieldStyle} placeholder="الصلة (الوالدة، صديق…)" value={form.relation || ""} onChange={set("relation")} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={`${field} text-right`} dir="ltr" style={fieldStyle} placeholder="05XXXXXXXX" value={form.phone || ""} onChange={set("phone")} />
                <input className={field} style={fieldStyle} placeholder="المدينة" value={form.city || ""} onChange={set("city")} />
              </div>
              <input className={field} style={fieldStyle} placeholder="الحي والشارع" value={form.street || ""} onChange={set("street")} />
            </>
          )}

          {kind === "reminders" && (
            <>
              <input className={field} style={fieldStyle} placeholder="عنوان التذكير (ميلاد الوالدة…) *" value={form.title || ""} onChange={set("title")} />
              <div className="grid grid-cols-2 gap-3">
                <select className={field} style={fieldStyle} value={form.month || ""} onChange={set("month")}>
                  <option value="">الشهر *</option>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select className={field} style={fieldStyle} value={form.day || ""} onChange={set("day")}>
                  <option value="">اليوم *</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <input className={field} style={fieldStyle} placeholder="نوع المناسبة (عيد ميلاد، ذكرى زواج…)" value={form.occasion || ""} onChange={set("occasion")} />
              {recipients.length > 0 && (
                <select className={field} style={fieldStyle} value={form.recipientId || ""} onChange={set("recipientId")}>
                  <option value="">اربطه بمستلم (اختياري)</option>
                  {recipients.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              )}
            </>
          )}

          {error && (
            <p className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: `${C.danger}12`, color: C.danger }}>
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button onClick={add} disabled={busy} className="btn flex-1 py-3 text-sm"
                    style={{ background: C.navy, color: "#fff", opacity: busy ? .6 : 1 }}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : null} حفظ
            </button>
            <button onClick={() => { setOpen(false); setError(""); }} className="btn px-5 py-3 text-sm"
                    style={{ background: C.lineSoft, color: C.slate }}>
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="btn w-full py-3.5 text-sm"
                style={{ background: C.mintTint, color: C.navy, border: `1px dashed ${C.teal}` }}>
          <Plus size={16} />
          {kind === "addresses" && "أضف عنوانًا"}
          {kind === "recipients" && "أضف مستلمًا"}
          {kind === "reminders" && "أضف تذكيرًا"}
        </button>
      )}
    </div>
  );
}
