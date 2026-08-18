"use client";
/**
 * ملف جهة الاتصال: ملخّص، طلبات، ملاحظات، مهام، وسوم،
 * وبيانات الحساب (للمسجّلين فقط).
 */
import React, { useState } from "react";
import {
  Phone, Mail, MessageCircle, Plus, Trash2, Check, Loader2, Tag as TagIcon,
  X, CalendarClock, MapPin, Users, Heart, ShoppingBag, StickyNote,
} from "lucide-react";
import { themeColors, TYPOGRAPHY } from "../config/theme.config.js";

const T = themeColors();
const H = { fontFamily: TYPOGRAPHY.headingFontFamily, fontWeight: 600 };
const n = (v) => Number(v || 0).toLocaleString("ar-SA");
const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const fmt = (d) => (d ? new Date(d).toLocaleDateString("ar-SA") : "—");

const QUICK_TAGS = ["عميل مميّز", "يفضّل التوصيل مساءً", "حسّاس للسعر", "طلبات شركات", "يحتاج متابعة"];

export default function ContactDetail({ contact, notes: n0 = [], tasks: t0 = [], account, segmentLabels = {}, currency = "ر.س" }) {
  const [notes, setNotes] = useState(n0);
  const [tasks, setTasks] = useState(t0);
  const [tags, setTags] = useState(contact.tags || []);
  const [noteText, setNoteText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const card = { background: "#fff", border: `1px solid ${T.line}` };
  const field = "w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none";
  const fieldStyle = { border: `1px solid ${T.line}`, background: T.surfaceAlt };

  const call = async (payload) => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/crm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactKey: contact.key, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "تعذّر تنفيذ الإجراء."); return null; }
      return data;
    } finally { setBusy(false); }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    const d = await call({ action: "add-note", body: noteText });
    if (d?.notes) { setNotes(d.notes); setNoteText(""); }
  };
  const delNote = async (id) => { const d = await call({ action: "delete-note", id }); if (d?.notes) setNotes(d.notes); };

  const addTask = async () => {
    if (!taskTitle.trim()) return;
    const d = await call({ action: "add-task", title: taskTitle, dueAt: taskDue || null });
    if (d?.tasks) { setTasks(d.tasks.map(norm)); setTaskTitle(""); setTaskDue(""); }
  };
  const norm = (x) => ({ id: x.id, title: x.title, dueAt: x.dueAt, done: x.done === true || x.done === 1 });
  const toggleTask = async (t) => { const d = await call({ action: "toggle-task", id: t.id, done: !t.done }); if (d?.tasks) setTasks(d.tasks.map(norm)); };
  const delTask = async (id) => { const d = await call({ action: "delete-task", id }); if (d?.tasks) setTasks(d.tasks.map(norm)); };

  const addTag = async (tag) => {
    const t = String(tag).trim();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]); setTagInput("");
    await call({ action: "add-tag", tag: t });
  };
  const removeTag = async (t) => { setTags(tags.filter((x) => x !== t)); await call({ action: "remove-tag", tag: t }); };

  const wa = contact.phone
    ? `https://wa.me/${contact.phone}?text=${encodeURIComponent(`مرحبًا ${contact.name || ""}`)}`
    : null;

  return (
    <div className="flex flex-col gap-5">

      {/* ══ الترويسة ══ */}
      <div className="p-5 sm:p-6 rounded-2xl" style={card}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-xl" style={{ color: T.primary, ...H }}>{contact.name || "بلا اسم"}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={contact.registered
                      ? { background: `${T.success}15`, color: T.success }
                      : { background: T.surfaceAlt, color: T.muted }}>
                {contact.registered ? "حساب مسجّل" : "ضيف"}
              </span>
              {contact.segments.map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: T.softTint, color: T.primary }}>
                  {segmentLabels[s] || s}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-[12px]" style={{ color: T.muted }}>
              {contact.phone && <span className="flex items-center gap-1.5" dir="ltr"><span>{contact.phone}</span><Phone size={12} /></span>}
              {contact.email && <span className="flex items-center gap-1.5" dir="ltr"><span>{contact.email}</span><Mail size={12} /></span>}
            </div>
          </div>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer"
               className="px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 shrink-0"
               style={{ background: "#25D36618", color: "#128C7E" }}>
              <MessageCircle size={15} /> واتساب
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {[
            { l: "الطلبات", v: n(contact.orderCount) },
            { l: "إجمالي الشراء", v: `${n(contact.lifetimeValue)} ${currency}` },
            { l: "متوسط الطلب", v: `${n(contact.avgOrder)} ${currency}` },
            { l: "آخر طلب", v: fmt(contact.lastOrderAt) },
          ].map((s) => (
            <div key={s.l} className="p-3 rounded-xl" style={{ background: T.surfaceAlt }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: T.mutedLight }}>{s.l}</p>
              <p className="text-sm num" style={{ color: T.primary, ...H }}>{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs font-bold px-4 py-3 rounded-xl" style={{ background: `${T.danger}12`, color: T.danger }}>{error}</p>
      )}

      {/* ══ الوسوم ══ */}
      <div className="p-5 rounded-2xl" style={card}>
        <h2 className="text-sm mb-3 flex items-center gap-2" style={{ color: T.primary, ...H }}>
          <TagIcon size={14} /> الوسوم
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((t) => (
            <span key={t} className="text-[12px] px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                  style={{ background: T.softTint, color: T.primary }}>
              {t}
              <button onClick={() => removeTag(t)} aria-label="إزالة"><X size={11} /></button>
            </span>
          ))}
          {tags.length === 0 && <span className="text-[12px]" style={{ color: T.mutedLight }}>لا وسوم بعد.</span>}
        </div>
        <div className="flex gap-2 mb-3">
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && addTag(tagInput)}
                 placeholder="وسم جديد…" className={field} style={fieldStyle} />
          <button onClick={() => addTag(tagInput)} disabled={busy}
                  className="px-4 rounded-xl text-[12px] font-bold shrink-0"
                  style={{ background: T.primary, color: "#fff" }}>إضافة</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TAGS.filter((t) => !tags.includes(t)).map((t) => (
            <button key={t} onClick={() => addTag(t)}
                    className="text-[11px] px-2.5 py-1 rounded-lg"
                    style={{ background: T.surfaceAlt, color: T.muted, border: `1px dashed ${T.line}` }}>
              + {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* ══ المهام ══ */}
        <div className="p-5 rounded-2xl" style={card}>
          <h2 className="text-sm mb-3 flex items-center gap-2" style={{ color: T.primary, ...H }}>
            <CalendarClock size={14} /> متابعات
          </h2>
          <div className="flex gap-2 mb-3">
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                   placeholder="اتصل قبل عيد الأم…" className={field} style={fieldStyle} />
            <input value={taskDue} onChange={(e) => setTaskDue(e.target.value)} type="date"
                   className={`${field} w-auto shrink-0`} style={fieldStyle} />
            <button onClick={addTask} disabled={busy || !taskTitle.trim()}
                    className="px-3 rounded-xl shrink-0" style={{ background: T.primary, color: "#fff" }}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />}
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-[12px] py-4 text-center" style={{ color: T.mutedLight }}>لا متابعات.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {tasks.map((t) => {
                const overdue = !t.done && t.dueAt && new Date(t.dueAt).getTime() < Date.now();
                return (
                  <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                       style={{ background: overdue ? `${T.danger}0D` : T.surfaceAlt, opacity: t.done ? .55 : 1 }}>
                    <button onClick={() => toggleTask(t)}
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{ border: `1.5px solid ${t.done ? T.success : T.line}`, background: t.done ? T.success : "#fff" }}>
                      {t.done && <Check size={12} color="#fff" />}
                    </button>
                    <span className="flex-1 text-[12px] truncate"
                          style={{ color: T.ink, textDecoration: t.done ? "line-through" : "none" }}>
                      {t.title}
                    </span>
                    {t.dueAt && (
                      <span className="num text-[10px] shrink-0" style={{ color: overdue ? T.danger : T.mutedLight }}>
                        {fmt(t.dueAt)}
                      </span>
                    )}
                    <button onClick={() => delTask(t.id)} style={{ color: T.danger }} className="shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══ الملاحظات ══ */}
        <div className="p-5 rounded-2xl" style={card}>
          <h2 className="text-sm mb-3 flex items-center gap-2" style={{ color: T.primary, ...H }}>
            <StickyNote size={14} /> ملاحظات داخلية
          </h2>
          <div className="flex flex-col gap-2 mb-3">
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2}
                      placeholder="تفضّل الورد الأبيض · لا ترسل فاتورة مع الهدية…"
                      className={`${field} resize-none`} style={fieldStyle} />
            <button onClick={addNote} disabled={busy || !noteText.trim()}
                    className="w-fit px-4 py-2 rounded-xl text-[12px] font-bold"
                    style={{ background: T.primary, color: "#fff", opacity: noteText.trim() ? 1 : .5 }}>
              حفظ الملاحظة
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="text-[12px] py-4 text-center" style={{ color: T.mutedLight }}>لا ملاحظات.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {notes.map((x) => (
                <div key={x.id} className="p-3 rounded-xl" style={{ background: T.surfaceAlt }}>
                  <p className="text-[12px] leading-relaxed mb-1.5" style={{ color: T.ink }}>{x.body}</p>
                  <div className="flex items-center justify-between">
                    <span className="num text-[10px]" style={{ color: T.mutedLight }}>{fmt(x.createdAt)}</span>
                    <button onClick={() => delNote(x.id)} style={{ color: T.danger }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ الطلبات ══ */}
      <div className="p-5 rounded-2xl" style={card}>
        <h2 className="text-sm mb-3 flex items-center gap-2" style={{ color: T.primary, ...H }}>
          <ShoppingBag size={14} /> الطلبات ({n(contact.orders.length)})
        </h2>
        {contact.orders.length === 0 ? (
          <p className="text-[12px] py-4 text-center" style={{ color: T.mutedLight }}>لا طلبات.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {contact.orders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: T.surfaceAlt }}>
                <span className="num text-[12px] font-bold" style={{ color: T.primary }}>{o.orderNumber || o.id.slice(0, 8)}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#fff", color: T.muted }}>{o.status}</span>
                {o.couponCode && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" dir="ltr"
                        style={{ background: `${T.gold}18`, color: T.gold }}>{o.couponCode}</span>
                )}
                <span className="num text-[11px] flex-1 text-left" style={{ color: T.mutedLight }}>{fmt(o.createdAt)}</span>
                <span className="num text-[13px] shrink-0" style={{ color: T.primary, ...H }}>{n(o.total)} {currency}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ بيانات الحساب — للمسجّلين فقط ══ */}
      {account && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl" style={card}>
            <h3 className="text-[13px] mb-3 flex items-center gap-2" style={{ color: T.primary, ...H }}>
              <MapPin size={13} /> العناوين ({n(account.addresses.length)})
            </h3>
            {account.addresses.map((a) => (
              <p key={a.id} className="text-[12px] mb-1" style={{ color: T.muted }}>
                {a.label || a.city} — {[a.district, a.city].filter(Boolean).join("، ")}
              </p>
            ))}
            {account.addresses.length === 0 && <p className="text-[12px]" style={{ color: T.mutedLight }}>—</p>}
          </div>

          <div className="p-5 rounded-2xl" style={card}>
            <h3 className="text-[13px] mb-3 flex items-center gap-2" style={{ color: T.primary, ...H }}>
              <Users size={13} /> المستلمون ({n(account.recipients.length)})
            </h3>
            {account.recipients.map((r) => (
              <p key={r.id} className="text-[12px] mb-1" style={{ color: T.muted }}>
                {r.name}{r.relation ? ` — ${r.relation}` : ""}
              </p>
            ))}
            {account.recipients.length === 0 && <p className="text-[12px]" style={{ color: T.mutedLight }}>—</p>}
          </div>

          <div className="p-5 rounded-2xl" style={card}>
            <h3 className="text-[13px] mb-3 flex items-center gap-2" style={{ color: T.primary, ...H }}>
              <Heart size={13} /> المناسبات والمفضّلة
            </h3>
            {account.reminders.map((r) => (
              <p key={r.id} className="text-[12px] mb-1" style={{ color: T.muted }}>
                {r.title} — {r.day} {MONTHS[r.month - 1]}
              </p>
            ))}
            <p className="text-[12px] mt-2" style={{ color: T.mutedLight }}>
              {n(account.favoritesCount)} منتج في المفضّلة
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
