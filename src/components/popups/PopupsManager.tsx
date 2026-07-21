"use client";

import { useActionState, useEffect, useState } from "react";
import { ImageIcon, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  deletePopup,
  savePopup,
  type PopupActionState,
} from "@/server/actions/popup";
import { MediaPicker } from "@/components/media/MediaPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export interface PopupRow {
  id: string;
  title: string | null;
  text: string;
  imageUrl: string | null;
  pageIds: string; // "ALL" | JSON array
  sortIndex: number;
  enabled: boolean;
}

export interface PopupPageOption {
  id: string;
  name: string;
  isHome: boolean;
}

function parsePageIds(raw: string): string[] {
  if (raw === "ALL") return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function PopupsManager({
  websiteId,
  pages,
  popups,
}: {
  websiteId: string;
  pages: PopupPageOption[];
  popups: PopupRow[];
}) {
  const [editing, setEditing] = useState<PopupRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-text-muted">
        Pop-up จะเด้งขึ้นเมื่อคนเปิดหน้าเว็บ — สร้างได้หลายอัน แสดงซ้อนกันตามลำดับ
        คนดูกดปิดหรือติ๊ก &quot;ไม่ต้องแสดงอีกในวันนี้&quot; ได้
      </p>

      {popups.length > 0 ? (
        <div className="rounded-lg border border-border bg-surface divide-y divide-border">
          {popups.map((p) => {
            const targeted = parsePageIds(p.pageIds);
            const targetLabel =
              p.pageIds === "ALL"
                ? "ทุกหน้า"
                : `${targeted.length} หน้า (${targeted
                    .map((id) => pages.find((pg) => pg.id === id)?.name ?? "?")
                    .slice(0, 3)
                    .join(", ")}${targeted.length > 3 ? ", …" : ""})`;
            return (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-muted text-text-subtle">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={16} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {p.title || p.text || "(รูปภาพอย่างเดียว)"}
                  </p>
                  <p className="truncate text-xs text-text-subtle">
                    แสดงใน: {targetLabel} · ลำดับ {p.sortIndex}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    p.enabled
                      ? "bg-success/10 text-success"
                      : "bg-surface-muted text-text-subtle",
                  )}
                >
                  {p.enabled ? "เปิดใช้งาน" : "ปิดอยู่"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="แก้ไข"
                    aria-label={`แก้ไข Pop-up ${p.title ?? ""}`}
                    onClick={() => setEditing(p)}
                    className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted"
                  >
                    <Pencil size={14} />
                  </button>
                  <DeletePopupButton popup={p} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-text-muted">
          ยังไม่มี Pop-up — สร้างอันแรกเพื่อโปรโมทข่าวสารหรือโปรโมชั่น
        </div>
      )}

      <Button onClick={() => setCreateOpen(true)}>
        <Plus size={16} /> สร้าง Pop-up
      </Button>

      {createOpen ? (
        <PopupFormModal
          websiteId={websiteId}
          pages={pages}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}
      {editing ? (
        <PopupFormModal
          websiteId={websiteId}
          pages={pages}
          popup={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function DeletePopupButton({ popup }: { popup: PopupRow }) {
  const [state, action, pending] = useActionState<PopupActionState, FormData>(
    deletePopup,
    {},
  );
  useEffect(() => {
    if (state.error) window.alert(state.error);
  }, [state]);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("ลบ Pop-up นี้ใช่ไหม?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="popupId" value={popup.id} />
      <button
        type="submit"
        disabled={pending}
        title="ลบ"
        aria-label={`ลบ Pop-up ${popup.title ?? ""}`}
        className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted hover:text-danger disabled:opacity-50"
      >
        <Trash2 size={14} />
      </button>
    </form>
  );
}

function PopupFormModal({
  websiteId,
  pages,
  popup,
  onClose,
}: {
  websiteId: string;
  pages: PopupPageOption[];
  popup?: PopupRow;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<PopupActionState, FormData>(
    savePopup,
    {},
  );
  const [target, setTarget] = useState<"ALL" | "PAGES">(
    popup && popup.pageIds !== "ALL" ? "PAGES" : "ALL",
  );
  const [selected, setSelected] = useState<string[]>(
    popup ? parsePageIds(popup.pageIds) : [],
  );
  const [imageUrl, setImageUrl] = useState(popup?.imageUrl ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);

  // ปิด modal เมื่อบันทึกสำเร็จ
  useEffect(() => {
    if (state.saved) onClose();
  }, [state, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-surface shadow-[var(--shadow-md)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={popup ? "แก้ไข Pop-up" : "สร้าง Pop-up"}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-medium">{popup ? "แก้ไข Pop-up" : "สร้าง Pop-up"}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted"
          >
            <X size={16} />
          </button>
        </div>

        <form action={action} className="space-y-4 p-5">
          <input type="hidden" name="websiteId" value={websiteId} />
          <input type="hidden" name="popupId" value={popup?.id ?? ""} />
          <input type="hidden" name="target" value={target} />
          <input type="hidden" name="pageIds" value={JSON.stringify(selected)} />
          <input type="hidden" name="imageUrl" value={imageUrl} />

          <Input
            name="title"
            label="หัวข้อ (ไม่บังคับ)"
            defaultValue={popup?.title ?? ""}
            placeholder="เช่น โปรโมชั่นเดือนนี้"
          />

          <label className="block space-y-1">
            <span className="text-sm font-medium">ข้อความ</span>
            <textarea
              name="text"
              defaultValue={popup?.text ?? ""}
              rows={3}
              placeholder="ข้อความที่อยากบอกคนเข้าเว็บ (เว้นว่างได้ถ้าใช้รูปอย่างเดียว)"
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-primary)]"
            />
          </label>

          <div className="space-y-1.5">
            <span className="text-sm font-medium">รูปภาพ (ไม่บังคับ)</span>
            {imageUrl ? (
              <div className="overflow-hidden rounded-md border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-32 w-full object-cover" />
              </div>
            ) : null}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex-1 rounded-md border border-border py-2 text-sm hover:bg-surface-muted"
              >
                เลือกจากคลังรูป
              </button>
              {imageUrl ? (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="rounded-md border border-border px-3 py-2 text-sm text-text-muted hover:text-danger"
                >
                  เอาออก
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium">แสดงในหน้าไหน</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { value: "ALL", label: "ทุกหน้า" },
                  { value: "PAGES", label: "เลือกบางหน้า" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTarget(opt.value)}
                  className={cn(
                    "rounded-md border py-2 text-sm",
                    target === opt.value
                      ? "border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)]/5 font-medium text-[color:var(--brand-primary)]"
                      : "border-border text-text-muted hover:bg-surface-muted",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {target === "PAGES" ? (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {pages.map((pg) => (
                  <label
                    key={pg.id}
                    className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-surface-muted"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(pg.id)}
                      onChange={(e) =>
                        setSelected((cur) =>
                          e.target.checked
                            ? [...cur, pg.id]
                            : cur.filter((id) => id !== pg.id),
                        )
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                    {pg.name}
                    {pg.isHome ? (
                      <span className="text-[11px] text-text-subtle">
                        (หน้าแรก)
                      </span>
                    ) : null}
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 items-end gap-3">
            <Input
              name="sortIndex"
              type="number"
              label="ลำดับ (น้อย = อยู่บนสุด)"
              defaultValue={String(popup?.sortIndex ?? 0)}
              min={0}
              max={999}
            />
            <label className="flex items-center gap-2 pb-2.5 text-sm">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={popup?.enabled ?? true}
                className="h-4 w-4 rounded border-border"
              />
              เปิดใช้งาน
            </label>
          </div>

          {state.error ? (
            <p className="text-sm text-danger">{state.error}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "กำลังบันทึก…" : "บันทึก"}
            </Button>
          </div>
        </form>

        <MediaPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={(url) => setImageUrl(url)}
        />
      </div>
    </div>
  );
}
