"use client";

import { Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/cn";
import { t } from "@/lib/messages";

export type DeviceMode = "desktop" | "tablet" | "mobile";

export function DevicePreviewSwitch({
  value,
  onChange,
}: {
  value: DeviceMode;
  onChange: (v: DeviceMode) => void;
}) {
  const opts: Array<{ id: DeviceMode; Icon: typeof Monitor; label: string }> = [
    { id: "desktop", Icon: Monitor, label: t.builder.device.desktop },
    { id: "tablet", Icon: Tablet, label: t.builder.device.tablet },
    { id: "mobile", Icon: Smartphone, label: t.builder.device.mobile },
  ];
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-surface p-0.5">
      {opts.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "grid h-8 w-9 place-items-center rounded text-text-muted hover:text-text",
            value === id && "bg-surface-muted text-text",
          )}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
