/**
 * base path สาธารณะของเว็บหนึ่ง (สำหรับลิงก์ "เปิดเว็บ" และ prefix บทความ)
 *  - เว็บหลักที่ public         → ""            (root /)
 *  - Landing ใต้เว็บหลัก public → "/{slug}"      (sub-path)
 *  - เวอร์ชัน/landing ที่ยังไม่ public → "/preview/{id}"
 * ค่าที่ได้ต่อ "/blog" ฯลฯ ได้เลย; ถ้าจะใช้เป็น href ของหน้าแรกให้ `|| "/"`
 */
export function siteBasePath(
  site: { id: string; subdomain: string; isPublic: boolean; parentId: string | null },
  parentIsPublic: boolean,
): string {
  if (site.isPublic) return "";
  if (site.parentId && parentIsPublic) return `/${site.subdomain}`;
  return `/preview/${site.id}`;
}

export function siteHref(
  site: { id: string; subdomain: string; isPublic: boolean; parentId: string | null },
  parentIsPublic: boolean,
): string {
  return siteBasePath(site, parentIsPublic) || "/";
}
