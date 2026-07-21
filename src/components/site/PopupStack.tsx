"use client";

import { useEffect, useState } from "react";
import { PopupDialog, type PopupContent } from "./PopupDialog";

export type SitePopup = PopupContent;

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
    if (popup.allowHideToday && dontShowToday[popup.id]) {
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
          className="absolute flex w-full justify-center px-4"
          style={{
            // ซ้อนเหลื่อมกันตามลำดับ — อันแรก (ลำดับน้อยสุด) อยู่บนสุด
            transform: `translate(${i * 14}px, ${i * 14}px)`,
            zIndex: 90 - i,
          }}
        >
          <PopupDialog
            popup={popup}
            hideToday={!!dontShowToday[popup.id]}
            onHideTodayChange={(v) =>
              setDontShowToday((cur) => ({ ...cur, [popup.id]: v }))
            }
            onClose={() => close(popup)}
          />
        </div>
      ))}
    </div>
  );
}
