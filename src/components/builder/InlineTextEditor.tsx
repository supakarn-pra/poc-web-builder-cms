"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * แก้ข้อความตรงบน canvas (contentEditable แบบ uncontrolled — กัน caret เด้ง)
 * - Enter = บันทึก (เว้น multiline ที่ Enter ขึ้นบรรทัดใหม่, บันทึกตอน blur)
 * - Escape = ยกเลิก
 */
export function InlineTextEditor({
  tag,
  className,
  initial,
  multiline = false,
  onCommit,
  onCancel,
}: {
  tag: "h1" | "h2" | "h3" | "p";
  className: string;
  initial: string;
  multiline?: boolean;
  onCommit: (text: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLElement | null>(null);
  // กัน blur ยิง commit ซ้ำหลัง Enter/Escape จัดการไปแล้ว
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = initial;
    el.focus();
    // วาง caret ท้ายข้อความ
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    // ตั้งค่าครั้งเดียวตอน mount เท่านั้น — ค่า initial ใหม่ = remount ด้วย key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commit() {
    if (done.current) return;
    done.current = true;
    onCommit(ref.current?.innerText.replace(/\n+$/, "") ?? "");
  }

  const Tag = tag;
  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="แก้ข้อความ"
      className={cn(
        className,
        "cursor-text rounded-sm outline-none ring-2 ring-[color:var(--brand-primary)] ring-offset-2",
      )}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation(); // กัน shortcut ของ builder (undo ฯลฯ) ระหว่างพิมพ์
        if (e.key === "Escape") {
          e.preventDefault();
          done.current = true;
          onCancel();
        } else if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          commit();
        }
      }}
      onBlur={commit}
    />
  );
}
