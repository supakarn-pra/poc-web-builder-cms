"use client";

import { useEffect, useState } from "react";

const STORAGE_PREFIX = "cookie-consent:";

/**
 * แถบขอความยินยอมใช้คุกกี้ — ลอยล่างสุดของจอ กด "ยอมรับ/ไม่ยอมรับ" แล้ว
 * จำคำตอบใน localStorage รายเว็บ (POC: จำอย่างเดียว ยังไม่ผูกกับ tracking จริง)
 */
export function CookieConsentClient({
  websiteId,
  title,
  text,
  policyUrl,
  acceptLabel,
  declineLabel,
}: {
  websiteId?: string;
  title?: string;
  text: string;
  policyUrl?: string;
  acceptLabel: string;
  declineLabel: string;
}) {
  // แสดงหลัง mount เท่านั้น — คำตอบเดิมอยู่ใน localStorage (กัน hydration mismatch)
  const [visible, setVisible] = useState(false);
  const storageKey = `${STORAGE_PREFIX}${websiteId ?? "site"}`;

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(localStorage.getItem(storageKey) === null);
    } catch {
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible) return null;

  function answer(value: "accepted" | "declined") {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      /* โหมด private — แค่ปิดแถบ */
    }
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[95] bg-black/90 px-5 py-4 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3">
        <div className="min-w-0 flex-1 basis-72 space-y-0.5">
          {title ? <p className="text-sm font-semibold underline">{title}</p> : null}
          <p className="text-xs leading-relaxed text-white/80">
            {text}
            {policyUrl ? (
              <>
                {" "}
                <a
                  href={policyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white"
                >
                  อ่านเพิ่มเติม
                </a>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => answer("accepted")}
            className="rounded-md border border-white bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
          >
            {acceptLabel}
          </button>
          <button
            type="button"
            onClick={() => answer("declined")}
            className="rounded-md border border-white/70 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            {declineLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
