"use client";

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
import {
  GripVertical,
  Eye,
  EyeOff,
  Copy,
  PanelLeftClose,
  Trash2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { RowInstance } from "@/lib/page/types";
import type { Selection } from "./BuilderShell";
import { t } from "@/lib/messages";

interface Props {
  rows: RowInstance[];
  selection: Selection;
  onSelect: (rowId: string) => void;
  onToggleHide: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (rows: RowInstance[]) => void;
  onAdd: () => void;
  /** ซ่อนแผงนี้ (แสดงเป็นแถบแคบแทน) — ให้พรีวิวกว้างขึ้น */
  onCollapse?: () => void;
}

export function RowList({
  rows,
  selection,
  onSelect,
  onToggleHide,
  onDuplicate,
  onDelete,
  onReorder,
  onAdd,
  onCollapse,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(rows, oldIndex, newIndex));
  }

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-surface flex flex-col">
      <div className="flex items-start justify-between px-4 py-3 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold">{t.builder.sections}</h2>
          <p className="text-[11px] text-text-subtle">
            ลากเพื่อจัดลำดับ · คลิกเพื่อแก้ไข
          </p>
        </div>
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            title={`ซ่อน${t.builder.sections}`}
            aria-label={`ซ่อน${t.builder.sections}`}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-text-subtle hover:bg-surface-muted hover:text-text"
          >
            <PanelLeftClose size={15} />
          </button>
        ) : null}
      </div>

      <DndContext
        id="row-list-dnd" // stable id — กัน hydration mismatch
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rows.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex-1 overflow-y-auto p-2 space-y-1">
            {rows.map((row) => (
              <SortableRow
                key={row.id}
                row={row}
                isSelected={selection?.rowId === row.id}
                onSelect={onSelect}
                onToggleHide={onToggleHide}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="p-3 border-t border-border">
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong px-3 py-2 text-sm text-text-muted hover:bg-surface-muted hover:text-text"
        >
          <Plus size={14} />
          เพิ่มแถวใหม่
        </button>
      </div>
    </aside>
  );
}

function SortableRow({
  row,
  isSelected,
  onSelect,
  onToggleHide,
  onDuplicate,
  onDelete,
}: {
  row: RowInstance;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleHide: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const hidden = !!row.style.hidden;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "z-10 relative")}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(row.id)}
        onKeyDown={(e) => e.key === "Enter" && onSelect(row.id)}
        className={cn(
          "group flex items-center gap-2 rounded-md border border-transparent px-2 py-2 text-sm hover:bg-surface-muted",
          isSelected &&
            "border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)]/5",
          hidden && "opacity-50",
          isDragging && "shadow-[var(--shadow-md)] bg-surface",
        )}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="ลากเพื่อจัดลำดับ"
          className="cursor-grab touch-none text-text-subtle hover:text-text active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate">{row.label}</p>
          <p className="text-[10px] text-text-subtle">
            {row.columns.length} คอลัมน์ ·{" "}
            {row.columns.reduce((n, c) => n + c.components.length, 0)} ชิ้นส่วน
          </p>
        </div>

        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton
            label={hidden ? t.action.show : t.action.hide}
            onClick={(e) => {
              e.stopPropagation();
              onToggleHide(row.id);
            }}
          >
            {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </IconButton>
          <IconButton
            label={t.action.duplicate}
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(row.id);
            }}
          >
            <Copy size={14} />
          </IconButton>
          <IconButton
            label={t.action.delete}
            tone="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row.id);
            }}
          >
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>
    </li>
  );
}

function IconButton({
  children,
  label,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid h-7 w-7 place-items-center rounded text-text-muted hover:bg-surface-hover",
        tone === "danger" && "hover:text-danger",
      )}
    >
      {children}
    </button>
  );
}
