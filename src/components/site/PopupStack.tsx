"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface SitePopup {
  id: string;
  title: string | null;
  text: string;
  imageUrl: string | null;
}

const STORAGE_PREFIX = "popup-hidden:";

/** วันนี้แบบ local (YYYY-MM-DD) — ใช้เทียบ "ไม่ต้องแสดงอีกในวันนี้" */
function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

/**
 * Pop-up ซ้อนกันตามลำดับ (ตัวแรก = ลำดับน้อยสุด อยู่บนสุด) — ปิดทีละอัน
 * ติ๊ก "ไม่ต้องแสดงอีกในวันนี้" แล้วจำใน localStorage รายอัน หมดอายุข้ามวัน
 */
export function PopupStack({ popups }: { popups: SitePopup[] }) {
  // render หลัง mount เท่านั้น — สถานะซ่อนอยู่ใน localStorage (กัน hydration mismatch)
  const [visible, setVisible] = useState<SitePopup[] | null>(null);
  const [dontShowToday, setDontShowToday] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const today = todayKey();
    // อ่าน localStorage ได้หลัง mount เท่านั้น — ตั้ง state ครั้งเดียวตอนรู้ผล
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(
      popups.filter((p) => {
        try {
          return localStorage.getItem(STORAGE_PREFIX + p.id) !== today;
        } catch {
          return true;
        }
      }),
    );
  }, [popups]);

  if (!visible || visible.length === 0) return null;

  function close(popup: SitePopup) {
    if (dontShowToday[popup.id]) {
      try {
        localStorage.setItem(STORAGE_PREFIX + popup.id, todayKey());
      } catch {
        /* โหมด private/บล็อก storage — แค่ปิดเฉย ๆ */
      }
    }
    setVisible((cur) => (cur ? cur.filter((p) => p.id !== popup.id) : cur));
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
      {visible.map((popup, i) => (
        <div
          key={popup.id}
          role="dialog"
          aria-modal="true"
          aria-label={popup.title ?? "ประกาศ"}
          className="absolute w-full max-w-md overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-md)]"
          style={{
            // ซ้อนเหลื่อมกันตามลำดับ — อันแรก (ลำดับน้อยสุด) อยู่บนสุด
            transform: `translate(${i * 14}px, ${i * 14}px)`,
            zIndex: 90 - i,
          }}
        >
          <button
            type="button"
            onClick={() => close(popup)}
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
                <h2 className="font-display text-lg font-semibold">
                  {popup.title}
                </h2>
              ) : null}
              {popup.text ? (
                <p className="whitespace-pre-line text-sm text-text-muted">
                  {popup.text}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
            <label className="flex items-center gap-2 text-xs text-text-muted">
              <input
                type="checkbox"
                checked={!!dontShowToday[popup.id]}
                onChange={(e) =>
                  setDontShowToday((cur) => ({
                    ...cur,
                    [popup.id]: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-border"
              />
              ไม่ต้องแสดงอีกในวันนี้
            </label>
            <button
              type="button"
              onClick={() => close(popup)}
              className="rounded-md bg-[color:var(--brand-primary)] px-4 py-1.5 text-sm text-white hover:bg-[color:var(--brand-primary-hover)]"
            >
              ปิด
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
