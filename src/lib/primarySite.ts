import "server-only";
import { db } from "./db";

/**
 * เว็บที่จะเสิร์ฟที่ root "/" — เวอร์ชันที่ผู้ใช้เลือก public
 * ลำดับ fallback: isPublic → เว็บหลักล่าสุด → เว็บใดก็ได้ล่าสุด → null
 * (POC single-deployment: public site เป็น global ตัวเดียว)
 */
export async function resolvePrimarySite() {
  const chosen = await db.website.findFirst({ where: { isPublic: true } });
  if (chosen) return chosen;
  const mainLatest = await db.website.findFirst({
    where: { parentId: null },
    orderBy: { updatedAt: "desc" },
  });
  if (mainLatest) return mainLatest;
  return db.website.findFirst({ orderBy: { updatedAt: "desc" } });
}
