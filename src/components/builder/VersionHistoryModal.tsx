"use client";

import { useCallback, useEffect, useState } from "react";
import { History, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { parseRows } from "@/lib/serialize";
import type { RowInstance } from "@/lib/page/types";

interface VersionItem {
  id: string;
  snapshot: string;
  createdAt: string;
}

interface VersionsPayload {
  published: { snapshot: string; publishedAt: string | null } | null;
  versions: VersionItem[];
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function countRows(snapshot: string) {
  try {
    const rows = JSON.parse(snapshot);
    return Array.isArray(rows) ? rows.length : 0;
  } catch {
    return 0;
  }
}

/**
 * ประวัติเวอร์ชันของหน้า — กู้คืนกลับมาเป็น "ฉบับร่าง"
 * (การกู้คืนผ่านระบบ undo ได้ และยังไม่ขึ้นเว็บจริงจนกด เผยแพร่)
 */
export function VersionHistoryModal({
  open,
  onClose,
  pageId,
  onRestore,
}: {
  open: boolean;
  onClose: () => void;
  pageId: string;
  onRestore: (rows: RowInstance[]) => void;
}) {
  const [data, setData] = useState<VersionsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/pages/${pageId}/versions`);
      if (!res.ok) throw new Error("โหลดประวัติไม่สำเร็จ");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดประวัติไม่สำเร็จ");
    }
  }, [pageId]);

  useEffect(() => {
    if (open) {
      // fetch-on-open — setState หลัง await ไม่ใช่ sync loop
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(null);
      setError(null);
      load();
    }
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function restore(snapshot: string) {
    if (
      !window.confirm(
        "กู้คืนเวอร์ชันนี้มาเป็นฉบับร่างใช่ไหม?\n(ฉบับร่างปัจจุบันจะถูกแทนที่ — กด Ctrl+Z ย้อนได้ และยังไม่ขึ้นเว็บจริงจนกดเผยแพร่)",
      )
    )
      return;
    onRestore(parseRows(snapshot));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-border bg-surface shadow-[var(--shadow-md)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="ประวัติเวอร์ชัน"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-text-muted" />
            <div>
              <h2 className="font-medium">ประวัติเวอร์ชันของหน้านี้</h2>
              <p className="text-[11px] text-text-subtle">
                กู้คืนมาเป็นฉบับร่างก่อน — เว็บจริงเปลี่ยนเมื่อกด &quot;เผยแพร่&quot;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {!data && !error ? (
            <p className="py-8 text-center text-sm text-text-muted">
              กำลังโหลด…
            </p>
          ) : null}

          {data ? (
            <ul className="space-y-2">
              {data.published ? (
                <li className="flex items-center gap-3 rounded-md border border-success/30 bg-success/5 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      เวอร์ชันที่เผยแพร่อยู่ตอนนี้
                    </p>
                    <p className="text-xs text-text-subtle">
                      เผยแพร่ {formatDate(data.published.publishedAt)} ·{" "}
                      {countRows(data.published.snapshot)} แถว
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => restore(data.published!.snapshot)}
                  >
                    <RotateCcw size={13} /> กู้คืน
                  </Button>
                </li>
              ) : (
                <li className="rounded-md border border-dashed border-border-strong px-4 py-3 text-sm text-text-muted">
                  หน้านี้ยังไม่เคยเผยแพร่
                </li>
              )}

              {data.versions.map((v, i) => (
                <li
                  key={v.id}
                  className="flex items-center gap-3 rounded-md border border-border px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      เวอร์ชันก่อนหน้า #{i + 1}
                    </p>
                    <p className="text-xs text-text-subtle">
                      บันทึก {formatDate(v.createdAt)} · {countRows(v.snapshot)}{" "}
                      แถว
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => restore(v.snapshot)}
                  >
                    <RotateCcw size={13} /> กู้คืน
                  </Button>
                </li>
              ))}

              {data.versions.length === 0 && data.published ? (
                <li className="px-1 pt-1 text-xs text-text-subtle">
                  ยังไม่มีเวอร์ชันเก่ากว่านี้ — ระบบจะเก็บให้อัตโนมัติทุกครั้งที่เผยแพร่ทับ
                  (สูงสุด 5 เวอร์ชัน)
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
