"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { saveMenus, type MenuActionState } from "@/server/actions/menu";
import { LinkField, type LinkPageOption } from "@/components/builder/LinkField";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface MenuLink {
  label: string;
  href: string;
}

/** item ใน state มี id ไว้ให้ dnd-kit — id คงที่ตามลำดับสร้าง ไม่ใช่ตำแหน่ง */
interface MenuItem extends MenuLink {
  id: string;
}

function withIds(links: MenuLink[], prefix: string): MenuItem[] {
  return links.map((l, i) => ({ ...l, id: `${prefix}-${i}` }));
}

export function MenuManager({
  websiteId,
  pages,
  initialMain,
  initialFooter,
  hasNavbar,
  hasFooter,
}: {
  websiteId: string;
  pages: LinkPageOption[];
  initialMain: MenuLink[];
  initialFooter: MenuLink[];
  hasNavbar: boolean;
  hasFooter: boolean;
}) {
  const [main, setMain] = useState<MenuItem[]>(() => withIds(initialMain, "m"));
  const [footer, setFooter] = useState<MenuItem[]>(() =>
    withIds(initialFooter, "f"),
  );
  // id ใหม่ต้องไม่ชนของเดิม — เริ่มนับต่อจากจำนวนเริ่มต้น
  const counter = useRef(initialMain.length + initialFooter.length);
  const nextId = (prefix: string) => `${prefix}-new-${++counter.current}`;

  const [state, action, pending] = useActionState<MenuActionState, FormData>(
    saveMenus,
    {},
  );

  const strip = (items: MenuItem[]): MenuLink[] =>
    items.map(({ label, href }) => ({ label, href }));

  return (
    <form action={action} className="max-w-5xl space-y-4">
      <input type="hidden" name="websiteId" value={websiteId} />
      <input type="hidden" name="mainLinks" value={JSON.stringify(strip(main))} />
      <input
        type="hidden"
        name="footerLinks"
        value={JSON.stringify(strip(footer))}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <MenuSection
          dndId="menu-main-dnd"
          title="เมนูหลัก (แถบด้านบน)"
          hint="แสดงในแถบเมนูด้านบนของทุกหน้า"
          items={main}
          onChange={setMain}
          pages={pages}
          disabled={!hasNavbar}
          disabledNote={
            <>
              ส่วนหัวของเว็บนี้ไม่มีแถบเมนู —{" "}
              <Link
                href={`/builder/${websiteId}/site-header`}
                className="text-[color:var(--brand-primary)] hover:underline"
              >
                เพิ่มในตัวแก้ไขส่วนหัว
              </Link>
            </>
          }
          nextId={() => nextId("m")}
        />
        <MenuSection
          dndId="menu-footer-dnd"
          title="เมนูส่วนท้าย"
          hint="แสดงเป็นแถวลิงก์ในส่วนท้ายของทุกหน้า"
          items={footer}
          onChange={setFooter}
          pages={pages}
          disabled={!hasFooter}
          disabledNote={
            <>
              ส่วนท้ายของเว็บนี้ไม่มีชิ้นส่วนส่วนท้าย —{" "}
              <Link
                href={`/builder/${websiteId}/site-footer`}
                className="text-[color:var(--brand-primary)] hover:underline"
              >
                เพิ่มในตัวแก้ไขส่วนท้าย
              </Link>
            </>
          }
          nextId={() => nextId("f")}
        />
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.saved ? (
        <p className="text-sm text-success">
          {state.published
            ? "บันทึกและเผยแพร่แล้ว — เมนูใหม่ขึ้นเว็บจริงเรียบร้อย"
            : "บันทึกแล้ว (ฉบับร่าง) — จะขึ้นเว็บจริงเมื่อกดเผยแพร่"}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending} variant="secondary">
          {pending ? "กำลังบันทึก…" : "บันทึกฉบับร่าง"}
        </Button>
        <Button type="submit" name="publish" value="1" disabled={pending}>
          {pending ? "กำลังบันทึก…" : "บันทึกและเผยแพร่"}
        </Button>
        <p className="text-xs text-text-subtle">
          ฉบับร่างเห็นได้ในตัวอย่าง ส่วนเว็บจริงเปลี่ยนเมื่อเผยแพร่
        </p>
      </div>
    </form>
  );
}

function MenuSection({
  dndId,
  title,
  hint,
  items,
  onChange,
  pages,
  disabled,
  disabledNote,
  nextId,
}: {
  dndId: string;
  title: string;
  hint: string;
  items: MenuItem[];
  onChange: (items: MenuItem[]) => void;
  pages: LinkPageOption[];
  disabled: boolean;
  disabledNote: React.ReactNode;
  nextId: () => string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((x) => x.id === active.id);
    const newIndex = items.findIndex((x) => x.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="font-medium">{title}</h2>
      <p className="mb-3 text-xs text-text-subtle">{hint}</p>

      {disabled ? (
        <p className="rounded-md border border-dashed border-border-strong p-4 text-sm text-text-muted">
          {disabledNote}
        </p>
      ) : (
        <>
          <DndContext
            id={dndId} // stable id — กัน hydration mismatch
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((x) => x.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <SortableMenuItem
                    key={item.id}
                    item={item}
                    pages={pages}
                    onPatch={(patch) => {
                      const next = [...items];
                      next[i] = { ...next[i], ...patch };
                      onChange(next);
                    }}
                    onDelete={() => onChange(items.filter((_, j) => j !== i))}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {items.length === 0 ? (
            <p className="rounded-md border border-dashed border-border-strong p-4 text-center text-sm text-text-subtle">
              ยังไม่มีเมนู — กด &quot;เพิ่มเมนู&quot; ด้านล่าง
            </p>
          ) : null}
          <button
            type="button"
            onClick={() =>
              onChange([
                ...items,
                { id: nextId(), label: "เมนูใหม่", href: "#" },
              ])
            }
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border-strong py-2 text-sm text-text-muted hover:bg-surface-muted"
          >
            <Plus size={14} /> เพิ่มเมนู
          </button>
        </>
      )}
    </section>
  );
}

function SortableMenuItem({
  item,
  pages,
  onPatch,
  onDelete,
}: {
  item: MenuItem;
  pages: LinkPageOption[];
  onPatch: (patch: Partial<MenuLink>) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex gap-2 rounded-md border border-border bg-surface p-2.5",
        isDragging && "opacity-60 shadow-[var(--shadow-md)]",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="ลากเพื่อจัดลำดับ"
        className="mt-1.5 h-6 w-6 shrink-0 cursor-grab place-items-center rounded text-text-subtle hover:bg-surface-muted grid"
      >
        <GripVertical size={14} />
      </button>
      <div className="min-w-0 flex-1 space-y-1.5">
        <input
          value={item.label}
          onChange={(e) => onPatch({ label: e.target.value })}
          placeholder="ชื่อเมนู"
          className="block w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
        />
        <LinkField
          value={item.href}
          onChange={(href) => onPatch({ href })}
          pages={pages}
        />
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`ลบเมนู ${item.label}`}
        className="mt-1.5 grid h-6 w-6 shrink-0 place-items-center rounded text-text-muted hover:text-danger"
      >
        <Trash2 size={13} />
      </button>
    </li>
  );
}
