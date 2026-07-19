"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error";

/** แบบฟอร์มติดต่อบนหน้าเว็บจริง — POST /api/forms แล้วโชว์สถานะ */
export function ContactFormClient({
  websiteId,
  buttonLabel,
}: {
  websiteId?: string;
  buttonLabel: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!websiteId) return; // ใน builder canvas — ไม่ส่งจริง
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          company: data.get("company") ?? "",
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error ?? "ส่งไม่สำเร็จ ลองอีกครั้ง");
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "ส่งไม่สำเร็จ ลองอีกครั้ง");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-6 text-sm">
        <Check size={16} className="text-success" />
        ส่งข้อความเรียบร้อย ขอบคุณที่ติดต่อเรา — เราจะตอบกลับโดยเร็ว
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="text"
        name="name"
        required
        placeholder="ชื่อของคุณ"
        className="block w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm placeholder:text-text-subtle"
      />
      <input
        type="email"
        name="email"
        required
        placeholder="อีเมล"
        className="block w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm placeholder:text-text-subtle"
      />
      <textarea
        name="message"
        required
        placeholder="ข้อความ"
        rows={4}
        className="block w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm placeholder:text-text-subtle"
      />
      {/* honeypot กันบอท — ซ่อนจากคนจริง */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--brand-primary)] px-5 py-2.5 text-white hover:bg-[color:var(--brand-primary-hover)] disabled:opacity-60"
      >
        {status === "sending" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : null}
        {status === "sending" ? "กำลังส่ง…" : buttonLabel}
      </button>
    </form>
  );
}
