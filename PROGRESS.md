# สรุปความคืบหน้า — POC No-Code Web Builder

_อัปเดต 2026-07-21 · ระหว่าง Sprint 7_

## เป้าหมาย MVP

ผู้ใช้ที่ไม่เคยสร้างเว็บไซต์ สร้างและเผยแพร่เว็บแรกได้ใน 15–30 นาที โดยไม่ต้องเขียนโค้ด
โฟกัส 2 กลุ่ม: **เจ้าของเว็บ/Content Editor** และ **Admin** · UI ภาษาไทยทั้งหมด

---

## ✅ แก้แล้ว: Landing แยกเป็น sub-path (ไม่ใช่ subdomain)

เดิมทำ "โดเมนย่อย" ผิดเป็น `AAA.platform.com` (`/sites/AAA`) — แก้เป็น **sub-path** แล้ว:

- ✅ สินค้า AAA อยู่ที่ **`platform.com/AAA`** (landing แยกใต้เว็บหลักเดียวกัน)
- root catch-all เช็ค segment แรก: ถ้าตรง slug ของ Landing แยกใต้เว็บสาธารณะ → render ตัวนั้น (รวม `/AAA/blog/...`), ไม่งั้นถือเป็นหน้าของเว็บหลัก
- ยกเลิก `/sites/[subdomain]` · เพิ่ม `/preview/[websiteId]` (auth) สำหรับดูเวอร์ชันที่ยังไม่เผยแพร่
- มี reserved slugs กันชนเส้นทางจริง (admin, blog, api, preview ฯลฯ)

---

## Tech Stack

| ด้าน | เลือกใช้ |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (design token ผ่าน CSS variable) |
| Database | Prisma 7 + SQLite (`better-sqlite3` adapter) — สลับ Postgres ได้ |
| Auth | Custom: jose JWT (httpOnly cookie) + bcryptjs + `proxy.ts` guard |
| Editor บทความ | Tiptap |
| Builder | dnd-kit (ลากเรียง), zod (validate), lucide-react (ไอคอน) |
| Runtime | Node 22 (native module `better-sqlite3` — ปักหมุดด้วย `.nvmrc`/`engines`) |

---

## โครง Routing ปัจจุบัน

```
/                       เว็บไซต์จริง (เวอร์ชันที่ตั้ง "สาธารณะ")
/[slug]  /blog/[slug]   หน้าอื่น / บทความ ของเว็บสาธารณะ
/{landingSlug}/...      Landing แยก (sub-path) ใต้เว็บสาธารณะ เช่น /aaa
/administrator/*                CMS: dashboard · websites · pages · posts · media · menu · settings
/builder/[siteId]/[pageId]   ตัวสร้างหน้า (เต็มจอ) + site-header / site-footer editor
/preview/[websiteId]/*  ดูตัวอย่างเวอร์ชันที่ยังไม่เผยแพร่ (ต้องล็อกอิน)
/administrator/login · /administrator/register       auth
/api/*                  media (upload/list/delete) · pages/[id] (autosave) · websites/[id]/chrome
```

---

## ทำเสร็จแล้ว

### รากฐาน + บัญชีผู้ใช้
- [x] Scaffold, design token, ข้อความรวมศูนย์ (`t.*`), admin shell (7 เมนู) + sidebar/topbar
- [x] สมัคร / เข้าสู่ระบบ / ออกจากระบบ — session JWT + `proxy.ts` กัน `/administrator`, `/builder`, `/preview`
- [x] Prisma + SQLite + seed (`admin@example.com` / `admin1234` + เว็บตัวอย่าง)

### สร้าง & จัดการเว็บไซต์
- [x] Wizard สร้างเว็บ 3 ประเภท (Landing / บริษัท / Blog) → สร้างหน้า+โครงอัตโนมัติ
- [x] Dashboard ดึงข้อมูลจริง (สถานะ, จำนวนหน้า/บทความ/รูป, แก้ไขล่าสุด)
- [x] หน้า **เว็บไซต์** แบบ tree collapse — กางเห็นหน้า, ส่วนหัว/ท้าย, เว็บลูก, เพิ่มได้
- [x] เลือก **เวอร์ชันสาธารณะ** (`isPublic`) — ทำหลายเว็บได้ แล้วเลือกอันที่แสดงที่ `/`
- [x] จัดการหน้า: สร้าง (เลือก layout) / เปลี่ยนชื่อ / ลบ (กันลบหน้าแรก)

### ตัวสร้างหน้า (Builder)
- [x] โมเดล **Row → Column → Component** บน grid 12 ช่อง
- [x] เลือกได้ 3 ระดับ (แถว/คอลัมน์/ชิ้นส่วน) + **breadcrumbs** คลิกไปตัวแม่
- [x] ลากเรียงแถว (dnd-kit) · เพิ่ม/ลบ/ซ่อน/ทำสำเนา · auto-save (debounce)
- [x] ปรับ layout คอลัมน์ 1–4 + สัดส่วน · จัดวาง · โหมดการ์ด · พื้นหลัง/ระยะห่าง
- [x] **ส่วนหัว/ส่วนท้ายระดับเว็บไซต์** — แก้ครั้งเดียวมีผลทุกหน้า (editor แยก, ล็อกใน canvas)
- [x] Global Style: สี, ฟอนต์, ปุ่ม, ความโค้ง → apply ทุกหน้า
- [x] Preview 3 ขนาด (desktop/tablet/mobile) ด้วย container query — ตรงกับจอจริง

### ชิ้นส่วน (Components) — 13 ตัวที่ผู้ใช้เพิ่มได้ + navbar/footer
หัวข้อ · ข้อความ · **ปุ่ม (สูงสุด 3 ปุ่ม, จัดแนว, ทึบ/ขอบ)** · รูปภาพ · วิดีโอ (YouTube/Vimeo) ·
**แกลเลอรี่ (ตาราง + สไลด์)** · รีวิว · **ตัวเลขสถิติ (นับ 0→ค่า)** · FAQ (accordion) ·
เส้นคั่น · ระยะเว้น · แบบฟอร์มติดต่อ · รายการบทความ (blogList)

### Row Presets (แบบสำเร็จรูปตอนเพิ่มแถว)
Hero · จุดเด่น · รูป+ข้อความ · ข้อความ · CTA · ติดต่อเรา · แกลเลอรี่ · รีวิว · สถิติ · FAQ · รายการบทความ

### Blog CMS + Media
- [x] Editor แบบ Notion (Tiptap): หัวข้อ, ตัวหนา/เอียง, ลิสต์, quote, ลิงก์, รูป, วิดีโอ
- [x] บทความ: คำโปรย, ภาพปก, หมวดหมู่, แท็ก, SEO, ร่าง/เผยแพร่, URL อัตโนมัติ
- [x] Media Library: อัปโหลด/ลบ/คัดลอกลิงก์ + MediaPicker ผูกกับ image/gallery/ภาพปก
- [x] หน้าเว็บจริง: บทความ (`/blog/[slug]`) + blogList ดึงบทความที่เผยแพร่

### Publish จริง (Sprint 5)
- [x] **Draft/Publish แยกขาดกัน**: builder แก้ฉบับร่าง (auto-save) — เว็บจริงไม่เปลี่ยนจนกด **เผยแพร่** (copy snapshot ทุกหน้า + ส่วนหัว/ท้าย)
- [x] ปุ่ม **ดูตัวอย่าง** ใน builder → `/preview/[websiteId]` (เห็นฉบับร่าง + banner, ต้องล็อกอิน)
- [x] เก็บเวอร์ชันก่อนเผยแพร่ใน `PageVersion` (สูงสุด 5/หน้า — UI กู้คืนมาใน Sprint 6)
- [x] "ตั้งเป็นเว็บสาธารณะ" = เผยแพร่ snapshot ให้อัตโนมัติ · Landing แยกต้องกดเผยแพร่ก่อนถึงขึ้น `/{slug}`
- [x] **Contact Form ส่งจริง** → เก็บใน DB + แสดงในภาพรวม (มี honeypot กันบอท)
- [x] **Custom domain**: บันทึกโดเมน + คำแนะนำชี้ DNS ในหน้าตั้งค่า
- [x] เมนู CMS อิง**เว็บหลัก**เสมอ (landing ไม่แย่ง context)

### Routes (ปรับใหม่)
- [x] CMS ย้ายไป **`/administrator`** · auth อยู่ที่ `/administrator/login`, `/administrator/register`

### เริ่มเล่น / Deploy
- [x] `output: standalone` + Dockerfile (multi-stage, SQLite volume) + `.dockerignore`
- [x] DEPLOY.md — Docker/VPS (ใช้ได้เลย) และ Vercel (สลับ Postgres)
- [x] **README quickstart 3 ขั้น** + `npm run demo:init` (สร้าง .env + สุ่ม AUTH_SECRET + migrate + seed — รันซ้ำได้)

---

### กันพลาด (Sprint 6 — branch `feature/undo-redo-versions`)
- [x] **Undo/Redo** ใน builder: history 50 ก้าว, การพิมพ์รัวรวมเป็นก้าวเดียว, Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y + ปุ่มบน topbar (ไม่แย่ง undo ของช่องพิมพ์)
- [x] **กู้เวอร์ชัน**: ปุ่มประวัติ (นาฬิกา) → เห็นเวอร์ชันที่เผยแพร่ + เวอร์ชันเก่าสูงสุด 5 → กู้คืนมาเป็นฉบับร่าง (undo ได้, ขึ้นเว็บจริงเมื่อกดเผยแพร่)
- [x] **แก้ข้อความ inline**: ดับเบิลคลิกหัวข้อ/ข้อความใน canvas แก้ตรงนั้น — Enter บันทึก (หัวข้อ), Esc ยกเลิก, สไตล์เดียวกับของจริง

### ลิงก์ภายใน + แก้ chrome (ต่อท้าย Sprint 6)
- [x] **ปุ่ม/เมนูเลือกหน้าในเว็บได้** — เก็บเป็น `page:{id}` แล้ว resolve ตาม base path ตอน render (root / sub-path landing / preview) · ดู `lib/page/links.ts`
- [x] แก้บั๊ก: overlay "คลิกเพื่อแก้ไข" ของส่วนหัว/ท้ายใน canvas คลิกไม่ได้ (โดน pointer-events guard)

### Sprint 7 (branch `feature/sprint-7`)
- [x] **เวอร์ชันเว็บไซต์**: เปลี่ยนมุมมองหน้า `/administrator/websites` เป็น "เวอร์ชัน" (เว็บหนึ่งมีหลายเวอร์ชัน เลือกใช้งานจริงทีละอัน) + **ลบเวอร์ชัน/Landing ได้** (กันลบตัวที่ใช้งานจริง, cascade ทั้งหน้า/บทความ/รูป)
- [x] **Pop-up** (`/administrator/popups` + model `Popup`): ข้อความ/รูป (MediaPicker), เลือกแสดงทุกหน้า/บางหน้า, ลำดับซ้อน (sortIndex), เปิด/ปิดใช้งาน · ฝั่งเว็บ: ซ้อนเหลื่อมตามลำดับ ปิดทีละอัน + ติ๊ก "ไม่ต้องแสดงอีกในวันนี้" (localStorage รายวัน)
- [x] **เมนู/ปุ่มของส่วนหัว-ส่วนท้าย แก้ใน builder**: navbar ได้ `ctaHref` (ปุ่มด้านขวาเลือกลิงก์ได้), siteFooter ได้ prop `links` (เมนูส่วนท้าย) — ตั้งค่าทั้งหมดอยู่ในแผงตั้งค่าของ editor ส่วนหัว/ส่วนท้าย (หน้า `/administrator/menu` ถูกลบออก — ผู้ใช้เห็นว่าซ้ำซ้อน/สับสน แก้ที่ builder ที่เดียวพอ)
- [x] **ลิงก์ไปบทความ**: ตัวเลือกลิงก์ (ปุ่ม/เมนู/ปุ่มด้านขวา) มีกลุ่ม "บทความ" — เก็บเป็น `post:{id}` resolve เป็น `{base}/blog/{slug}` ตอน render · Layout เริ่มต้นใหม่ **"หน้ารวมบทความ"** (preset `blog-list`) ตอนสร้างหน้า
- [x] **ปรับปรุงหน้า Pop-up**: ปุ่มดูตัวอย่าง (ใช้ `PopupDialog` ตัวเดียวกับเว็บจริง) · ตั้งค่าเปิด/ปิดช่องติ๊ก "ไม่ต้องแสดงอีกในวันนี้" ต่ออัน (`allowHideToday`) · ลากจัดลำดับแทนกรอกตัวเลข (ตัวใหม่ต่อท้ายอัตโนมัติ) · switch เปิด/ปิดใช้งานในหน้า list (optimistic + server action ตรง)

## ยังไม่ทำ (Backlog)

- [ ] Site switcher ในเมนู admin (สลับไปจัดการ Landing ลูกจากเมนูเดียวกัน)
- [ ] จัดการผู้ใช้ (บทบาท Admin), Onboarding 4 ขั้นครั้งแรก
- [ ] ทดสอบเกณฑ์ MVP กับผู้ใช้จริง (5 งาน: สร้างเว็บ, เปลี่ยนโลโก้/สี, แก้หน้าแรก, สร้างบล็อก, เผยแพร่)

---

## วิธีรัน

```bash
npm install               # postinstall: prisma generate
cp .env.example .env       # ตั้ง AUTH_SECRET
npm run db:migrate         # สร้าง SQLite + ตาราง
npm run db:seed            # admin@example.com / admin1234 + เว็บตัวอย่าง
npm run dev                # http://localhost:3001  (/=เว็บจริง, /administrator=CMS)
```

รายละเอียดสถาปัตยกรรม → [PLAN.md](PLAN.md) · การ deploy → [DEPLOY.md](DEPLOY.md)
