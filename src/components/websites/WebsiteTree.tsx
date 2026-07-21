"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Globe,
  Home,
  LayoutPanelTop,
  PanelBottom,
  Plus,
  Network,
  Trash2,
  X,
} from "lucide-react";
import {
  createLanding,
  deleteWebsite,
  setPublicWebsite,
  type CreateWebsiteState,
  type DeleteWebsiteState,
} from "@/server/actions/website";
import { createPage, type PageActionState } from "@/server/actions/page";
import { pageLayouts } from "@/lib/pageLayouts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export interface TreePage {
  id: string;
  name: string;
  slug: string;
  isHome: boolean;
  status: string;
}
export interface TreeSite {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  isPublic: boolean;
  pages: TreePage[];
  children: TreeSite[];
}

export function WebsiteTree({ sites }: { sites: TreeSite[] }) {
  return (
    <div className="space-y-3">
      {sites.map((site) => (
        <SiteCard key={site.id} site={site} depth={0} defaultOpen={sites.length === 1} />
      ))}
    </div>
  );
}

function SiteCard({
  site,
  depth,
  parentIsPublic = false,
  defaultOpen = false,
}: {
  site: TreeSite;
  depth: number;
  parentIsPublic?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [addPageFor, setAddPageFor] = useState(false);
  const [addSubFor, setAddSubFor] = useState(false);
  const isSub = depth > 0;
  const published = site.status === "PUBLISHED";
  const homeId = site.pages.find((p) => p.isHome)?.id ?? site.pages[0]?.id;
  // เว็บหลัก public → "/", Landing ใต้เว็บ public → "/{slug}", อื่น ๆ → พรีวิว
  const publicUrl = isSub
    ? parentIsPublic
      ? `/${site.subdomain}`
      : `/preview/${site.id}`
    : site.isPublic
      ? "/"
      : `/preview/${site.id}`;
  // ที่อยู่ที่แสดงในการ์ด
  const displayUrl = isSub
    ? `platform.com/${site.subdomain}`
    : site.isPublic
      ? "platform.com"
      : "ยังไม่ใช้งานจริง";

  return (
    <div
      className={cn(
        "rounded-lg border bg-surface",
        isSub ? "border-border" : "border-border-strong",
      )}
    >
      {/* header row — คลิกเพื่อ collapse/expand */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-muted rounded-lg"
        aria-expanded={open}
      >
        <ChevronRight
          size={16}
          className={cn(
            "shrink-0 text-text-subtle transition-transform",
            open && "rotate-90",
          )}
        />
        <span
          className={cn(
            "grid place-items-center rounded-md",
            isSub
              ? "h-8 w-8 bg-[color:var(--brand-secondary)]/10 text-[color:var(--brand-secondary)]"
              : "h-9 w-9 bg-[color:var(--brand-primary)]/10 text-[color:var(--brand-primary)]",
          )}
        >
          {isSub ? <Network size={16} /> : <Globe size={18} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{site.name}</span>
            {!isSub ? (
              <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-text-subtle">
                เวอร์ชัน
              </span>
            ) : null}
            {site.isPublic ? (
              <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                ใช้งานจริง (แสดงที่ /)
              </span>
            ) : null}
          </span>
          <span className="block truncate text-xs text-text-subtle">
            {displayUrl} · {site.pages.length} หน้า
            {site.children.length > 0
              ? ` · ${site.children.length} Landing แยก`
              : ""}
          </span>
        </span>
        <span
          className={
            published
              ? "rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
              : "rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning"
          }
        >
          {published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-border px-4 py-3 pl-6">
          {/* หน้าเว็บ */}
          <section className="space-y-1">
            <SectionLabel>หน้าเว็บ</SectionLabel>
            <ul className="space-y-0.5">
              {site.pages.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/builder/${site.id}/${p.id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-muted"
                  >
                    {p.isHome ? (
                      <Home size={14} className="text-text-subtle" />
                    ) : (
                      <FileText size={14} className="text-text-subtle" />
                    )}
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-[11px] text-text-subtle">
                      /{p.isHome ? "" : p.slug}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setAddPageFor(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[color:var(--brand-primary)] hover:bg-surface-muted"
            >
              <Plus size={14} /> เพิ่มหน้า
            </button>
          </section>

          {/* ส่วนของเว็บไซต์ */}
          <section className="space-y-1">
            <SectionLabel>ส่วนหัว / ส่วนท้าย (ใช้ทุกหน้า)</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/builder/${site.id}/site-header`}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
              >
                <LayoutPanelTop size={14} className="text-text-subtle" />
                ส่วนหัว
              </Link>
              <Link
                href={`/builder/${site.id}/site-footer`}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
              >
                <PanelBottom size={14} className="text-text-subtle" />
                ส่วนท้าย
              </Link>
            </div>
          </section>

          {/* ปุ่มเปิดเว็บ + แก้ + ใช้เวอร์ชันนี้ + ลบ */}
          <div className="flex flex-wrap items-center gap-2">
            {homeId ? (
              <Link href={`/builder/${site.id}/${homeId}`}>
                <Button size="sm" variant="secondary">
                  แก้ไขเว็บไซต์
                </Button>
              </Link>
            ) : null}
            <Link href={publicUrl} target="_blank">
              <Button size="sm" variant="ghost">
                เปิดเว็บไซต์ ↗
              </Button>
            </Link>
            {!isSub && !site.isPublic ? (
              <form action={setPublicWebsite}>
                <input type="hidden" name="websiteId" value={site.id} />
                <Button type="submit" size="sm" variant="ghost">
                  ใช้เวอร์ชันนี้เป็นเว็บจริง
                </Button>
              </form>
            ) : null}
            {!site.isPublic ? <DeleteSiteButton site={site} isSub={isSub} /> : null}
          </div>

          {/* Landing แยก (sub-path) — เฉพาะเว็บหลัก */}
          {!isSub ? (
            <section className="space-y-2 border-t border-border pt-3">
              <SectionLabel>หน้า Landing แยก (platform.com/…)</SectionLabel>
              {site.children.length > 0 ? (
                <div className="space-y-2">
                  {site.children.map((child) => (
                    <SiteCard
                      key={child.id}
                      site={child}
                      depth={1}
                      parentIsPublic={site.isPublic}
                    />
                  ))}
                </div>
              ) : (
                <p className="px-2 text-xs text-text-subtle">
                  ยังไม่มี Landing แยก — เช่น สินค้า AAA อยู่ที่ platform.com/aaa แยกจากหน้าหลัก
                </p>
              )}
              <button
                type="button"
                onClick={() => setAddSubFor(true)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[color:var(--brand-primary)] hover:bg-surface-muted"
              >
                <Plus size={14} /> สร้าง Landing แยก
              </button>
            </section>
          ) : null}
        </div>
      ) : null}

      {addPageFor ? (
        <AddPageModal websiteId={site.id} onClose={() => setAddPageFor(false)} />
      ) : null}
      {addSubFor ? (
        <AddLandingModal
          parentId={site.id}
          onClose={() => setAddSubFor(false)}
        />
      ) : null}
    </div>
  );
}

function DeleteSiteButton({ site, isSub }: { site: TreeSite; isSub: boolean }) {
  const [state, action, pending] = useActionState<DeleteWebsiteState, FormData>(
    deleteWebsite,
    {},
  );
  useEffect(() => {
    if (state.error) window.alert(state.error);
  }, [state]);
  const kind = isSub ? "Landing" : "เวอร์ชัน";
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `ลบ${kind} "${site.name}" ใช่ไหม?\n\nหน้าเว็บ บทความ และรูปภาพทั้งหมดใน${kind}นี้จะถูกลบไปด้วย และย้อนกลับไม่ได้`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="websiteId" value={site.id} />
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        disabled={pending}
        className="text-danger hover:bg-danger/5"
      >
        <Trash2 size={14} /> {pending ? "กำลังลบ…" : `ลบ${kind}นี้`}
      </Button>
    </form>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
      {children}
    </h3>
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

function AddPageModal({
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
        <Input name="name" label="ชื่อหน้า" placeholder="เช่น เกี่ยวกับเรา" required autoFocus />
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
        {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
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

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);
}

function AddLandingModal({
  parentId,
  onClose,
}: {
  parentId: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<CreateWebsiteState, FormData>(
    createLanding,
    {},
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <ModalFrame title="สร้าง Landing แยก" onClose={onClose}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="parentId" value={parentId} />
        <Input
          name="name"
          label="ชื่อ Landing"
          placeholder="เช่น สินค้า AAA"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
          autoFocus
        />
        <div>
          <Input
            name="slug"
            label="ที่อยู่ (sub-path)"
            placeholder="aaa"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            required
          />
          <p className="mt-1 text-xs text-text-subtle">
            Landing นี้จะอยู่ที่{" "}
            <span className="text-[color:var(--brand-primary)]">
              platform.com/{slug || "…"}
            </span>{" "}
            (แยกจากหน้าหลัก แต่อยู่ใต้เว็บเดียวกัน)
          </p>
        </div>
        {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "กำลังสร้าง…" : "สร้าง Landing"}
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}
