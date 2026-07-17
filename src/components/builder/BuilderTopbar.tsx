"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Redo2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DevicePreviewSwitch, type DeviceMode } from "./DevicePreviewSwitch";
import type { BuilderPageInfo } from "./BuilderShell";
import { t } from "@/lib/messages";

export type SaveStatus = "saved" | "pending" | "saving" | "error";

const statusDisplay: Record<
  SaveStatus,
  { label: string; tone: "muted" | "success" | "danger" }
> = {
  saved: { label: t.action.saved, tone: "success" },
  pending: { label: "มีการแก้ไข…", tone: "muted" },
  saving: { label: "กำลังบันทึก…", tone: "muted" },
  error: { label: "บันทึกไม่สำเร็จ — จะลองใหม่เมื่อแก้ไขอีกครั้ง", tone: "danger" },
};

export function BuilderTopbar({
  websiteId,
  pageId,
  websiteName,
  pages,
  device,
  onDeviceChange,
  saveStatus,
}: {
  websiteId: string;
  pageId: string;
  websiteName: string;
  pages: BuilderPageInfo[];
  device: DeviceMode;
  onDeviceChange: (v: DeviceMode) => void;
  saveStatus: SaveStatus;
}) {
  const router = useRouter();
  const status = statusDisplay[saveStatus];

  return (
    <div className="h-14 flex items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/dashboard"
          className="grid h-8 w-8 place-items-center rounded-md hover:bg-surface-muted text-text-muted"
          aria-label="กลับสู่ภาพรวม"
        >
          <ArrowLeft size={16} />
        </Link>

        {/* Page switcher */}
        <div className="relative">
          <select
            value={pageId}
            onChange={(e) =>
              router.push(`/builder/${websiteId}/${e.target.value}`)
            }
            aria-label="เลือกหน้าที่จะแก้ไข"
            className="appearance-none rounded-md border border-border bg-surface py-1.5 pl-3 pr-8 text-sm font-medium hover:bg-surface-muted"
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.isHome ? " (หน้าแรก)" : ""}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle"
          />
        </div>

        <p className="hidden md:block text-[11px] text-text-subtle">
          {websiteName} · ทั้งหมด {pages.length} หน้า
        </p>

        <div
          className={
            "ml-2 flex items-center gap-1 text-xs " +
            (status.tone === "success"
              ? "text-text-muted"
              : status.tone === "danger"
                ? "text-danger"
                : "text-text-subtle")
          }
        >
          {saveStatus === "saved" ? (
            <Check size={12} className="text-success" />
          ) : saveStatus === "error" ? (
            <AlertCircle size={12} />
          ) : (
            <Loader2 size={12} className="animate-spin" />
          )}
          <span>{status.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DevicePreviewSwitch value={device} onChange={onDeviceChange} />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted"
          aria-label="ย้อนกลับ"
          title="Undo — มาใน Sprint 6"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted"
          aria-label="ทำซ้ำ"
          title="Redo — มาใน Sprint 6"
        >
          <Redo2 size={16} />
        </button>
        <Button variant="secondary" size="sm" title="มาใน Sprint 5">
          {t.action.preview}
        </Button>
        <Button variant="primary" size="sm" title="มาใน Sprint 5">
          {t.action.publish}
        </Button>
      </div>
    </div>
  );
}
