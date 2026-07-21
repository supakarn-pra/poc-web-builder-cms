"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  ComponentView,
  RowView,
  columnClasses,
  rowClasses,
  rowInnerClasses,
} from "@/lib/page/render";
import {
  componentRegistry,
  headingClass,
  textClass,
  type HeadingProps,
  type TextProps,
} from "@/lib/page/components/registry";
import { toCssVariables } from "@/lib/globalStyle";
import { InlineTextEditor } from "./InlineTextEditor";
import type {
  ComponentInstance,
  GlobalStyle,
  RowInstance,
  SiteData,
} from "@/lib/page/types";
import type { DeviceMode } from "./DevicePreviewSwitch";
import type { Selection } from "./BuilderShell";

/** เลือก tag/class ให้ตรงกับของจริงตอนแก้ inline (heading ตาม level, text = p) */
function InlineComponentEditor({
  component,
  onCommit,
  onCancel,
}: {
  component: ComponentInstance;
  onCommit: (text: string) => void;
  onCancel: () => void;
}) {
  if (component.type === "heading") {
    const p = component.props as HeadingProps;
    return (
      <InlineTextEditor
        tag={`h${p.level}` as "h1" | "h2" | "h3"}
        className={headingClass[p.level]}
        initial={p.text}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    );
  }
  const p = component.props as TextProps;
  return (
    <InlineTextEditor
      tag="p"
      className={textClass(p)}
      initial={p.text}
      multiline
      onCommit={onCommit}
      onCancel={onCancel}
    />
  );
}

/** ตัวอย่างบทความใน canvas — ของจริงดึงจาก DB ตอน render หน้าเว็บ */
const MOCK_SITE_DATA: SiteData = {
  basePath: "",
  blogBasePath: "#",
  // ใน canvas ลิงก์คลิกไม่ได้อยู่แล้ว — "page:{id}" ที่หาไม่เจอจะ resolve เป็น "#"
  pages: [],
  posts: [
    {
      title: "ตัวอย่างบทความที่ 1",
      slug: "preview-1",
      excerpt: "คำโปรยของบทความจะแสดงตรงนี้ เมื่อเผยแพร่บทความจริง",
      coverImageUrl: null,
      publishedAt: null,
      categoryName: "ตัวอย่าง",
    },
    {
      title: "ตัวอย่างบทความที่ 2",
      slug: "preview-2",
      excerpt: "รายการนี้จะถูกแทนที่ด้วยบทความจริงจากเมนู บทความ",
      coverImageUrl: null,
      publishedAt: null,
      categoryName: null,
    },
    {
      title: "ตัวอย่างบทความที่ 3",
      slug: "preview-3",
      excerpt: null,
      coverImageUrl: null,
      publishedAt: null,
      categoryName: null,
    },
  ],
};

const deviceWidth: Record<DeviceMode, string> = {
  desktop: "w-full",
  tablet: "w-[820px] max-w-full",
  mobile: "w-[390px] max-w-full",
};

interface Props {
  device: DeviceMode;
  rows: RowInstance[];
  selection: Selection;
  onSelect: (sel: Selection) => void;
  /** แก้ props ของ component จากการแก้ข้อความ inline (ดับเบิลคลิก) */
  onInlineEdit?: (
    rowId: string,
    colId: string,
    compId: string,
    patch: Record<string, unknown>,
  ) => void;
  globalStyle: GlobalStyle;
  /** ส่วนหัว/ท้ายเว็บไซต์ — แสดงล็อกไว้ คลิกเพื่อไป editor แยก */
  chrome?: {
    header: RowInstance;
    footer: RowInstance;
    websiteId: string;
  };
}

const INLINE_EDITABLE = new Set(["heading", "text"]);

/** แถวส่วนหัว/ท้ายที่ล็อกไว้ใน canvas — hover เห็นคำอธิบาย คลิกไปแก้ใน editor แยก */
function LockedChromeRow({
  row,
  global,
  href,
  label,
}: {
  row: RowInstance;
  global: GlobalStyle;
  href: string;
  label: string;
}) {
  // ตัว preview เป็น div (row มี <a> ของ navbar ข้างใน) — ปุ่มไป editor เป็น
  // Link overlay ที่วางทับเป็น sibling ไม่ใช่ตัวแม่ กัน <a> ซ้อน <a>
  return (
    <div className="group relative">
      <div className="pointer-events-none">
        <RowView row={row} global={global} />
      </div>
      <Link
        href={href}
        className="absolute inset-0 flex items-center justify-center bg-surface/0 opacity-0 transition-opacity group-hover:bg-surface/60 group-hover:opacity-100"
      >
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium shadow-[var(--shadow-sm)]">
          <Lock size={12} className="text-text-subtle" />
          {label}
        </span>
      </Link>
    </div>
  );
}

/**
 * Canvas — render ด้วยตัวเดียวกับหน้าเว็บจริง (render.tsx) แต่ห่อ wrapper
 * ให้คลิกเลือกได้ 3 ระดับ: แถว → คอลัมน์ → ชิ้นส่วน
 * .@container ทำให้ @3xl: ทำงานตามความกว้าง canvas → device preview ตรงจริง
 */
export function Canvas({
  device,
  rows,
  selection,
  onSelect,
  onInlineEdit,
  globalStyle,
  chrome,
}: Props) {
  // component ที่กำลังแก้ข้อความ inline อยู่ (ดับเบิลคลิก heading/text)
  const [editingId, setEditingId] = useState<string | null>(null);
  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-surface-muted p-6">
      <div
        className={cn(
          "@container mx-auto rounded-lg border border-border bg-surface shadow-[var(--shadow-sm)] transition-[width]",
          deviceWidth[device],
        )}
        style={toCssVariables(globalStyle)}
      >
        {chrome ? (
          <LockedChromeRow
            row={chrome.header}
            global={globalStyle}
            href={`/builder/${chrome.websiteId}/site-header`}
            label="ส่วนหัวของเว็บไซต์ (ใช้ทุกหน้า) — คลิกเพื่อแก้ไข"
          />
        ) : null}
        {/* กฎปิด pointer events ครอบเฉพาะแถวเนื้อหา — ให้คลิก = เลือก component เสมอ
            (ห้าม link/วิดีโอ/ฟอร์มแย่ง event) แต่ไม่โดน Link overlay ของส่วนหัว/ท้าย */}
        <div className="[&_a]:pointer-events-none [&_iframe]:pointer-events-none [&_input]:pointer-events-none [&_textarea]:pointer-events-none [&_form_button]:pointer-events-none">
          {rows.map((row) => {
            if (row.style.hidden) return null;
            const rowSelected =
              selection?.kind === "row" && selection.rowId === row.id;
            return (
              <section
                key={row.id}
                onClick={() => onSelect({ kind: "row", rowId: row.id })}
                className={cn(
                  rowClasses(row),
                  "relative cursor-pointer outline outline-2 -outline-offset-2 outline-transparent hover:outline-[color:var(--brand-primary)]/30",
                  rowSelected && "outline-[color:var(--brand-primary)]",
                )}
                style={{ background: row.style.background }}
              >
                {rowSelected ? <Chip text={row.label} /> : null}
                <div className={rowInnerClasses(row)}>
                  {row.columns.map((col) => {
                    const colSelected =
                      selection?.kind === "column" &&
                      selection.colId === col.id;
                    return (
                      <div
                        key={col.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect({
                            kind: "column",
                            rowId: row.id,
                            colId: col.id,
                          });
                        }}
                        className={cn(
                          columnClasses(col),
                          "relative min-h-10 outline-dashed outline-1 -outline-offset-1 outline-transparent hover:outline-[color:var(--brand-secondary)]/50",
                          colSelected &&
                            "outline-[color:var(--brand-secondary)] outline-2",
                        )}
                      >
                        {colSelected ? (
                          <Chip text="คอลัมน์" tone="secondary" />
                        ) : null}
                        {col.components.length === 0 ? (
                          <div className="flex w-full items-center justify-center rounded-md border border-dashed border-border-strong py-8 text-xs text-text-subtle">
                            คอลัมน์ว่าง — เลือกแล้วกด &quot;เพิ่มชิ้นส่วน&quot;
                          </div>
                        ) : null}
                        {col.components.map((component) => {
                          const compSelected =
                            selection?.kind === "component" &&
                            selection.compId === component.id;
                          const editable =
                            !!onInlineEdit && INLINE_EDITABLE.has(component.type);
                          const isEditing = editingId === component.id;
                          return (
                            <div
                              key={component.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isEditing) return;
                                onSelect({
                                  kind: "component",
                                  rowId: row.id,
                                  colId: col.id,
                                  compId: component.id,
                                });
                              }}
                              onDoubleClick={(e) => {
                                if (!editable) return;
                                e.stopPropagation();
                                setEditingId(component.id);
                              }}
                              title={
                                editable && !isEditing
                                  ? "ดับเบิลคลิกเพื่อแก้ข้อความ"
                                  : undefined
                              }
                              className={cn(
                                "relative w-full outline outline-1 outline-transparent hover:outline-[color:var(--brand-primary)]/40 rounded-sm",
                                compSelected &&
                                  !isEditing &&
                                  "outline-2 outline-[color:var(--brand-primary)]",
                              )}
                            >
                              {compSelected && !isEditing ? (
                                <Chip
                                  text={
                                    componentRegistry[component.type]?.label ??
                                    component.type
                                  }
                                />
                              ) : null}
                              {isEditing ? (
                                <InlineComponentEditor
                                  component={component}
                                  onCommit={(text) => {
                                    onInlineEdit?.(
                                      row.id,
                                      col.id,
                                      component.id,
                                      { text },
                                    );
                                    setEditingId(null);
                                  }}
                                  onCancel={() => setEditingId(null)}
                                />
                              ) : (
                                <ComponentView
                                  component={component}
                                  global={globalStyle}
                                  siteData={MOCK_SITE_DATA}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {rows.length === 0 ? (
            <div className="p-16 text-center text-sm text-text-muted">
              ยังไม่มีแถวในหน้านี้ — กด &quot;เพิ่มแถวใหม่&quot; ด้านซ้าย
            </div>
          ) : null}
        </div>
        {chrome ? (
          <LockedChromeRow
            row={chrome.footer}
            global={globalStyle}
            href={`/builder/${chrome.websiteId}/site-footer`}
            label="ส่วนท้ายเว็บไซต์ (ใช้ทุกหน้า) — คลิกเพื่อแก้ไข"
          />
        ) : null}
      </div>
    </div>
  );
}

function Chip({
  text,
  tone = "primary",
}: {
  text: string;
  tone?: "primary" | "secondary";
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute left-0 top-0 z-10 -translate-y-full rounded-t-md px-2 py-0.5 text-[11px] font-medium text-white",
        tone === "primary"
          ? "bg-[color:var(--brand-primary)]"
          : "bg-[color:var(--brand-secondary)]",
      )}
    >
      {text}
    </span>
  );
}
