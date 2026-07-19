#!/usr/bin/env node
/**
 * ตั้งเครื่องสำหรับลองเล่น demo ในเครื่อง — รันซ้ำได้ ไม่พังของเดิม
 *   1) สร้าง .env จาก .env.example (ถ้ายังไม่มี) + สุ่ม AUTH_SECRET ให้
 *   2) สร้างฐานข้อมูล SQLite + ตาราง (prisma migrate deploy)
 *   3) ใส่ข้อมูลตัวอย่าง (admin + เว็บ demo) — ข้ามถ้ามีอยู่แล้ว
 *
 * ใช้: npm run demo:init   แล้วต่อด้วย   npm run dev
 */
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const step = (msg) => console.log(`\n\x1b[36m▸ ${msg}\x1b[0m`);
const ok = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const run = (cmd) => execSync(cmd, { stdio: "inherit" });

// ── 1) .env ────────────────────────────────────────────────────────────────
step("ตรวจไฟล์ .env");
if (existsSync(".env")) {
  ok(".env มีอยู่แล้ว — ใช้ของเดิม");
} else {
  copyFileSync(".env.example", ".env");
  const secret = randomBytes(32).toString("base64");
  const env = readFileSync(".env", "utf8").replace(
    /AUTH_SECRET=.*/,
    `AUTH_SECRET="${secret}"`,
  );
  writeFileSync(".env", env);
  ok("สร้าง .env + สุ่ม AUTH_SECRET ให้แล้ว");
}

// ── 2) ฐานข้อมูล ───────────────────────────────────────────────────────────
step("สร้างฐานข้อมูล (SQLite)");
run("npx prisma migrate deploy");
ok("ตารางพร้อมใช้งาน");

// ── 3) ข้อมูลตัวอย่าง ─────────────────────────────────────────────────────
step("ใส่ข้อมูลตัวอย่าง");
run("npx prisma db seed");

// ── สรุป ───────────────────────────────────────────────────────────────────
console.log(`
\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m
 พร้อมแล้ว! ขั้นต่อไป:

   npm run dev

 แล้วเปิด
   • เว็บไซต์จริง       http://localhost:3000/
   • ระบบจัดการ (CMS)  http://localhost:3000/administrator

 บัญชีทดลอง
   อีเมล     admin@example.com
   รหัสผ่าน  admin1234
\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m
`);
