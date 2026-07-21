"use client";

import { useActionState, useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, GripVertical, ImageIcon, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  deletePopup,
  reorderPopups,
  savePopup,
  setPopupEnabled,
  type PopupActionState,
} from "@/server/actions/popup";
import { PopupDialog } from "@/components/site/PopupDialog";
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
  allowHideToday: boolean;
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
  const [previewing, setPreviewing] = useState<PopupRow | null>(null);

  // ลำดับแบบ optimistic ระหว่างรอ server — ใช้ได้เฉพาะตอน id ตรงกับ props ครบ
  // (สร้าง/ลบแล้ว id เปลี่ยน → ตกกลับไปใช้ลำดับจาก server เอง ไม่ต้องมี effect)
  const [order, setOrder] = useState<string[] | null>(null);
  const propIds = popups.map((p) => p.id);
  const sorted =
    order &&
    order.length === propIds.length &&
    order.every((id) => propIds.includes(id))
      ? order.map((id) => popups.find((p) => p.id === id)!)
      : popups;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((p) => p.id === active.id);
    const newIndex = sorted.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sorted, oldIndex, newIndex).map((p) => p.id);
    setOrder(next);
    const res = await reorderPopups(websiteId, next);
    if (res.error) {
      window.alert(res.error);
      setOrder(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-text-muted">
        Pop-up จะเด้งขึ้นเมื่อคนเปิดหน้าเว็บ — สร้างได้หลายอัน
        ลากจัดลำดับได้เลย (อันบนสุดแสดงก่อน)
      </p>

      {sorted.length > 0 ? (
        <DndContext
          id="popup-list-dnd" // stable id — กัน hydration mismatch
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sorted.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {sorted.map((p) => (
                <SortablePopupRow
                  key={p.id}
                  popup={p}
                  pages={pages}
                  onPreview={() => setPreviewing(p)}
                  onEdit={() => setEditing(p)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
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
      {previewing ? (
        <PopupPreviewModal
          popup={previewing}
          onClose={() => setPreviewing(null)}
        />
      ) : null}
    </div>
  );
}

function SortablePopupRow({
  popup: p,
  pages,
  onPreview,
  onEdit,
}: {
  popup: PopupRow;
  pages: PopupPageOption[];
  onPreview: () => void;
  onEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id });

  const targeted = parsePageIds(p.pageIds);
  const targetLabel =
    p.pageIds === "ALL"
      ? "ทุกหน้า"
      : `${targeted.length} หน้า (${targeted
          .map((id) => pages.find((pg) => pg.id === id)?.name ?? "?")
          .slice(0, 3)
          .join(", ")}${targeted.length > 3 ? ", …" : ""})`;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3",
        isDragging && "opacity-60 shadow-[var(--shadow-md)]",
        !p.enabled && "opacity-70",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="ลากเพื่อจัดลำดับ"
        className="grid h-8 w-6 shrink-0 cursor-grab place-items-center rounded text-text-subtle hover:bg-surface-muted"
      >
        <GripVertical size={15} />
      </button>
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-muted text-text-subtle">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon size={16} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {p.title || p.text || "(รูปภาพอย่างเดียว)"}
        </p>
        <p className="truncate text-xs text-text-subtle">
          แสดงใน: {targetLabel}
          {p.allowHideToday ? "" : " · ไม่มีติ๊กซ่อนวันนี้"}
        </p>
      </div>
      <EnabledSwitch popup={p} />
      <div className="flex items-center gap-1">
        <button
          type="button"
          title="ดูตัวอย่าง"
          aria-label={`ดูตัวอย่าง Pop-up ${p.title ?? ""}`}
          onClick={onPreview}
          className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted"
        >
          <Eye size={14} />
        </button>
        <button
          type="button"
          title="แก้ไข"
          aria-label={`แก้ไข Pop-up ${p.title ?? ""}`}
          onClick={onEdit}
          className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted"
        >
          <Pencil size={14} />
        </button>
        <DeletePopupButton popup={p} />
      </div>
    </li>
  );
}

/** switch เปิด/ปิดในหน้า list — อัปเดตแบบ optimistic แล้วค่อยยิง action */
function EnabledSwitch({ popup }: { popup: PopupRow }) {
  const [enabled, setEnabled] = useState(popup.enabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setBusy(true);
    const res = await setPopupEnabled(popup.id, next);
    setBusy(false);
    if (res.error) {
      window.alert(res.error);
      setEnabled(!next);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`${enabled ? "ปิด" : "เปิด"}ใช้งาน Pop-up ${popup.title ?? ""}`}
      title={enabled ? "เปิดใช้งานอยู่ — คลิกเพื่อปิด" : "ปิดอยู่ — คลิกเพื่อเปิด"}
      disabled={busy}
      onClick={toggle}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60",
        enabled ? "bg-[color:var(--brand-primary)]" : "bg-border-strong",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]",
          enabled ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
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

/** ดูตัวอย่าง — ใช้ PopupDialog ตัวเดียวกับเว็บจริง หน้าตาตรงกันเสมอ */
function PopupPreviewModal({
  popup,
  onClose,
}: {
  popup: PopupRow;
  onClose: () => void;
}) {
  const [hideToday, setHideToday] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/40 p-4"
      onClick={onClose}
    >
      <p className="rounded-full bg-black/50 px-3 py-1 text-xs text-white">
        ตัวอย่างการแสดงผลบนเว็บ — คลิกพื้นหลังหรือปุ่มปิดเพื่อออก
      </p>
      <div onClick={(e) => e.stopPropagation()} className="flex w-full justify-center">
        <PopupDialog
          popup={popup}
          hideToday={hideToday}
          onHideTodayChange={setHideToday}
          onClose={onClose}
        />
      </div>
    </div>
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

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="allowHideToday"
                defaultChecked={popup?.allowHideToday ?? true}
                className="h-4 w-4 rounded border-border"
              />
              มีช่องติ๊ก &quot;ไม่ต้องแสดงอีกในวันนี้&quot; ให้คนดู
            </label>
            <label className="flex items-center gap-2 text-sm">
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
