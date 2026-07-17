import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";

/** Extensions ชุดเดียวกันทั้ง editor (client) และ render HTML (server) */
export function blogExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: false, // ใช้ตัว configure เองด้านล่าง
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    }),
    Image.configure({
      HTMLAttributes: { class: "rounded-lg" },
    }),
    Youtube.configure({
      width: 0, // ใช้ CSS คุมผ่าน .rich-text iframe
      height: 0,
      HTMLAttributes: { class: "rich-video" },
    }),
  ];
}
