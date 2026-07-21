import type { SiteData } from "./types";

/**
 * ลิงก์ภายในเว็บเก็บเป็น "page:{pageId}" (อ้าง id ไม่ใช่ slug — เปลี่ยนชื่อ slug
 * แล้วลิงก์ไม่พัง) แล้วค่อย resolve เป็น URL จริงตอน render เพราะเว็บหนึ่ง
 * แสดงได้หลาย base path: root ("/"), landing ใต้ sub-path ("/{slug}"),
 * หรือพรีวิว ("/preview/{id}")
 */

const PAGE_LINK_PREFIX = "page:";

export function pageLinkValue(pageId: string): string {
  return `${PAGE_LINK_PREFIX}${pageId}`;
}

/** คืน pageId ถ้า href เป็นลิงก์ภายใน, null ถ้าเป็นลิงก์ธรรมดา */
export function parsePageLink(href: string): string | null {
  return href.startsWith(PAGE_LINK_PREFIX)
    ? href.slice(PAGE_LINK_PREFIX.length)
    : null;
}

/** แปลง href ที่เก็บไว้ → URL จริง (ลิงก์ภายในที่หาไม่เจอ/ไม่มี siteData → "#") */
export function resolveHref(href: string, siteData?: SiteData): string {
  const pageId = parsePageLink(href);
  if (pageId === null) return href;
  const page = siteData?.pages.find((p) => p.id === pageId);
  if (!page) return "#";
  const base = siteData?.basePath ?? "";
  return page.isHome ? base || "/" : `${base}/${page.slug}`;
}
