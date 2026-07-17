"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MediaItem } from "./MediaPicker";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    // fetch-on-mount — setState เกิดหลัง await ไม่ใช่ sync loop
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function upload(files: FileList) {
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/media", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
        }
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  async function remove(item: MediaItem) {
    if (!window.confirm(`ลบรูป "${item.filename}" ใช่ไหม? รูปที่ใช้อยู่ในหน้าจะหายไปด้วย`))
      return;
    await fetch(`/api/media/${item.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {items ? `${items.length} รูปในคลัง` : "กำลังโหลด…"}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = "";
          }}
        />
        <Button disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Upload size={15} />
          )}
          อัปโหลดรูป
        </Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {items && items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface p-16 text-center text-sm text-text-muted">
          ยังไม่มีรูป — อัปโหลดรูปแรกของคุณ แล้วนำไปใช้ได้ทุกหน้า
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {(items ?? []).map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-lg border border-border bg-surface"
            >
              <div className="aspect-square bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.filename}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center gap-1 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{item.filename}</p>
                  <p className="text-[10px] text-text-subtle">
                    {formatSize(item.size)}
                  </p>
                </div>
                <button
                  type="button"
                  title="คัดลอกลิงก์"
                  aria-label="คัดลอกลิงก์"
                  onClick={() => {
                    navigator.clipboard.writeText(item.url);
                    setCopiedId(item.id);
                    setTimeout(() => setCopiedId(null), 1500);
                  }}
                  className="grid h-7 w-7 place-items-center rounded text-text-muted hover:bg-surface-muted"
                >
                  {copiedId === item.id ? (
                    <Check size={13} className="text-success" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
                <button
                  type="button"
                  title="ลบ"
                  aria-label="ลบ"
                  onClick={() => remove(item)}
                  className="grid h-7 w-7 place-items-center rounded text-text-muted hover:bg-surface-muted hover:text-danger"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
