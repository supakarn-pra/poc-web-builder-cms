"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/media/MediaPicker";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  ArrowDownToLine,
  ArrowUpToLine,
  FoldVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import {
  componentRegistry,
  normalizeButtonProps,
  normalizeStatProps,
  userAddableComponents,
  MAX_BUTTONS,
  type ButtonItem,
  type ContactFormProps,
  type CookieConsentProps,
  type FaqProps,
  type GalleryProps,
  type HeadingProps,
  type ImageProps,
  type ImageSliderProps,
  type NavbarProps,
  type QuoteProps,
  type SiteFooterProps,
  type SpacerProps,
  type StatProps,
  type TextProps,
  type VideoProps,
} from "@/lib/page/components/registry";
import {
  columnLayouts,
  type ColumnInstance,
  type ColumnStyle,
  type ComponentInstance,
  type ComponentType,
  type RowInstance,
  type RowStyle,
} from "@/lib/page/types";
import { LinkField, type LinkPostOption } from "./LinkField";
import type { BuilderPageInfo, Selection } from "./BuilderShell";
import { t } from "@/lib/messages";

interface Props {
  rows: RowInstance[];
  /** หน้าทั้งหมดของเว็บ — ให้ปุ่ม/เมนูเลือกลิงก์ไปหน้าในเว็บได้ */
  pages: BuilderPageInfo[];
  /** บทความที่เผยแพร่ — ให้ปุ่ม/เมนูลิงก์ไปบทความได้ */
  posts: LinkPostOption[];
  selection: Selection;
  selectedRow: RowInstance | null;
  onSelect: (sel: Selection) => void;
  onRowStyle: (rowId: string, patch: Partial<RowStyle>) => void;
  onRowLabel: (rowId: string, label: string) => void;
  onRowLayout: (rowId: string, spans: number[]) => void;
  onColumnStyle: (rowId: string, colId: string, patch: Partial<ColumnStyle>) => void;
  onAddComponent: (rowId: string, colId: string, type: ComponentType) => void;
  onComponentProps: (
    rowId: string,
    colId: string,
    compId: string,
    patch: Record<string, unknown>,
  ) => void;
  onMoveComponent: (rowId: string, colId: string, compId: string, dir: -1 | 1) => void;
  onDeleteComponent: (rowId: string, colId: string, compId: string) => void;
}

export function SettingsPanel(props: Props) {
  const { selection, selectedRow } = props;

  const column =
    selection && selection.kind !== "row" && selectedRow
      ? selectedRow.columns.find((c) => c.id === selection.colId) ?? null
      : null;
  const component =
    selection?.kind === "component" && column
      ? column.components.find((c) => c.id === selection.compId) ?? null
      : null;

  return (
    <aside className="w-80 shrink-0 border-l border-border bg-surface flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">{t.builder.settings}</h2>
        {selection && selectedRow ? (
          <Breadcrumbs
            selection={selection}
            row={selectedRow}
            column={column}
            component={component}
            onSelect={props.onSelect}
          />
        ) : (
          <p className="text-[11px] text-text-subtle">
            คลิกที่แถว คอลัมน์ หรือชิ้นส่วนใน Preview
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {selection?.kind === "component" && component && selectedRow && column ? (
          <ComponentSettings
            {...props}
            row={selectedRow}
            column={column}
            component={component}
          />
        ) : selection?.kind === "column" && column && selectedRow ? (
          <ColumnSettings {...props} row={selectedRow} column={column} />
        ) : selectedRow ? (
          <RowSettings {...props} row={selectedRow} />
        ) : (
          <p className="text-center text-sm text-text-muted pt-6">
            เลือกสิ่งที่ต้องการแก้จาก Preview หรือรายการด้านซ้าย
          </p>
        )}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Breadcrumbs — คลิกระดับบนเพื่อกลับไปตั้งค่าตัวแม่ (แถว / คอลัมน์)
// ---------------------------------------------------------------------------

function Breadcrumbs({
  selection,
  row,
  column,
  component,
  onSelect,
}: {
  selection: NonNullable<Selection>;
  row: RowInstance;
  column: ColumnInstance | null;
  component: ComponentInstance | null;
  onSelect: (sel: Selection) => void;
}) {
  const colIndex = column
    ? row.columns.findIndex((c) => c.id === column.id) + 1
    : 0;

  const crumbs: Array<{ label: string; sel: Selection | null }> = [
    {
      label: `แถว: ${row.label}`,
      sel: selection.kind === "row" ? null : { kind: "row", rowId: row.id },
    },
  ];
  if (column) {
    crumbs.push({
      label: `คอลัมน์ ${colIndex}`,
      sel:
        selection.kind === "column"
          ? null
          : { kind: "column", rowId: row.id, colId: column.id },
    });
  }
  if (component) {
    crumbs.push({
      label: componentRegistry[component.type]?.label ?? component.type,
      sel: null,
    });
  }

  return (
    <nav aria-label="ตำแหน่งที่กำลังแก้ไข" className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px]">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1 min-w-0">
          {i > 0 ? <span className="text-text-subtle">›</span> : null}
          {crumb.sel ? (
            <button
              type="button"
              onClick={() => onSelect(crumb.sel)}
              className="truncate text-[color:var(--brand-primary)] hover:underline"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="truncate font-medium text-text">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Row settings
// ---------------------------------------------------------------------------

function RowSettings({
  row,
  onRowStyle,
  onRowLabel,
  onRowLayout,
}: Props & { row: RowInstance }) {
  const currentSpans = row.columns.map((c) => c.span);
  const currentCount = row.columns.length;

  return (
    <>
      <Group label="แถว">
        <Input
          label="ชื่อแถว (แสดงในรายการซ้าย)"
          value={row.label}
          onChange={(e) => onRowLabel(row.id, e.target.value)}
        />
      </Group>

      <Group label="คอลัมน์">
        <div className="space-y-1.5">
          <span className="text-sm font-medium">จำนวนคอลัมน์</span>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  if (n !== currentCount) onRowLayout(row.id, columnLayouts[n][0]);
                }}
                className={cn(
                  "rounded-md border py-2 text-sm",
                  n === currentCount
                    ? "border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)]/5 font-medium text-[color:var(--brand-primary)]"
                    : "border-border hover:bg-surface-muted",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">สัดส่วน (บน grid 12 ช่อง)</span>
          <div className="grid grid-cols-2 gap-1.5">
            {columnLayouts[currentCount].map((spans) => {
              const active =
                spans.length === currentSpans.length &&
                spans.every((s, i) => s === currentSpans[i]);
              return (
                <button
                  key={spans.join("-")}
                  type="button"
                  onClick={() => onRowLayout(row.id, spans)}
                  title={spans.join(" : ")}
                  className={cn(
                    "rounded-md border p-1.5",
                    active
                      ? "border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)]/5"
                      : "border-border hover:bg-surface-muted",
                  )}
                >
                  <div className="grid h-6 grid-cols-12 gap-0.5">
                    {spans.map((s, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-[2px]",
                          active
                            ? "bg-[color:var(--brand-primary)]"
                            : "bg-text-subtle/50",
                        )}
                        style={{ gridColumn: `span ${s} / span ${s}` }}
                      />
                    ))}
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-center text-[10px]",
                      active
                        ? "font-medium text-[color:var(--brand-primary)]"
                        : "text-text-subtle",
                    )}
                  >
                    {spans.join(" : ")}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-text-subtle">
            บนมือถือคอลัมน์เรียงต่อกันเต็มจอเสมอ
          </p>
        </div>
      </Group>

      <Group label="รูปแบบแถว">
        <SelectField
          label={t.builder.style.contentWidth}
          value={row.style.contentWidth ?? "normal"}
          onChange={(v) =>
            onRowStyle(row.id, { contentWidth: v as RowStyle["contentWidth"] })
          }
          options={[
            { value: "normal", label: "ปกติ" },
            { value: "wide", label: "กว้าง" },
            { value: "full", label: "เต็มจอ" },
          ]}
        />
        <SelectField
          label={t.builder.style.spacing}
          value={row.style.paddingY ?? "md"}
          onChange={(v) =>
            onRowStyle(row.id, { paddingY: v as RowStyle["paddingY"] })
          }
          options={[
            { value: "none", label: "ไม่มี" },
            { value: "sm", label: "น้อย" },
            { value: "md", label: "กลาง" },
            { value: "lg", label: "มาก" },
          ]}
        />
        <ColorField
          label={t.builder.style.background}
          value={row.style.background}
          onChange={(v) => onRowStyle(row.id, { background: v })}
        />
        <SelectField
          label="สีตัวอักษรในแถว"
          value={row.style.textTone ?? "auto"}
          onChange={(v) =>
            onRowStyle(row.id, { textTone: v as RowStyle["textTone"] })
          }
          options={[
            { value: "auto", label: "ปกติ (ตามธีม)" },
            { value: "light", label: "ขาว (สำหรับพื้นหลังเข้ม)" },
          ]}
        />
      </Group>
    </>
  );
}

// ---------------------------------------------------------------------------
// Column settings
// ---------------------------------------------------------------------------

function ColumnSettings({
  row,
  column,
  onColumnStyle,
  onAddComponent,
  onSelect,
}: Props & { row: RowInstance; column: ColumnInstance }) {
  return (
    <>
      <Group label="การจัดวางในคอลัมน์">
        <div className="space-y-1.5">
          <span className="text-sm font-medium">แนวนอน</span>
          <IconChoice
            value={column.style?.align ?? "left"}
            onChange={(v) =>
              onColumnStyle(row.id, column.id, {
                align: v as ColumnStyle["align"],
              })
            }
            options={[
              { value: "left", label: "ชิดซ้าย", Icon: AlignLeft },
              { value: "center", label: "กึ่งกลาง", Icon: AlignCenter },
              { value: "right", label: "ชิดขวา", Icon: AlignRight },
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium">แนวตั้ง</span>
          <IconChoice
            value={column.style?.verticalAlign ?? "top"}
            onChange={(v) =>
              onColumnStyle(row.id, column.id, {
                verticalAlign: v as ColumnStyle["verticalAlign"],
              })
            }
            options={[
              { value: "top", label: "ชิดบน", Icon: ArrowUpToLine },
              { value: "center", label: "กึ่งกลาง", Icon: FoldVertical },
              { value: "bottom", label: "ชิดล่าง", Icon: ArrowDownToLine },
            ]}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!column.style?.card}
            onChange={(e) =>
              onColumnStyle(row.id, column.id, { card: e.target.checked })
            }
            className="h-4 w-4 rounded border-border"
          />
          แสดงเป็นการ์ด (มีกรอบและพื้นหลัง)
        </label>
      </Group>

      <Group label={`ชิ้นส่วนในคอลัมน์ (${column.components.length})`}>
        <ul className="space-y-1">
          {column.components.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() =>
                  onSelect({
                    kind: "component",
                    rowId: row.id,
                    colId: column.id,
                    compId: c.id,
                  })
                }
                className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-surface-muted"
              >
                <span className="flex-1 truncate">
                  {componentRegistry[c.type]?.label ?? c.type}
                </span>
                <span className="text-[10px] text-text-subtle">แก้ไข →</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="space-y-1.5">
          <span className="text-sm font-medium">เพิ่มชิ้นส่วน</span>
          <div className="grid grid-cols-2 gap-1.5">
            {userAddableComponents.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onAddComponent(row.id, column.id, type)}
                className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong px-2 py-2 text-sm text-text-muted hover:bg-surface-muted hover:text-text"
              >
                <Plus size={13} />
                {componentRegistry[type].label}
              </button>
            ))}
          </div>
        </div>
      </Group>
    </>
  );
}

// ---------------------------------------------------------------------------
// Component settings
// ---------------------------------------------------------------------------

function ComponentSettings({
  row,
  column,
  component,
  pages,
  posts,
  onComponentProps,
  onMoveComponent,
  onDeleteComponent,
}: Props & {
  row: RowInstance;
  column: ColumnInstance;
  component: ComponentInstance;
}) {
  const patch = (p: Record<string, unknown>) =>
    onComponentProps(row.id, column.id, component.id, p);
  const idx = column.components.findIndex((c) => c.id === component.id);

  return (
    <>
      <Group label="เนื้อหา">
        <ComponentFields
          component={component}
          patch={patch}
          pages={pages}
          posts={posts}
        />
      </Group>

      <Group label="จัดการ">
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={idx <= 0}
            onClick={() => onMoveComponent(row.id, column.id, component.id, -1)}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border py-2 text-sm hover:bg-surface-muted disabled:opacity-40"
          >
            <ArrowUp size={14} /> ย้ายขึ้น
          </button>
          <button
            type="button"
            disabled={idx >= column.components.length - 1}
            onClick={() => onMoveComponent(row.id, column.id, component.id, 1)}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border py-2 text-sm hover:bg-surface-muted disabled:opacity-40"
          >
            <ArrowDown size={14} /> ย้ายลง
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("ลบชิ้นส่วนนี้ใช่ไหม?"))
                onDeleteComponent(row.id, column.id, component.id);
            }}
            className="flex items-center justify-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-danger hover:bg-danger/5"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </Group>
    </>
  );
}

function ComponentFields({
  component,
  patch,
  pages,
  posts,
}: {
  component: ComponentInstance;
  patch: (p: Record<string, unknown>) => void;
  pages: BuilderPageInfo[];
  posts: LinkPostOption[];
}) {
  switch (component.type) {
    case "heading": {
      const p = component.props as HeadingProps;
      return (
        <>
          <Input
            label="ข้อความหัวข้อ"
            value={p.text}
            onChange={(e) => patch({ text: e.target.value })}
          />
          <SelectField
            label="ขนาด"
            value={String(p.level)}
            onChange={(v) => patch({ level: Number(v) })}
            options={[
              { value: "1", label: "ใหญ่มาก (หัวเรื่องหลัก)" },
              { value: "2", label: "ใหญ่ (หัวข้อทั่วไป)" },
              { value: "3", label: "กลาง (หัวข้อย่อย)" },
            ]}
          />
        </>
      );
    }
    case "text": {
      const p = component.props as TextProps;
      return (
        <>
          <label className="block space-y-1">
            <span className="text-sm font-medium">ข้อความ</span>
            <textarea
              value={p.text}
              onChange={(e) => patch({ text: e.target.value })}
              rows={5}
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-primary)]"
            />
          </label>
          <SelectField
            label="ขนาดตัวอักษร"
            value={p.size ?? "md"}
            onChange={(v) => patch({ size: v })}
            options={[
              { value: "sm", label: "เล็ก" },
              { value: "md", label: "ปกติ" },
              { value: "lg", label: "ใหญ่" },
            ]}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={p.muted !== false}
              onChange={(e) => patch({ muted: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            สีอ่อน (ข้อความรอง)
          </label>
        </>
      );
    }
    case "button": {
      const p = normalizeButtonProps(component.props as Record<string, unknown>);
      const setButtons = (buttons: ButtonItem[]) =>
        patch({ align: p.align ?? "inherit", buttons });
      return (
        <>
          <div className="space-y-1.5">
            <span className="text-sm font-medium">การจัดแนวนอน</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { value: "inherit", label: "ตามคอลัมน์" },
                  { value: "left", label: "ซ้าย" },
                  { value: "center", label: "กลาง" },
                  { value: "right", label: "ขวา" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    patch({ align: opt.value, buttons: p.buttons })
                  }
                  className={cn(
                    "rounded-md border py-1.5 text-[11px]",
                    (p.align ?? "inherit") === opt.value
                      ? "border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)]/5 font-medium text-[color:var(--brand-primary)]"
                      : "border-border text-text-muted hover:bg-surface-muted",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">
              ปุ่ม ({p.buttons.length}/{MAX_BUTTONS})
            </span>
            {p.buttons.map((b, i) => (
              <div
                key={i}
                className="space-y-2 rounded-md border border-border p-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    value={b.label}
                    onChange={(e) => {
                      const buttons = [...p.buttons];
                      buttons[i] = { ...buttons[i], label: e.target.value };
                      setButtons(buttons);
                    }}
                    placeholder="ข้อความบนปุ่ม"
                    className="w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    aria-label={`ลบปุ่มที่ ${i + 1}`}
                    disabled={p.buttons.length <= 1}
                    onClick={() =>
                      setButtons(p.buttons.filter((_, j) => j !== i))
                    }
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-text-muted hover:text-danger disabled:opacity-30"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <LinkField
                  value={b.href}
                  onChange={(href) => {
                    const buttons = [...p.buttons];
                    buttons[i] = { ...buttons[i], href };
                    setButtons(buttons);
                  }}
                  pages={pages}
                  posts={posts}
                />
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { value: "solid", label: "ปุ่มทึบ" },
                      { value: "outline", label: "ปุ่มขอบ" },
                    ] as const
                  ).map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => {
                        const buttons = [...p.buttons];
                        buttons[i] = { ...buttons[i], variant: v.value };
                        setButtons(buttons);
                      }}
                      className={cn(
                        "rounded-md border py-1.5 text-[11px]",
                        (b.variant ?? "solid") === v.value
                          ? "border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)]/5 font-medium text-[color:var(--brand-primary)]"
                          : "border-border text-text-muted hover:bg-surface-muted",
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {p.buttons.length < MAX_BUTTONS ? (
              <button
                type="button"
                onClick={() =>
                  setButtons([
                    ...p.buttons,
                    { label: "ปุ่มใหม่", href: "#", variant: "outline" },
                  ])
                }
                className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border-strong py-1.5 text-sm text-text-muted hover:bg-surface-muted"
              >
                <Plus size={13} /> เพิ่มปุ่ม
              </button>
            ) : null}
          </div>
        </>
      );
    }
    case "imageSlider": {
      const p = component.props as ImageSliderProps;
      return (
        <>
          <SelectField
            label="สัดส่วนภาพ"
            value={p.aspect ?? "banner"}
            onChange={(v) => patch({ aspect: v })}
            options={[
              { value: "banner", label: "แบนเนอร์กว้าง (21:9)" },
              { value: "wide", label: "จอกว้าง (16:9)" },
              { value: "classic", label: "แนวนอน (4:3)" },
            ]}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={p.autoplay !== false}
              onChange={(e) => patch({ autoplay: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            เลื่อนสไลด์เองอัตโนมัติ (ทุก 5 วินาที)
          </label>
          <GalleryImagesField
            images={p.images}
            onChange={(images) => patch({ images })}
          />
        </>
      );
    }
    case "cookieConsent": {
      const p = component.props as CookieConsentProps;
      return (
        <>
          <Input
            label="หัวข้อ"
            value={p.title ?? ""}
            onChange={(e) => patch({ title: e.target.value || undefined })}
          />
          <label className="block space-y-1">
            <span className="text-sm font-medium">ข้อความ</span>
            <textarea
              value={p.text}
              onChange={(e) => patch({ text: e.target.value })}
              rows={3}
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-primary)]"
            />
          </label>
          <Input
            label={'ลิงก์นโยบายคุกกี้ ("อ่านเพิ่มเติม" — เว้นว่างถ้าไม่ใช้)'}
            value={p.policyUrl ?? ""}
            onChange={(e) => patch({ policyUrl: e.target.value || undefined })}
            placeholder="https://…"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <Input
              label="ปุ่มยอมรับ"
              value={p.acceptLabel}
              onChange={(e) => patch({ acceptLabel: e.target.value })}
            />
            <Input
              label="ปุ่มไม่ยอมรับ"
              value={p.declineLabel}
              onChange={(e) => patch({ declineLabel: e.target.value })}
            />
          </div>
          <p className="text-[11px] text-text-subtle">
            แถบจะลอยล่างสุดของจอจนกว่าคนดูจะกดตอบ — คำตอบถูกจำไว้ในเครื่องของคนดู
          </p>
        </>
      );
    }
    case "video": {
      const p = component.props as VideoProps;
      return (
        <Input
          label="ลิงก์วิดีโอ"
          value={p.url ?? ""}
          onChange={(e) => patch({ url: e.target.value || undefined })}
          placeholder="https://youtube.com/watch?v=…"
          hint="รองรับ YouTube และ Vimeo"
        />
      );
    }
    case "gallery": {
      const p = component.props as GalleryProps;
      return (
        <>
          <SelectField
            label="รูปแบบการแสดง"
            value={p.mode ?? "grid"}
            onChange={(v) => patch({ mode: v })}
            options={[
              { value: "grid", label: "ตาราง (Grid)" },
              { value: "slider", label: "สไลด์ (เลื่อนซ้าย-ขวา)" },
            ]}
          />
          {(p.mode ?? "grid") === "grid" ? (
            <SelectField
              label="จำนวนรูปต่อแถว"
              value={String(p.cols ?? 3)}
              onChange={(v) => patch({ cols: Number(v) })}
              options={[
                { value: "2", label: "2 รูป" },
                { value: "3", label: "3 รูป" },
                { value: "4", label: "4 รูป" },
              ]}
            />
          ) : null}
          <GalleryImagesField
            images={p.images}
            onChange={(images) => patch({ images })}
          />
        </>
      );
    }
    case "quote": {
      const p = component.props as QuoteProps;
      return (
        <>
          <label className="block space-y-1">
            <span className="text-sm font-medium">ข้อความรีวิว</span>
            <textarea
              value={p.text}
              onChange={(e) => patch({ text: e.target.value })}
              rows={3}
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-primary)]"
            />
          </label>
          <Input
            label="ชื่อผู้รีวิว"
            value={p.author ?? ""}
            onChange={(e) => patch({ author: e.target.value || undefined })}
          />
          <Input
            label="ตำแหน่ง/บริษัท"
            value={p.role ?? ""}
            onChange={(e) => patch({ role: e.target.value || undefined })}
          />
        </>
      );
    }
    case "stat": {
      const p = normalizeStatProps(component.props as Record<string, unknown>);
      const put = (extra: Partial<StatProps>) => patch({ ...p, ...extra });
      return (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            <label className="block space-y-1">
              <span className="text-sm font-medium">คำนำหน้า</span>
              <input
                value={p.prefix ?? ""}
                onChange={(e) => put({ prefix: e.target.value || undefined })}
                placeholder="฿"
                className="block w-full rounded-md border border-border bg-surface px-2 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">ตัวเลข</span>
              <input
                type="number"
                value={p.value}
                onChange={(e) => put({ value: Number(e.target.value) || 0 })}
                className="block w-full rounded-md border border-border bg-surface px-2 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">หน่วย</span>
              <input
                value={p.suffix ?? ""}
                onChange={(e) => put({ suffix: e.target.value || undefined })}
                placeholder="+ / % / ปี"
                className="block w-full rounded-md border border-border bg-surface px-2 py-2 text-sm"
              />
            </label>
          </div>
          <Input
            label="คำอธิบาย"
            value={p.label}
            onChange={(e) => put({ label: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={p.animate !== false}
              onChange={(e) => put({ animate: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            แอนิเมชั่นนับ 0 → ตัวเลข เมื่อเลื่อนมาเห็น
          </label>
        </>
      );
    }
    case "faq": {
      const p = component.props as FaqProps;
      return (
        <div className="space-y-2">
          <span className="text-sm font-medium">
            คำถาม-คำตอบ ({p.items.length})
          </span>
          {p.items.map((item, i) => (
            <div
              key={i}
              className="space-y-1.5 rounded-md border border-border p-2.5"
            >
              <div className="flex items-center gap-1.5">
                <input
                  value={item.question}
                  onChange={(e) => {
                    const items = [...p.items];
                    items[i] = { ...items[i], question: e.target.value };
                    patch({ items });
                  }}
                  placeholder="คำถาม"
                  className="w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-sm font-medium"
                />
                <button
                  type="button"
                  aria-label={`ลบคำถามที่ ${i + 1}`}
                  onClick={() =>
                    patch({ items: p.items.filter((_, j) => j !== i) })
                  }
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-text-muted hover:text-danger"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <textarea
                value={item.answer}
                onChange={(e) => {
                  const items = [...p.items];
                  items[i] = { ...items[i], answer: e.target.value };
                  patch({ items });
                }}
                placeholder="คำตอบ"
                rows={2}
                className="block w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patch({
                items: [...p.items, { question: "คำถามใหม่?", answer: "" }],
              })
            }
            className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border-strong py-1.5 text-sm text-text-muted hover:bg-surface-muted"
          >
            <Plus size={13} /> เพิ่มคำถาม
          </button>
        </div>
      );
    }
    case "spacer": {
      const p = component.props as SpacerProps;
      return (
        <SelectField
          label="ขนาดระยะเว้น"
          value={p.size ?? "md"}
          onChange={(v) => patch({ size: v })}
          options={[
            { value: "sm", label: "เล็ก" },
            { value: "md", label: "กลาง" },
            { value: "lg", label: "ใหญ่" },
          ]}
        />
      );
    }
    case "divider":
      return (
        <p className="text-sm text-text-muted">
          เส้นคั่นแนวนอน — ไม่มีตัวเลือกเพิ่มเติม
        </p>
      );
    case "contactForm": {
      const p = component.props as ContactFormProps;
      return (
        <>
          <Input
            label="ข้อความบนปุ่มส่ง"
            value={p.buttonLabel}
            onChange={(e) => patch({ buttonLabel: e.target.value })}
          />
          <p className="text-[11px] text-text-subtle">
            แบบฟอร์มจะส่งข้อความได้จริงใน Sprint 5 (ตอนนี้แสดงหน้าตาให้ก่อน)
          </p>
        </>
      );
    }
    case "image": {
      const p = component.props as ImageProps;
      return (
        <>
          <ImagePickerField
            label="รูปภาพ"
            value={p.url}
            onChange={(url) => patch({ url })}
          />
          <Input
            label="คำอธิบายรูป (alt)"
            value={p.alt ?? ""}
            onChange={(e) => patch({ alt: e.target.value })}
          />
          <SelectField
            label="สัดส่วนรูป"
            value={p.aspect ?? "classic"}
            onChange={(v) => patch({ aspect: v })}
            options={[
              { value: "classic", label: "แนวนอน 4:3" },
              { value: "video", label: "จอกว้าง 16:9" },
              { value: "square", label: "จัตุรัส" },
              { value: "auto", label: "ตามรูปจริง" },
            ]}
          />
        </>
      );
    }
    case "navbar": {
      const p = component.props as NavbarProps;
      return (
        <>
          <Input
            label="ชื่อแบรนด์"
            value={p.brandName}
            onChange={(e) => patch({ brandName: e.target.value })}
          />
          <div className="space-y-1.5">
            <span className="text-sm font-medium">เมนู</span>
            {p.links.map((link, i) => (
              <div
                key={i}
                className="space-y-1.5 rounded-md border border-border p-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    value={link.label}
                    onChange={(e) => {
                      const links = [...p.links];
                      links[i] = { ...links[i], label: e.target.value };
                      patch({ links });
                    }}
                    placeholder="ชื่อเมนู"
                    className="w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    aria-label="ลบเมนูนี้"
                    onClick={() =>
                      patch({ links: p.links.filter((_, j) => j !== i) })
                    }
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-text-muted hover:text-danger"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <LinkField
                  value={link.href}
                  onChange={(href) => {
                    const links = [...p.links];
                    links[i] = { ...links[i], href };
                    patch({ links });
                  }}
                  pages={pages}
                  posts={posts}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patch({ links: [...p.links, { label: "เมนูใหม่", href: "#" }] })
              }
              className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border-strong py-1.5 text-sm text-text-muted hover:bg-surface-muted"
            >
              <Plus size={13} /> เพิ่มเมนู
            </button>
          </div>
          <Input
            label="ปุ่มด้านขวา (เว้นว่างถ้าไม่ใช้)"
            value={p.ctaLabel ?? ""}
            onChange={(e) => patch({ ctaLabel: e.target.value || undefined })}
          />
          {p.ctaLabel ? (
            <div className="space-y-1.5">
              <span className="text-sm font-medium">ลิงก์ของปุ่มด้านขวา</span>
              <LinkField
                value={p.ctaHref ?? "#"}
                onChange={(ctaHref) => patch({ ctaHref })}
                pages={pages}
                posts={posts}
              />
            </div>
          ) : null}
        </>
      );
    }
    case "siteFooter": {
      const p = component.props as SiteFooterProps;
      return (
        <>
          <Input
            label="ชื่อแบรนด์"
            value={p.brandName}
            onChange={(e) => patch({ brandName: e.target.value })}
          />
          <label className="block space-y-1">
            <span className="text-sm font-medium">คำอธิบาย</span>
            <textarea
              value={p.description ?? ""}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-primary)]"
            />
          </label>
          <Input
            label="ข้อความลิขสิทธิ์"
            value={p.copyright ?? ""}
            onChange={(e) => patch({ copyright: e.target.value || undefined })}
            placeholder={`© ${p.brandName}`}
          />
          <div className="space-y-1.5">
            <span className="text-sm font-medium">
              เมนูส่วนท้าย ({(p.links ?? []).length})
            </span>
            {(p.links ?? []).map((link, i) => (
              <div
                key={i}
                className="space-y-1.5 rounded-md border border-border p-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    value={link.label}
                    onChange={(e) => {
                      const links = [...(p.links ?? [])];
                      links[i] = { ...links[i], label: e.target.value };
                      patch({ links });
                    }}
                    placeholder="ชื่อเมนู"
                    className="w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    aria-label="ลบเมนูนี้"
                    onClick={() =>
                      patch({ links: (p.links ?? []).filter((_, j) => j !== i) })
                    }
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-text-muted hover:text-danger"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <LinkField
                  value={link.href}
                  onChange={(href) => {
                    const links = [...(p.links ?? [])];
                    links[i] = { ...links[i], href };
                    patch({ links });
                  }}
                  pages={pages}
                  posts={posts}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patch({
                  links: [...(p.links ?? []), { label: "เมนูใหม่", href: "#" }],
                })
              }
              className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border-strong py-1.5 text-sm text-text-muted hover:bg-surface-muted"
            >
              <Plus size={13} /> เพิ่มเมนู
            </button>
          </div>
        </>
      );
    }
    default:
      return (
        <p className="text-sm text-text-muted">
          ยังไม่มีตัวเลือกสำหรับชิ้นส่วนนี้
        </p>
      );
  }
}

// ---------------------------------------------------------------------------
// Media fields — เลือกจากคลังรูป (MediaPicker) หรือวางลิงก์เอง
// ---------------------------------------------------------------------------

function ImagePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (url: string | undefined) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {value ? (
        <div className="overflow-hidden rounded-md border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-28 w-full object-cover" />
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
        {value ? (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="rounded-md border border-border px-3 py-2 text-sm text-text-muted hover:text-danger"
          >
            เอาออก
          </button>
        ) : null}
      </div>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder="หรือวางลิงก์รูปที่นี่"
        className="block w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text-muted"
      />
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(url) => onChange(url)}
      />
    </div>
  );
}

function GalleryImagesField({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">รูปภาพ ({images.length})</span>
      {images.length > 0 ? (
        <div className="grid grid-cols-4 gap-1.5">
          {images.map((url, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label={`ลบรูปที่ ${i + 1}`}
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded bg-black/50 text-white opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border-strong py-1.5 text-sm text-text-muted hover:bg-surface-muted"
      >
        <Plus size={13} /> เพิ่มรูปจากคลัง
      </button>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(url) => onChange([...images, url])}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// primitives
// ---------------------------------------------------------------------------

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
        {label}
      </h3>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value ?? "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded-md border border-border p-0.5"
        />
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="เช่น #ffffff หรือปล่อยว่าง"
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
    </label>
  );
}

function IconChoice({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{
    value: string;
    label: string;
    Icon: React.ComponentType<{ size?: number | string }>;
  }>;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {options.map(({ value: v, label, Icon }) => (
        <button
          key={v}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "grid place-items-center rounded-md border py-2",
            value === v
              ? "border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)]/5 text-[color:var(--brand-primary)]"
              : "border-border text-text-muted hover:bg-surface-muted",
          )}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
