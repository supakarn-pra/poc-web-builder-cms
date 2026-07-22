"use client";

import { PanelLeftOpen, PanelRightOpen } from "lucide-react";

/**
 * แถบแคบแทนที่แผงข้างที่ถูกซ่อน — กดเพื่อแสดงแผงกลับมา
 * (ซ่อนแผงซ้าย/ขวาได้เพื่อให้พรีวิวกว้างเต็มที่)
 */
export function PanelRail({
  side,
  label,
  onOpen,
}: {
  side: "left" | "right";
  label: string;
  onOpen: () => void;
}) {
  const Icon = side === "left" ? PanelLeftOpen : PanelRightOpen;
  return (
    <div
      className={
        side === "left"
          ? "flex w-10 shrink-0 flex-col items-center gap-3 border-r border-border bg-surface py-3"
          : "flex w-10 shrink-0 flex-col items-center gap-3 border-l border-border bg-surface py-3"
      }
    >
      <button
        type="button"
        onClick={onOpen}
        title={`แสดง${label}`}
        aria-label={`แสดง${label}`}
        className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text"
      >
        <Icon size={16} />
      </button>
      <span className="select-none text-[10px] tracking-wide text-text-subtle [writing-mode:vertical-rl]">
        {label}
      </span>
    </div>
  );
}
