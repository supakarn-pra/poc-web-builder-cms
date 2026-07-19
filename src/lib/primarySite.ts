import "server-only";
import { db } from "./db";

/**
 * เว็บที่จะเสิร์ฟที่ root "/" — เฉพาะเวอร์ชันที่ผู้ใช้ "ตั้งเป็นเว็บสาธารณะ" เท่านั้น
 * (การตั้งเป็นสาธารณะจะสร้าง snapshot เผยแพร่ให้อัตโนมัติ)
 * ยังไม่เลือก → null → หน้า DefaultLanding
 */
export async function resolvePrimarySite() {
  return db.website.findFirst({ where: { isPublic: true } });
}
