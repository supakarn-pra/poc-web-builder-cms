"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BuilderTopbar, type SaveStatus } from "./BuilderTopbar";
import { RowList } from "./RowList";
import { Canvas } from "./Canvas";
import { SettingsPanel } from "./SettingsPanel";
import { PanelRail } from "./PanelRail";
import { AddRowModal } from "./AddRowModal";
import { t } from "@/lib/messages";
import type { DeviceMode } from "./DevicePreviewSwitch";
import { componentRegistry } from "@/lib/page/components/registry";
import { getRowPreset, makeBlankRow } from "@/lib/page/presets";
import {
  defaultGlobalStyle,
  pageItemId,
  type ColumnInstance,
  type ComponentInstance,
  type ComponentType,
  type GlobalStyle,
  type RowInstance,
} from "@/lib/page/types";

export interface BuilderPageInfo {
  id: string;
  name: string;
  slug: string;
  isHome: boolean;
}

/** บทความที่เผยแพร่ — ใช้เป็นตัวเลือกลิงก์ (ดู LinkField) */
export interface BuilderPostInfo {
  id: string;
  title: string;
}

export type Selection =
  | { kind: "row"; rowId: string }
  | { kind: "column"; rowId: string; colId: string }
  | { kind: "component"; rowId: string; colId: string; compId: string }
  | null;

interface Props {
  websiteId: string;
  pageId: string;
  pageSlug: string;
  websiteName: string;
  pages: BuilderPageInfo[];
  posts: BuilderPostInfo[];
  initialRows: RowInstance[];
  /** ส่วนหัว/ท้ายของเว็บไซต์ — แสดงแบบล็อกใน canvas, แก้ผ่าน editor แยก */
  chromeHeader: RowInstance;
  chromeFooter: RowInstance;
  globalStyle?: GlobalStyle;
}

const AUTOSAVE_DEBOUNCE_MS = 800;
/** เก็บ undo ได้กี่ก้าว + การแก้ติด ๆ กัน (เช่นพิมพ์รัว) นับรวมเป็นก้าวเดียว */
const HISTORY_LIMIT = 50;
const HISTORY_COALESCE_MS = 800;

function cloneRow(row: RowInstance): RowInstance {
  return {
    ...row,
    id: pageItemId("row"),
    columns: row.columns.map((c) => ({
      ...c,
      id: pageItemId("col"),
      components: c.components.map((comp) => ({
        ...comp,
        id: pageItemId(`c-${comp.type}`),
      })),
    })),
  };
}

/** แถว footer (มี component siteFooter) ควรอยู่ล่างสุดเสมอ — แทรกแถวใหม่ก่อนหน้า */
function insertIndex(rows: RowInstance[]): number {
  const footerIdx = rows.findIndex((r) =>
    r.columns.some((c) => c.components.some((x) => x.type === "siteFooter")),
  );
  return footerIdx >= 0 ? footerIdx : rows.length;
}

export function BuilderShell({
  websiteId,
  pageId,
  pageSlug,
  websiteName,
  pages,
  posts,
  initialRows,
  chromeHeader,
  chromeFooter,
  globalStyle = defaultGlobalStyle,
}: Props) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [rows, setRows] = useState(initialRows);
  const [selection, setSelection] = useState<Selection>(
    initialRows[0] ? { kind: "row", rowId: initialRows[0].id } : null,
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [addOpen, setAddOpen] = useState(false);
  // ซ่อนแผงซ้าย/ขวาได้ — บางจอแผงบีบพรีวิวจนแคบ
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // ---- Auto save (debounced) -------------------------------------------
  const isFirstRender = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRows = useRef(rows);
  useEffect(() => {
    latestRows.current = rows;
  }, [rows]);

  // ---- Undo / Redo ---------------------------------------------------------
  // history อยู่ใน ref (ไม่ re-render ทุกครั้ง) + historyTick ไว้อัปเดตปุ่ม
  const past = useRef<RowInstance[][]>([]);
  const future = useRef<RowInstance[][]>([]);
  const lastCommitAt = useRef(0);
  // สถานะปุ่ม undo/redo (อ่าน ref ตอน render ไม่ได้ — sync เป็น state แทน)
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const syncHistory = useCallback(() => {
    setHistory({
      canUndo: past.current.length > 0,
      canRedo: future.current.length > 0,
    });
  }, []);

  /**
   * ทางเดียวที่ใช้แก้ rows — บันทึก history ก่อนเปลี่ยน
   * ทำนอก setState updater เพื่อเลี่ยง StrictMode double-invoke ยัด history ซ้ำ
   */
  const commitRows = useCallback(
    (updater: (cur: RowInstance[]) => RowInstance[]) => {
      const cur = latestRows.current;
      const next = updater(cur);
      if (next === cur) return;
      const now = Date.now();
      if (now - lastCommitAt.current > HISTORY_COALESCE_MS) {
        past.current.push(cur);
        if (past.current.length > HISTORY_LIMIT) past.current.shift();
      }
      lastCommitAt.current = now;
      future.current = [];
      latestRows.current = next;
      setRows(next);
      syncHistory();
    },
    [syncHistory],
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(latestRows.current);
    if (future.current.length > HISTORY_LIMIT) future.current.shift();
    latestRows.current = prev;
    lastCommitAt.current = 0; // แก้ครั้งถัดไปเริ่มก้าวใหม่เสมอ
    setRows(prev);
    syncHistory();
  }, [syncHistory]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(latestRows.current);
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    latestRows.current = next;
    lastCommitAt.current = 0;
    setRows(next);
    syncHistory();
  }, [syncHistory]);

  // Cmd/Ctrl+Z = ย้อนกลับ, Shift+Cmd/Ctrl+Z หรือ Ctrl+Y = ทำซ้ำ
  // เว้นตอนพิมพ์ใน input/textarea/contentEditable — ให้ browser จัดการ text undo เอง
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      // e.target อาจเป็น Document (ไม่มี .closest) — เช็คเป็น Element ก่อน
      const target = e.target instanceof Element ? e.target : null;
      const inEditable = !!target?.closest(
        'input, textarea, select, [contenteditable="true"]',
      );
      if (inEditable) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const persist = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: latestRows.current }),
      });
      if (!res.ok) throw new Error(`save failed: ${res.status}`);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [pageId]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(persist, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [rows, persist]);

  // ---- Mutations (ทุกตัว merge จาก state ปัจจุบัน — ห้ามใช้ closure) ----

  const mutateRow = useCallback(
    (rowId: string, fn: (row: RowInstance) => RowInstance) => {
      commitRows((cur) => cur.map((r) => (r.id === rowId ? fn(r) : r)));
    },
    [commitRows],
  );

  const mutateColumn = useCallback(
    (rowId: string, colId: string, fn: (col: ColumnInstance) => ColumnInstance) => {
      mutateRow(rowId, (row) => ({
        ...row,
        columns: row.columns.map((c) => (c.id === colId ? fn(c) : c)),
      }));
    },
    [mutateRow],
  );

  /** เปลี่ยนจำนวน/สัดส่วนคอลัมน์ — เก็บ component เดิมไว้ (เกินยุบเข้าคอลัมน์สุดท้าย) */
  const setRowLayout = useCallback(
    (rowId: string, spans: number[]) => {
      mutateRow(rowId, (row) => {
        const columns: ColumnInstance[] = spans.map((span, i) => {
          const existing = row.columns[i];
          return existing
            ? { ...existing, span }
            : { id: pageItemId("col"), span, components: [] };
        });
        // component จากคอลัมน์ที่ถูกตัด → ต่อท้ายคอลัมน์สุดท้าย
        const overflow = row.columns
          .slice(spans.length)
          .flatMap((c) => c.components);
        if (overflow.length > 0) {
          const last = columns[columns.length - 1];
          columns[columns.length - 1] = {
            ...last,
            components: [...last.components, ...overflow],
          };
        }
        return { ...row, columns };
      });
    },
    [mutateRow],
  );

  const addComponent = useCallback(
    (rowId: string, colId: string, type: ComponentType) => {
      const instance: ComponentInstance = {
        id: pageItemId(`c-${type}`),
        type,
        props: componentRegistry[type].defaultProps(),
      };
      mutateColumn(rowId, colId, (col) => ({
        ...col,
        components: [...col.components, instance],
      }));
      setSelection({ kind: "component", rowId, colId, compId: instance.id });
    },
    [mutateColumn],
  );

  const updateComponentProps = useCallback(
    (rowId: string, colId: string, compId: string, patch: Record<string, unknown>) => {
      mutateColumn(rowId, colId, (col) => ({
        ...col,
        components: col.components.map((c) =>
          c.id === compId ? { ...c, props: { ...c.props, ...patch } } : c,
        ),
      }));
    },
    [mutateColumn],
  );

  const moveComponent = useCallback(
    (rowId: string, colId: string, compId: string, dir: -1 | 1) => {
      mutateColumn(rowId, colId, (col) => {
        const idx = col.components.findIndex((c) => c.id === compId);
        const to = idx + dir;
        if (idx < 0 || to < 0 || to >= col.components.length) return col;
        const next = [...col.components];
        [next[idx], next[to]] = [next[to], next[idx]];
        return { ...col, components: next };
      });
    },
    [mutateColumn],
  );

  const deleteComponent = useCallback(
    (rowId: string, colId: string, compId: string) => {
      mutateColumn(rowId, colId, (col) => ({
        ...col,
        components: col.components.filter((c) => c.id !== compId),
      }));
      setSelection({ kind: "column", rowId, colId });
    },
    [mutateColumn],
  );

  const addRow = useCallback((source: { presetId?: string; spans?: number[] }) => {
    const row = source.presetId
      ? getRowPreset(source.presetId)?.build()
      : source.spans
        ? makeBlankRow(source.spans)
        : undefined;
    if (!row) return;
    commitRows((cur) => {
      const idx = insertIndex(cur);
      return [...cur.slice(0, idx), row, ...cur.slice(idx)];
    });
    setSelection({ kind: "row", rowId: row.id });
  }, [commitRows]);

  // -------------------------------------------------------------------------

  const selectedRow = useMemo(
    () => (selection ? rows.find((r) => r.id === selection.rowId) ?? null : null),
    [rows, selection],
  );

  return (
    <div className="flex h-screen flex-col">
      <BuilderTopbar
        websiteId={websiteId}
        pageId={pageId}
        pageSlug={pageSlug}
        websiteName={websiteName}
        pages={pages}
        device={device}
        onDeviceChange={setDevice}
        saveStatus={saveStatus}
        onUndo={undo}
        onRedo={redo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onRestoreVersion={(restored) => {
          commitRows(() => restored);
          setSelection(null);
        }}
      />
      <div className="flex flex-1 min-h-0">
        {!leftOpen ? (
          <PanelRail
            side="left"
            label={t.builder.sections}
            onOpen={() => setLeftOpen(true)}
          />
        ) : (
          <RowList
            rows={rows}
            selection={selection}
            onCollapse={() => setLeftOpen(false)}
            onSelect={(rowId) => setSelection({ kind: "row", rowId })}
            onToggleHide={(id) =>
              mutateRow(id, (r) => ({
                ...r,
                style: { ...r.style, hidden: !r.style.hidden },
              }))
            }
            onDuplicate={(id) => {
              commitRows((cur) => {
                const idx = cur.findIndex((r) => r.id === id);
                if (idx < 0) return cur;
                return [
                  ...cur.slice(0, idx + 1),
                  cloneRow(cur[idx]),
                  ...cur.slice(idx + 1),
                ];
              });
            }}
            onDelete={(id) => {
              if (!window.confirm("ต้องการลบแถวนี้ใช่ไหม?")) return;
              commitRows((cur) => cur.filter((r) => r.id !== id));
              setSelection((sel) => (sel?.rowId === id ? null : sel));
            }}
            onReorder={(next) => commitRows(() => next)}
            onAdd={() => setAddOpen(true)}
          />
        )}
        <Canvas
          device={device}
          rows={rows}
          selection={selection}
          onSelect={setSelection}
          onInlineEdit={updateComponentProps}
          globalStyle={globalStyle}
          chrome={{
            header: chromeHeader,
            footer: chromeFooter,
            websiteId,
          }}
        />
        {!rightOpen ? (
          <PanelRail
            side="right"
            label={t.builder.settings}
            onOpen={() => setRightOpen(true)}
          />
        ) : (
          <SettingsPanel
            rows={rows}
            pages={pages}
            posts={posts}
            selection={selection}
            selectedRow={selectedRow}
            onCollapse={() => setRightOpen(false)}
            onSelect={setSelection}
            onRowStyle={(rowId, patch) =>
              mutateRow(rowId, (r) => ({ ...r, style: { ...r.style, ...patch } }))
            }
            onRowLabel={(rowId, label) =>
              mutateRow(rowId, (r) => ({ ...r, label }))
            }
            onRowLayout={setRowLayout}
            onColumnStyle={(rowId, colId, patch) =>
              mutateColumn(rowId, colId, (c) => ({
                ...c,
                style: { ...c.style, ...patch },
              }))
            }
            onAddComponent={addComponent}
            onComponentProps={updateComponentProps}
            onMoveComponent={moveComponent}
            onDeleteComponent={deleteComponent}
          />
        )}
      </div>

      <AddRowModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addRow}
      />
    </div>
  );
}
