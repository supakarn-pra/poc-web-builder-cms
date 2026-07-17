"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { rowPresets } from "@/lib/page/presets";
import { columnLayouts } from "@/lib/page/types";
import { t } from "@/lib/messages";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (source: { presetId?: string; spans?: number[] }) => void;
}

export function AddRowModal({ open, onClose, onAdd }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-surface shadow-[var(--shadow-md)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="เพิ่มแถวใหม่"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="font-medium">เพิ่มแถวใหม่</h2>
            <p className="text-[11px] text-text-subtle">
              เลือกแบบสำเร็จรูป หรือเริ่มจากแถวเปล่าแล้วเติมชิ้นส่วนเอง
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.action.cancel}
            className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
              แบบสำเร็จรูป
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {rowPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onAdd({ presetId: preset.id });
                    onClose();
                  }}
                  className="rounded-md border border-border px-3 py-2.5 text-left hover:border-[color:var(--brand-primary)]/60 hover:bg-surface-muted"
                >
                  <span className="block text-sm font-medium">
                    {preset.label}
                  </span>
                  <span className="text-xs text-text-muted">
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
              แถวเปล่า — เลือกจำนวนคอลัมน์
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((n) => {
                const spans = columnLayouts[n][0];
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      onAdd({ spans });
                      onClose();
                    }}
                    className="rounded-md border border-border p-2.5 hover:border-[color:var(--brand-primary)]/60 hover:bg-surface-muted"
                  >
                    <div className="grid h-8 grid-cols-12 gap-0.5">
                      {spans.map((s, i) => (
                        <div
                          key={i}
                          className="rounded-[2px] bg-text-subtle/40"
                          style={{ gridColumn: `span ${s} / span ${s}` }}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-center text-xs text-text-muted">
                      {n} คอลัมน์
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-text-subtle">
              ปรับสัดส่วนคอลัมน์ได้ภายหลังในแผงตั้งค่าด้านขวา
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
