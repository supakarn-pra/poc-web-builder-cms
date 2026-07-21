import type { SiteData } from "./types";

/**
 * ลิงก์ภายในเว็บเก็บเป็น "page:{pageId}" (อ้าง id ไม่ใช่ slug — เปลี่ยนชื่อ slug
 * แล้วลิงก์ไม่พัง) แล้วค่อย resolve เป็น URL จริงตอน render เพราะเว็บหนึ่ง
 * แสดงได้หลาย base path: root ("/"), landing ใต้ sub-path ("/{slug}"),
 * หรือพรีวิว ("/preview/{id}")
 */

const PAGE_LINK_PREFIX = "page:";
const POST_LINK_PREFIX = "post:";

export function pageLinkValue(pageId: string): string {
  return `${PAGE_LINK_PREFIX}${pageId}`;
}

/** คืน pageId ถ้า href เป็นลิงก์หน้าในเว็บ, null ถ้าเป็นลิงก์แบบอื่น */
export function parsePageLink(href: string): string | null {
  return href.startsWith(PAGE_LINK_PREFIX)
    ? href.slice(PAGE_LINK_PREFIX.length)
    : null;
}

/** ลิงก์ไปบทความ — เก็บเป็น "post:{postId}" ด้วยเหตุผลเดียวกับหน้า */
export function postLinkValue(postId: string): string {
  return `${POST_LINK_PREFIX}${postId}`;
}

/** คืน postId ถ้า href เป็นลิงก์บทความ, null ถ้าเป็นลิงก์แบบอื่น */
export function parsePostLink(href: string): string | null {
  return href.startsWith(POST_LINK_PREFIX)
    ? href.slice(POST_LINK_PREFIX.length)
    : null;
}

/** แปลง href ที่เก็บไว้ → URL จริง (ลิงก์ภายในที่หาไม่เจอ/ไม่มี siteData → "#") */
export function resolveHref(href: string, siteData?: SiteData): string {
  const pageId = parsePageLink(href);
  if (pageId !== null) {
    const page = siteData?.pages.find((p) => p.id === pageId);
    if (!page) return "#";
    const base = siteData?.basePath ?? "";
    return page.isHome ? base || "/" : `${base}/${page.slug}`;
  }
  const postId = parsePostLink(href);
  if (postId !== null) {
    const post = siteData?.posts.find((p) => p.id === postId);
    if (!post) return "#";
    return `${siteData?.blogBasePath ?? "/blog"}/${post.slug}`;
  }
  return href;
}
