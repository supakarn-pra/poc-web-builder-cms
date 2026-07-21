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
import { ExternalLink, GripVertical, Plus, Trash2 } from "lucide-react";
import { saveSiteChrome, type MenuActionState } from "@/server/actions/menu";
import {
  LinkField,
  type LinkPageOption,
  type LinkPostOption,
} from "@/components/builder/LinkField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export interface MenuLink {
  label: string;
  href: string;
}

export interface ChromeValues {
  headerBrand: string;
  ctaLabel: string;
  ctaHref: string;
  mainLinks: MenuLink[];
  footerBrand: string;
  footerDescription: string;
  footerCopyright: string;
  footerLinks: MenuLink[];
}

/** item ใน state มี id ไว้ให้ dnd-kit — id คงที่ตามลำดับสร้าง ไม่ใช่ตำแหน่ง */
interface MenuItem extends MenuLink {
  id: string;
}

function withIds(links: MenuLink[], prefix: string): MenuItem[] {
  return links.map((l, i) => ({ ...l, id: `${prefix}-${i}` }));
}

export function ChromeManager({
  websiteId,
  pages,
  posts,
  initial,
  hasNavbar,
  hasFooter,
}: {
  websiteId: string;
  pages: LinkPageOption[];
  posts: LinkPostOption[];
  initial: ChromeValues;
  hasNavbar: boolean;
  hasFooter: boolean;
}) {
  const [main, setMain] = useState<MenuItem[]>(() =>
    withIds(initial.mainLinks, "m"),
  );
  const [footer, setFooter] = useState<MenuItem[]>(() =>
    withIds(initial.footerLinks, "f"),
  );
  const [ctaLabel, setCtaLabel] = useState(initial.ctaLabel);
  const [ctaHref, setCtaHref] = useState(initial.ctaHref || "#");
  // id ใหม่ต้องไม่ชนของเดิม — เริ่มนับต่อจากจำนวนเริ่มต้น
  const counter = useRef(initial.mainLinks.length + initial.footerLinks.length);
  const nextId = (prefix: string) => `${prefix}-new-${++counter.current}`;

  const [state, action, pending] = useActionState<MenuActionState, FormData>(
    saveSiteChrome,
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
      <input type="hidden" name="ctaHref" value={ctaHref} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── ส่วนหัว ─────────────────────────────────────────────── */}
        <Section
          title="ส่วนหัว (แถบด้านบน)"
          hint="แสดงบนสุดของทุกหน้า"
          editorHref={`/builder/${websiteId}/site-header`}
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
        >
          <Input
            name="headerBrand"
            label="ชื่อแบรนด์"
            defaultValue={initial.headerBrand}
            required
          />

          <MenuListEditor
            dndId="menu-main-dnd"
            label="เมนูหลัก"
            items={main}
            onChange={setMain}
            pages={pages}
            posts={posts}
            nextId={() => nextId("m")}
          />

          <div className="space-y-1.5">
            <Input
              name="ctaLabel"
              label="ปุ่มด้านขวา (เว้นว่างถ้าไม่ใช้)"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="เช่น ติดต่อเรา"
            />
            {ctaLabel.trim() ? (
              <>
                <span className="text-sm font-medium">ลิงก์ของปุ่มด้านขวา</span>
                <LinkField
                  value={ctaHref}
                  onChange={setCtaHref}
                  pages={pages}
                  posts={posts}
                />
              </>
            ) : null}
          </div>
        </Section>

        {/* ── ส่วนท้าย ────────────────────────────────────────────── */}
        <Section
          title="ส่วนท้าย"
          hint="แสดงล่างสุดของทุกหน้า"
          editorHref={`/builder/${websiteId}/site-footer`}
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
        >
          <Input
            name="footerBrand"
            label="ชื่อแบรนด์"
            defaultValue={initial.footerBrand}
            required
          />
          <label className="block space-y-1">
            <span className="text-sm font-medium">คำอธิบายสั้น ๆ</span>
            <textarea
              name="footerDescription"
              defaultValue={initial.footerDescription}
              rows={2}
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-primary)]"
            />
          </label>

          <MenuListEditor
            dndId="menu-footer-dnd"
            label="เมนูส่วนท้าย"
            items={footer}
            onChange={setFooter}
            pages={pages}
            posts={posts}
            nextId={() => nextId("f")}
          />

          <Input
            name="footerCopyright"
            label="ข้อความลิขสิทธิ์ (เว้นว่าง = ใช้ © ชื่อแบรนด์)"
            defaultValue={initial.footerCopyright}
            placeholder={`© ${initial.footerBrand}`}
          />
        </Section>
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.saved ? (
        <p className="text-sm text-success">
          {state.published
            ? "บันทึกและเผยแพร่แล้ว — ส่วนหัว/ส่วนท้ายใหม่ขึ้นเว็บจริงเรียบร้อย"
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

function Section({
  title,
  hint,
  editorHref,
  disabled,
  disabledNote,
  children,
}: {
  title: string;
  hint: string;
  editorHref: string;
  disabled: boolean;
  disabledNote: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-medium">{title}</h2>
          <p className="text-xs text-text-subtle">{hint}</p>
        </div>
        <Link
          href={editorHref}
          className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-text-muted hover:bg-surface-muted"
        >
          <ExternalLink size={12} /> แก้แบบเต็มจอ
        </Link>
      </div>

      {disabled ? (
        <p className="rounded-md border border-dashed border-border-strong p-4 text-sm text-text-muted">
          {disabledNote}
        </p>
      ) : (
        <div className="space-y-4">{children}</div>
      )}
    </section>
  );
}

function MenuListEditor({
  dndId,
  label,
  items,
  onChange,
  pages,
  posts,
  nextId,
}: {
  dndId: string;
  label: string;
  items: MenuItem[];
  onChange: (items: MenuItem[]) => void;
  pages: LinkPageOption[];
  posts: LinkPostOption[];
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
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
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
                posts={posts}
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
        <p className="rounded-md border border-dashed border-border-strong p-3 text-center text-sm text-text-subtle">
          ยังไม่มีเมนู — กด &quot;เพิ่มเมนู&quot; ด้านล่าง
        </p>
      ) : null}
      <button
        type="button"
        onClick={() =>
          onChange([...items, { id: nextId(), label: "เมนูใหม่", href: "#" }])
        }
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border-strong py-2 text-sm text-text-muted hover:bg-surface-muted"
      >
        <Plus size={14} /> เพิ่มเมนู
      </button>
    </div>
  );
}

function SortableMenuItem({
  item,
  pages,
  posts,
  onPatch,
  onDelete,
}: {
  item: MenuItem;
  pages: LinkPageOption[];
  posts: LinkPostOption[];
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
          posts={posts}
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
