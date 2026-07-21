"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Canvas } from "./Canvas";
import { SettingsPanel } from "./SettingsPanel";
import { DevicePreviewSwitch, type DeviceMode } from "./DevicePreviewSwitch";
import type { SaveStatus } from "./BuilderTopbar";
import type { BuilderPageInfo, Selection } from "./BuilderShell";
import type {
  ColumnInstance,
  ComponentInstance,
  ComponentType,
  GlobalStyle,
  RowInstance,
} from "@/lib/page/types";
import { componentRegistry } from "@/lib/page/components/registry";
import { pageItemId } from "@/lib/page/types";

const statusDisplay: Record<SaveStatus, string> = {
  saved: "บันทึกแล้ว",
  pending: "มีการแก้ไข…",
  saving: "กำลังบันทึก…",
  error: "บันทึกไม่สำเร็จ",
};

interface Props {
  websiteId: string;
  websiteName: string;
  part: "header" | "footer";
  initialRow: RowInstance;
  backPageId: string | null;
  pages: BuilderPageInfo[];
  globalStyle: GlobalStyle;
}

/**
 * Editor แยกของส่วนหัว/ท้ายเว็บไซต์ — แก้ครั้งเดียวมีผลทุกหน้า
 * โครงเหมือน builder ปกติแต่มีแถวเดียว (เพิ่ม/ลบ/ย้ายแถวไม่ได้)
 */
export function ChromeShell({
  websiteId,
  websiteName,
  part,
  initialRow,
  backPageId,
  pages,
  globalStyle,
}: Props) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [row, setRow] = useState(initialRow);
  const [selection, setSelection] = useState<Selection>({
    kind: "row",
    rowId: initialRow.id,
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const isFirstRender = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRow = useRef(row);
  useEffect(() => {
    latestRow.current = row;
  }, [row]);

  const persist = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/websites/${websiteId}/chrome`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part, row: latestRow.current }),
      });
      if (!res.ok) throw new Error(`save failed: ${res.status}`);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [websiteId, part]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(persist, 800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [row, persist]);

  // ---- mutations (single row) --------------------------------------------

  const mutateRow = useCallback((_: string, fn: (r: RowInstance) => RowInstance) => {
    setRow((cur) => fn(cur));
  }, []);

  const mutateColumn = useCallback(
    (rowId: string, colId: string, fn: (c: ColumnInstance) => ColumnInstance) => {
      mutateRow(rowId, (r) => ({
        ...r,
        columns: r.columns.map((c) => (c.id === colId ? fn(c) : c)),
      }));
    },
    [mutateRow],
  );

  const partLabel = part === "header" ? "ส่วนหัวของเว็บไซต์" : "ส่วนท้ายเว็บไซต์";

  return (
    <div className="flex h-screen flex-col">
      <div className="h-14 flex items-center justify-between border-b border-border bg-surface px-4">
        <div className="flex items-center gap-2">
          <Link
            href={backPageId ? `/builder/${websiteId}/${backPageId}` : "/administrator/dashboard"}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-surface-muted text-text-muted"
            aria-label="กลับไปแก้หน้า"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-sm font-medium leading-tight">{partLabel}</p>
            <p className="text-[11px] text-text-subtle leading-tight">
              {websiteName} · แก้ที่นี่ครั้งเดียว มีผลทุกหน้า
            </p>
          </div>
          <div className="ml-2 flex items-center gap-1 text-xs text-text-muted">
            {saveStatus === "saved" ? (
              <Check size={12} className="text-success" />
            ) : saveStatus === "error" ? (
              <AlertCircle size={12} className="text-danger" />
            ) : (
              <Loader2 size={12} className="animate-spin" />
            )}
            <span>{statusDisplay[saveStatus]}</span>
          </div>
        </div>
        <DevicePreviewSwitch value={device} onChange={setDevice} />
        <div className="w-24" />
      </div>

      <div className="flex flex-1 min-h-0">
        <Canvas
          device={device}
          rows={[row]}
          selection={selection}
          onSelect={setSelection}
          globalStyle={globalStyle}
        />
        <SettingsPanel
          rows={[row]}
          pages={pages}
          selection={selection}
          selectedRow={row}
          onSelect={setSelection}
          onRowStyle={(rowId, patch) =>
            mutateRow(rowId, (r) => ({ ...r, style: { ...r.style, ...patch } }))
          }
          onRowLabel={(rowId, label) => mutateRow(rowId, (r) => ({ ...r, label }))}
          onRowLayout={(rowId, spans) =>
            mutateRow(rowId, (r) => {
              const columns: ColumnInstance[] = spans.map((span, i) => {
                const existing = r.columns[i];
                return existing
                  ? { ...existing, span }
                  : { id: pageItemId("col"), span, components: [] };
              });
              const overflow = r.columns.slice(spans.length).flatMap((c) => c.components);
              if (overflow.length > 0) {
                const last = columns[columns.length - 1];
                columns[columns.length - 1] = {
                  ...last,
                  components: [...last.components, ...overflow],
                };
              }
              return { ...r, columns };
            })
          }
          onColumnStyle={(rowId, colId, patch) =>
            mutateColumn(rowId, colId, (c) => ({
              ...c,
              style: { ...c.style, ...patch },
            }))
          }
          onAddComponent={(rowId, colId, type: ComponentType) => {
            const instance: ComponentInstance = {
              id: pageItemId(`c-${type}`),
              type,
              props: componentRegistry[type].defaultProps(),
            };
            mutateColumn(rowId, colId, (c) => ({
              ...c,
              components: [...c.components, instance],
            }));
            setSelection({ kind: "component", rowId, colId, compId: instance.id });
          }}
          onComponentProps={(rowId, colId, compId, patch) =>
            mutateColumn(rowId, colId, (c) => ({
              ...c,
              components: c.components.map((x) =>
                x.id === compId ? { ...x, props: { ...x.props, ...patch } } : x,
              ),
            }))
          }
          onMoveComponent={(rowId, colId, compId, dir) =>
            mutateColumn(rowId, colId, (c) => {
              const idx = c.components.findIndex((x) => x.id === compId);
              const to = idx + dir;
              if (idx < 0 || to < 0 || to >= c.components.length) return c;
              const next = [...c.components];
              [next[idx], next[to]] = [next[to], next[idx]];
              return { ...c, components: next };
            })
          }
          onDeleteComponent={(rowId, colId, compId) => {
            mutateColumn(rowId, colId, (c) => ({
              ...c,
              components: c.components.filter((x) => x.id !== compId),
            }));
            setSelection({ kind: "column", rowId, colId });
          }}
        />
      </div>
    </div>
  );
}
