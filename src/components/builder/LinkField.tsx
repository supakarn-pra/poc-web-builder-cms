"use client";

import {
  pageLinkValue,
  parsePageLink,
  parsePostLink,
  postLinkValue,
} from "@/lib/page/links";

/** ข้อมูลหน้าเท่าที่ตัวเลือกลิงก์ต้องใช้ (ตรงกับ BuilderPageInfo) */
export interface LinkPageOption {
  id: string;
  name: string;
  isHome: boolean;
}

/** บทความที่เผยแพร่แล้ว — ให้เมนู/ปุ่มลิงก์ไปบทความได้ */
export interface LinkPostOption {
  id: string;
  title: string;
}

const CUSTOM_LINK = "__custom__";

/**
 * ตัวเลือกลิงก์ — เลือกหน้าในเว็บ ("page:{id}") บทความ ("post:{id}")
 * หรือพิมพ์ลิงก์เอง ใช้ทั้งแผงตั้งค่าใน builder และหน้าส่วนหัว/ส่วนท้าย
 */
export function LinkField({
  value,
  onChange,
  pages,
  posts = [],
}: {
  value: string;
  onChange: (href: string) => void;
  pages: LinkPageOption[];
  posts?: LinkPostOption[];
}) {
  const pageId = parsePageLink(value);
  const postId = parsePostLink(value);
  const isCustom = pageId === null && postId === null;
  // ปลายทางที่เคยเลือกไว้แต่ถูกลบ/เลิกเผยแพร่ — คงตัวเลือกไว้ให้เห็นว่าลิงก์เสีย
  const missing =
    (pageId !== null && !pages.some((p) => p.id === pageId)) ||
    (postId !== null && !posts.some((p) => p.id === postId));
  return (
    <div className="space-y-1.5">
      <select
        value={isCustom ? CUSTOM_LINK : value}
        onChange={(e) =>
          onChange(e.target.value === CUSTOM_LINK ? "#" : e.target.value)
        }
        aria-label="ลิงก์ไปที่"
        className="block w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
      >
        {pages.length > 0 ? (
          <optgroup label="หน้าในเว็บนี้">
            {pages.map((pg) => (
              <option key={pg.id} value={pageLinkValue(pg.id)}>
                {pg.name}
                {pg.isHome ? " (หน้าแรก)" : ""}
              </option>
            ))}
          </optgroup>
        ) : null}
        {posts.length > 0 ? (
          <optgroup label="บทความ">
            {posts.map((p) => (
              <option key={p.id} value={postLinkValue(p.id)}>
                {p.title}
              </option>
            ))}
          </optgroup>
        ) : null}
        {missing ? (
          <option value={value}>ปลายทางเดิมถูกลบแล้ว — เลือกใหม่</option>
        ) : null}
        <option value={CUSTOM_LINK}>ใส่ลิงก์เอง (เว็บอื่น / ภายนอก)</option>
      </select>
      {isCustom ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ลิงก์ เช่น https://… หรือ #ส่วนในหน้า"
          className="block w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
        />
      ) : null}
    </div>
  );
}
