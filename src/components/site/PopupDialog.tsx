"use client";

import { X } from "lucide-react";

export interface PopupContent {
  id: string;
  title: string | null;
  text: string;
  imageUrl: string | null;
  /** แสดงช่องติ๊ก "ไม่ต้องแสดงอีกในวันนี้" ไหม */
  allowHideToday: boolean;
}

/**
 * การ์ด Pop-up หนึ่งใบ — ใช้ทั้งเว็บจริง (PopupStack) และปุ่ม "ดูตัวอย่าง"
 * ใน CMS เพื่อให้เห็นหน้าตาตรงกับของจริงเสมอ (ตัวแม่จัดตำแหน่ง/ซ้อนเอง)
 */
export function PopupDialog({
  popup,
  hideToday,
  onHideTodayChange,
  onClose,
}: {
  popup: PopupContent;
  hideToday: boolean;
  onHideTodayChange: (v: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={popup.title ?? "ประกาศ"}
      className="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-md)]"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="ปิด"
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-md bg-black/30 text-white hover:bg-black/50"
      >
        <X size={16} />
      </button>

      {popup.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={popup.imageUrl}
          alt=""
          className="max-h-72 w-full object-cover"
        />
      ) : null}

      {popup.title || popup.text ? (
        <div className="space-y-2 p-5">
          {popup.title ? (
            <h2 className="font-display text-lg font-semibold">{popup.title}</h2>
          ) : null}
          {popup.text ? (
            <p className="whitespace-pre-line text-sm text-text-muted">
              {popup.text}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
        {popup.allowHideToday ? (
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={hideToday}
              onChange={(e) => onHideTodayChange(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            ไม่ต้องแสดงอีกในวันนี้
          </label>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-[color:var(--brand-primary)] px-4 py-1.5 text-sm text-white hover:bg-[color:var(--brand-primary-hover)]"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
