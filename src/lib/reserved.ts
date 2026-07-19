/**
 * คำที่ห้ามใช้เป็น slug ของ Landing แยก (sub-path `/{slug}`)
 * เพราะชนกับเส้นทางจริงของแอป — Next จะ resolve เส้นทางพวกนี้ก่อน catch-all
 */
export const RESERVED_SLUGS = new Set([
  "admin",
  "administrator",
  "builder",
  "login",
  "register",
  "api",
  "blog",
  "preview",
  "sites",
  "_next",
  "favicon.ico",
]);

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
