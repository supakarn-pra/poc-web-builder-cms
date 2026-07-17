"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Home, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createPage,
  deletePage,
  renamePage,
  type PageActionState,
} from "@/server/actions/page";
import { pageLayouts } from "@/lib/pageLayouts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export interface PageRow {
  id: string;
  name: string;
  slug: string;
  isHome: boolean;
  status: string;
  updatedAt: string; // ISO — format ฝั่ง client กัน hydration mismatch
}

export function PagesManager({
  websiteId,
  pages,
}: {
  websiteId: string;
  pages: PageRow[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [renaming, setRenaming] = useState<PageRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface divide-y divide-border">
        {pages.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-muted text-text-muted">
              {p.isHome ? <Home size={16} /> : <FileText size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/builder/${websiteId}/${p.id}`}
                className="font-medium hover:text-[color:var(--brand-primary)]"
              >
                {p.name}
              </Link>
              <p className="text-xs text-text-subtle">
                /{p.isHome ? "" : p.slug}
                {p.isHome ? " (หน้าแรก)" : ""}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                p.status === "PUBLISHED"
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning",
              )}
            >
              {p.status === "PUBLISHED" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="เปลี่ยนชื่อ"
                aria-label={`เปลี่ยนชื่อ ${p.name}`}
                onClick={() => setRenaming(p)}
                className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted"
              >
                <Pencil size={14} />
              </button>
              {!p.isHome ? <DeleteButton page={p} /> : null}
            </div>
          </div>
        ))}
      </div>

      <Button onClick={() => setCreateOpen(true)}>
        <Plus size={16} /> เพิ่มหน้าใหม่
      </Button>

      {createOpen ? (
        <CreatePageModal
          websiteId={websiteId}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}
      {renaming ? (
        <RenameModal page={renaming} onClose={() => setRenaming(null)} />
      ) : null}
    </div>
  );
}

function DeleteButton({ page }: { page: PageRow }) {
  const [state, action, pending] = useActionState<PageActionState, FormData>(
    deletePage,
    {},
  );
  useEffect(() => {
    if (state.error) window.alert(state.error);
  }, [state]);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`ลบหน้า "${page.name}" ใช่ไหม? การลบย้อนกลับไม่ได้`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="pageId" value={page.id} />
      <button
        type="submit"
        disabled={pending}
        title="ลบ"
        aria-label={`ลบ ${page.name}`}
        className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted hover:text-danger disabled:opacity-50"
      >
        <Trash2 size={14} />
      </button>
    </form>
  );
}

function ModalFrame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
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
        className="w-full max-w-lg rounded-lg border border-border bg-surface shadow-[var(--shadow-md)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function CreatePageModal({
  websiteId,
  onClose,
}: {
  websiteId: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<PageActionState, FormData>(
    createPage,
    {},
  );
  const [layout, setLayout] = useState("blank");

  return (
    <ModalFrame title="เพิ่มหน้าใหม่" onClose={onClose}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="websiteId" value={websiteId} />
        <input type="hidden" name="layout" value={layout} />

        <Input
          name="name"
          label="ชื่อหน้า"
          placeholder="เช่น เกี่ยวกับเรา"
          required
          autoFocus
        />

        <div className="space-y-1.5">
          <span className="text-sm font-medium">เลือก Layout เริ่มต้น</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {pageLayouts.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLayout(l.id)}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-left",
                  layout === l.id
                    ? "border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)]/5"
                    : "border-border hover:bg-surface-muted",
                )}
              >
                <span className="block text-sm font-medium">{l.label}</span>
                <span className="text-xs text-text-muted">{l.description}</span>
              </button>
            ))}
          </div>
        </div>

        {state.error ? (
          <p className="text-sm text-danger">{state.error}</p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "กำลังสร้าง…" : "สร้างหน้า"}
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}

function RenameModal({
  page,
  onClose,
}: {
  page: PageRow;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<PageActionState, FormData>(
    renamePage,
    {},
  );

  // ปิด modal เมื่อบันทึกสำเร็จ (state ใหม่ที่ไม่มี error)
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (submitted && !pending && !state.error) onClose();
  }, [submitted, pending, state, onClose]);

  return (
    <ModalFrame title={`เปลี่ยนชื่อ "${page.name}"`} onClose={onClose}>
      <form
        action={action}
        onSubmit={() => setSubmitted(true)}
        className="space-y-4"
      >
        <input type="hidden" name="pageId" value={page.id} />
        <Input
          name="name"
          label="ชื่อหน้าใหม่"
          defaultValue={page.name}
          required
          autoFocus
        />
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
    </ModalFrame>
  );
}
