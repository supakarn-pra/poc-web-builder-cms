"use client";

import { useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Video,
} from "lucide-react";
import { blogExtensions } from "@/lib/blog/extensions";
import { MediaPicker } from "@/components/media/MediaPicker";
import { cn } from "@/lib/cn";

function ToolButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()} // กัน editor เสีย focus
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text",
        active && "bg-[color:var(--brand-primary)]/10 text-[color:var(--brand-primary)]",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
      <ToolButton
        label="หัวข้อใหญ่"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={15} />
      </ToolButton>
      <ToolButton
        label="หัวข้อย่อย"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={15} />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolButton
        label="ตัวหนา"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={15} />
      </ToolButton>
      <ToolButton
        label="ตัวเอียง"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={15} />
      </ToolButton>
      <ToolButton
        label="ลิงก์"
        active={editor.isActive("link")}
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          const url = window.prompt("ใส่ลิงก์ (URL)");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        <LinkIcon size={15} />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolButton
        label="รายการ (จุด)"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={15} />
      </ToolButton>
      <ToolButton
        label="รายการ (ตัวเลข)"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={15} />
      </ToolButton>
      <ToolButton
        label="คำพูด"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={15} />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolButton label="แทรกรูป" onClick={() => setPickerOpen(true)}>
        <ImageIcon size={15} />
      </ToolButton>
      <ToolButton
        label="แทรกวิดีโอ YouTube"
        onClick={() => {
          const url = window.prompt("วางลิงก์ YouTube");
          if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
        }}
      >
        <Video size={15} />
      </ToolButton>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(url) => editor.chain().focus().setImage({ src: url }).run()}
      />
    </div>
  );
}

export function RichTextEditor({
  initialContent,
  onChange,
}: {
  initialContent: string; // Tiptap JSON string
  onChange: (json: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false, // SSR-safe
    extensions: [
      ...blogExtensions(),
      Placeholder.configure({
        placeholder: "เริ่มเขียนเนื้อหาบทความที่นี่…",
      }),
    ],
    content: (() => {
      try {
        return JSON.parse(initialContent);
      } catch {
        return undefined;
      }
    })(),
    onUpdate: ({ editor }) => onChange(JSON.stringify(editor.getJSON())),
    editorProps: {
      attributes: {
        class:
          "rich-text focus:outline-none min-h-[320px] px-4 py-3 max-w-none",
      },
    },
  });

  if (!editor) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
        กำลังเตรียมตัวเขียน…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface focus-within:border-[color:var(--brand-primary)]">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
