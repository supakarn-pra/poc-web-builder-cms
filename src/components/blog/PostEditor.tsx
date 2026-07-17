"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import {
  deletePost,
  savePost,
  type PostActionState,
} from "@/server/actions/post";
import { RichTextEditor } from "./RichTextEditor";
import { MediaPicker } from "@/components/media/MediaPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface PostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  content: string;
  categoryId: string | null;
  tagsCsv: string;
  seoTitle: string | null;
  seoDescription: string | null;
  status: string;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9฀-๿\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function PostEditor({
  post,
  categories,
  siteUrlPrefix,
}: {
  post: PostData;
  categories: Array<{ id: string; name: string }>;
  siteUrlPrefix: string; // เช่น /sites/demo/blog
}) {
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugTouched, setSlugTouched] = useState(post.title !== "บทความใหม่");
  const [content, setContent] = useState(post.content);
  const [cover, setCover] = useState(post.coverImageUrl ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);

  const [state, action, pending] = useActionState<PostActionState, FormData>(
    savePost,
    {},
  );
  const [delState, delAction, delPending] = useActionState<
    PostActionState,
    FormData
  >(deletePost, {});

  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState(post.status);
  const lastIntent = useRef<string>("draft");
  useEffect(() => {
    if (state.saved) {
      if (lastIntent.current === "publish") setStatus("PUBLISHED");
      if (lastIntent.current === "unpublish") setStatus("DRAFT");
    }
  }, [state]);

  function submit(intent: "draft" | "publish" | "unpublish") {
    lastIntent.current = intent;
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem("intent") as HTMLInputElement).value = intent;
    form.requestSubmit();
  }

  const published = status === "PUBLISHED";

  return (
    <form ref={formRef} action={action} className="flex h-screen flex-col">
      <input type="hidden" name="postId" value={post.id} />
      <input type="hidden" name="intent" value="draft" />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="coverImageUrl" value={cover} />

      {/* Topbar */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/posts"
            className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted"
            aria-label="กลับไปรายการบทความ"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-sm font-medium leading-tight">เขียนบทความ</p>
            <p className="text-[11px] text-text-subtle leading-tight">
              {published ? (
                <span className="text-success">เผยแพร่แล้ว</span>
              ) : (
                "ฉบับร่าง"
              )}
              {state.saved ? (
                <span className="ml-2 inline-flex items-center gap-0.5">
                  <Check size={10} className="text-success" /> บันทึกแล้ว
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {published ? (
            <a
              href={`${siteUrlPrefix}/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-text-muted hover:text-text"
            >
              เปิดดูบทความ ↗
            </a>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => submit("draft")}
          >
            {pending ? "กำลังบันทึก…" : "บันทึกร่าง"}
          </Button>
          {published ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => submit("unpublish")}
            >
              ยกเลิกเผยแพร่
            </Button>
          ) : null}
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={pending}
            onClick={() => submit("publish")}
          >
            {published ? "อัปเดตที่เผยแพร่" : "เผยแพร่"}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* เนื้อหา */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-surface-muted p-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <input
              name="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="ชื่อบทความ…"
              className="w-full border-none bg-transparent font-display text-3xl font-semibold outline-none placeholder:text-text-subtle"
            />
            {state.error ? (
              <p className="text-sm text-danger">{state.error}</p>
            ) : null}
            {delState.error ? (
              <p className="text-sm text-danger">{delState.error}</p>
            ) : null}
            <RichTextEditor initialContent={post.content} onChange={setContent} />
          </div>
        </div>

        {/* Sidebar ตั้งค่าบทความ */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-border bg-surface p-4 space-y-5">
          <div className="space-y-1.5">
            <span className="text-sm font-medium">ภาพปก</span>
            {cover ? (
              <div className="overflow-hidden rounded-md border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt="" className="h-32 w-full object-cover" />
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
              {cover ? (
                <button
                  type="button"
                  onClick={() => setCover("")}
                  className="rounded-md border border-border px-3 text-sm text-text-muted hover:text-danger"
                >
                  เอาออก
                </button>
              ) : null}
            </div>
          </div>

          <Input
            name="slug"
            label="URL บทความ"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            hint={`${siteUrlPrefix}/${slug || "…"}`}
          />

          <label className="block space-y-1">
            <span className="text-sm font-medium">คำโปรย</span>
            <textarea
              name="excerpt"
              defaultValue={post.excerpt ?? ""}
              rows={3}
              placeholder="สรุปสั้น ๆ ให้คนอยากอ่านต่อ"
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-primary)]"
            />
          </label>

          <div className="space-y-1.5">
            <span className="text-sm font-medium">หมวดหมู่</span>
            <select
              name="categoryId"
              defaultValue={post.categoryId ?? ""}
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">— ไม่ระบุ —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {newCategoryOpen ? (
              <input
                name="newCategory"
                placeholder="ชื่อหมวดหมู่ใหม่ (บันทึกแล้วสร้างให้)"
                className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setNewCategoryOpen(true)}
                className="text-xs text-[color:var(--brand-primary)] hover:underline"
              >
                + สร้างหมวดหมู่ใหม่
              </button>
            )}
          </div>

          <Input
            name="tagsCsv"
            label="แท็ก"
            defaultValue={post.tagsCsv}
            placeholder="เช่น กาแฟ, รีวิว, howto"
            hint="คั่นด้วยเครื่องหมายจุลภาค (,)"
          />

          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
              SEO
            </p>
            <Input
              name="seoTitle"
              label="SEO Title"
              defaultValue={post.seoTitle ?? ""}
              placeholder={title}
            />
            <label className="block space-y-1">
              <span className="text-sm font-medium">SEO Description</span>
              <textarea
                name="seoDescription"
                defaultValue={post.seoDescription ?? ""}
                rows={2}
                className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={delPending}
            onClick={(e) => {
              if (!window.confirm("ลบบทความนี้ใช่ไหม? การลบย้อนกลับไม่ได้")) return;
              const fd = new FormData();
              fd.set("postId", post.id);
              // ยิง action ลบแยกจาก form หลัก
              delAction(fd);
              e.currentTarget.disabled = true;
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-danger/30 py-2 text-sm text-danger hover:bg-danger/5 disabled:opacity-50"
          >
            <Trash2 size={14} /> ลบบทความ
          </button>
        </aside>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(url) => setCover(url)}
      />
    </form>
  );
}
