# POC Web Builder — MVP Plan

> ผู้ใช้ที่ไม่เคยสร้างเว็บไซต์ สามารถสร้างและเผยแพร่เว็บไซต์แรกได้ภายใน 15–30 นาที โดยไม่ต้องเขียนโค้ด

---

## 1. เป้าหมายและเกณฑ์วัดความสำเร็จ

| หัวข้อ | เป้า |
|---|---|
| เวลาที่ผู้ใช้ใหม่สร้างเว็บไซต์แรกเสร็จ | ≤ 30 นาที |
| เวลาที่ผู้ใช้สร้างบทความ Blog ใหม่ | ≤ 5 นาที |
| จำนวนคนสอนที่ต้องการ | 0 (ผ่านหน้าจอ + hint) |
| เกิด layout พังบน mobile ในหน้าที่สร้างจาก template | 0 ครั้ง |
| ผู้ใช้ค้นเจอปุ่ม Preview / Publish โดยไม่ต้องถาม | 100% |

ผู้ใช้ 2 กลุ่ม: **Owner / Content Editor** และ **Admin** — ไม่มี Role ซับซ้อนกว่านี้ใน MVP

---

## 2. Tech Stack

| Layer | เลือกใช้ | เหตุผลสั้น ๆ |
|---|---|---|
| Framework | **Next.js 16 (App Router) + React 19** | SSR/SSG สำหรับ site ที่ publish, admin/builder ใน app เดียว, proxy (middleware) สำหรับ subdomain routing |
| Styling | **Tailwind CSS v4** | design token ผ่าน CSS variable (Global Style ของผู้ใช้), utility-first ช่วยให้ section variants สั้น |
| Language | **TypeScript** | ทุก section มี schema ชัดเจน — TS ช่วยให้ registry type-safe |
| Database | **Prisma 7 + SQLite** (POC) → Postgres (scale) | Prisma 7 ใช้ driver adapter (`@prisma/adapter-better-sqlite3`); SQLite ทำให้ deploy ที่ไหนก็ได้ไม่ต้องมี DB แยก — ดู DEPLOY.md สำหรับสลับ Postgres |
| Auth | **Custom lightweight (jose JWT + bcryptjs)** | ตัดสินใจไม่ใช้ NextAuth ใน POC — Next 16 + NextAuth beta มีความเสี่ยง version-compat; session JWT ใน httpOnly cookie + `proxy.ts` optimistic guard ตาม official Next.js auth guide; swap เป็น NextAuth ได้ภายหลังโดยแก้แค่ `lib/session.ts` |
| Rich Text | **Tiptap** | headless, extensible, base ที่ใกล้ Notion/Docs |
| Drag-reorder | **@dnd-kit/sortable** | สำหรับ SectionList ในหน้า Builder |
| Builder state | **Zustand** | เบา, persist ง่าย, ไม่ผูกกับ React context tree |
| Media | **Local disk (POC)** → **S3-compatible** เมื่อ scale | Media Library เก็บ URL + metadata ใน DB |
| Validation | **Zod** | share schema ระหว่าง form / API / section registry |
| Deploy (POC) | Vercel + Wildcard subdomain, custom domain via CNAME + [`vercel/domains` API] | ตรงกับ requirement subdomain + custom domain |

### ทำไมไม่เลือกทางอื่น
- **React + Vite (SPA)** — ตัดออกเพราะเราต้อง render published site แบบเร็ว + SEO-friendly
- **Astro / Remix** — เก่งเรื่อง content แต่ ecosystem builder/admin น้อยกว่า, และเราต้อง client-heavy interactive builder
- **Firebase / Supabase** — เร็ว แต่ผูก vendor; Prisma + Postgres ย้ายได้ง่ายกว่าเมื่อโต

---

## 2.5 โครง routing (ปรับใหม่ 2026-07-16 ตาม feedback)

```
/                       → เว็บไซต์จริง (เวอร์ชันที่เลือก "สาธารณะ") — visitor เห็นเว็บเลย
/[slug], /blog/[slug]   → หน้าอื่น/บทความ ของเว็บสาธารณะ
/{landingSlug}/...      → Landing แยก (sub-path) ใต้เว็บสาธารณะ เช่น /aaa, /aaa/blog/x
/administrator                  → CMS (แก้เว็บที่ /) — ภาพรวม, เว็บไซต์, หน้าเว็บ, บทความ, รูปภาพ, เมนู, ตั้งค่า
/administrator/websites         → เลือกเวอร์ชันหลัก: ทำได้หลายเว็บ แล้ว "ตั้งเป็นเว็บสาธารณะ" ทีละอัน
/builder/[siteId]/[pageId]  → ตัวสร้างหน้า (full screen)
/preview/[websiteId]/*  → ดูตัวอย่างเวอร์ชัน/landing ที่ยังไม่เผยแพร่ (auth)
/administrator/login·register       → auth
```

- **เว็บสาธารณะ** = `Website.isPublic` (มีได้ทีละอัน, `setPublicWebsite` ปลดอันเดิม); root resolve ผ่าน `resolvePrimarySite()` (public → เว็บหลักล่าสุด → null→ DefaultLanding)
- **Landing แยก** = Website ที่ `parentId` ชี้เว็บหลัก, `subdomain` เก็บ slug ล้วน (เช่น `aaa`) เสิร์ฟที่ `/{slug}` — root catch-all เช็ค segment แรกกับ landing ของเว็บสาธารณะก่อน ไม่ใช่ subdomain จริง
- render เว็บ (root + landing + preview) ใช้ component ร่วม `PublicSitePage` / `PublicArticle` (`resolveSitePath` แยกหน้า/บทความ)

## 3. High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                        Next.js App                            │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐    │
│  │ /(admin)   │  │ /builder   │  │ /sites/[subdomain]   │    │
│  │            │  │            │  │  (public rendered)   │    │
│  │ Dashboard  │  │ 3-panel    │  │                      │    │
│  │ Websites   │  │ Editor     │  │ ← middleware rewrite │    │
│  │ Pages      │  │            │  │   จาก host header    │    │
│  │ Posts      │  │            │  │                      │    │
│  │ Media      │  └────────────┘  └──────────────────────┘    │
│  │ Menu       │                                               │
│  │ Settings   │  ┌────────────────────────────────────────┐  │
│  └────────────┘  │ Section Registry (src/lib/sections)    │  │
│                  │  type → variants → { component,        │  │
│                  │  defaultContent, schema }              │  │
│                  └────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ /api  — Auth, Websites, Pages, Posts, Media, Publish   │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │ Postgres  │
                    │ (Prisma)  │
                    └───────────┘
```

**Key idea:** โครงสร้างหน้าแบบ **Row / Column / Component** (rework 2026-07-16 ตาม feedback)

```
Page
└── RowInstance[]          แถว (container) — ลากเรียง, พื้นหลัง, ระยะห่าง, ความกว้าง
    └── ColumnInstance[]   1-4 คอลัมน์ต่อแถว บน grid 12 ช่อง (เช่น 6+6, 4+4+4, 3+9)
        └── ComponentInstance[]  หัวข้อ / ข้อความ / ปุ่ม / รูป ซ้อนแนวตั้งได้หลายตัว
```

- **Row presets** = template ของแถว เช่น Hero (2 คอลัมน์: ข้อความ+ปุ่ม | รูป), จุดเด่น (การ์ด 3 คอลัมน์), ติดต่อเรา — วางแล้วผู้ใช้แก้ข้างในได้อิสระ (`src/lib/page/presets.ts`)
- **Component registry** (`src/lib/page/components/registry.tsx`): heading, text, button, image, navbar, siteFooter — Render เป็น server-safe ใช้ทั้ง Builder และ Published site
- Render กลางที่ `src/lib/page/render.tsx` ใช้ **container query** (@container / @3xl:) แทน media query → device preview ใน builder ตรงกับจอจริง
- ทุกอย่างเก็บใน `Page.sections` (JSON string) — ข้อมูลรุ่นเก่า (v1 sections) แปลงอัตโนมัติตอนอ่านผ่าน `src/lib/page/convert.ts`
- **ไม่ให้ผู้ใช้เขียน CSS/HTML free-form** — ปรับได้เฉพาะ layout 12-grid + props ตาม schema → layout ไม่พังบน mobile (มือถือ stack เต็มจอเสมอ)

---

## 4. Folder Structure

```
src/
  app/
    (marketing)/               หน้า landing ของ SaaS
      page.tsx
    (auth)/
      login/page.tsx
    (admin)/                   ต้อง login
      layout.tsx               sidebar 7 เมนู + topbar
      dashboard/page.tsx
      websites/
        page.tsx               รายการเว็บไซต์
        new/page.tsx           wizard: ประเภท → template → ชื่อ
        [websiteId]/
          page.tsx             overview
          pages/page.tsx       รายการหน้า
          posts/page.tsx       รายการบทความ
          media/page.tsx       Media Library
          menu/page.tsx        Navigation Menu editor
          settings/page.tsx    domain, global style, SEO
      posts/[postId]/edit/page.tsx   Blog editor (Tiptap)
    builder/[websiteId]/[pageId]/page.tsx
    sites/[subdomain]/[[...slug]]/page.tsx   public render
    api/
      auth/[...nextauth]/route.ts
      websites/route.ts
      websites/[id]/pages/route.ts
      websites/[id]/publish/route.ts
      posts/route.ts
      media/route.ts
  components/
    ui/                        Button, Input, Dialog (label ภาษาไทย)
    admin/                     Sidebar, Topbar
    builder/                   SectionList, Canvas, SettingsPanel, InlineEditor, DevicePreviewSwitch
    sections/                  Hero, Header, Footer, Features, FAQ, ContactForm, ...
    blog/                      Editor, PostList
  lib/
    auth.ts                    NextAuth config
    db.ts                      Prisma client (singleton)
    sections/
      registry.ts              type → variants → { component, defaultContent, schema, settingsPanel }
      types.ts                 SectionInstance, GlobalStyle, ...
    globalStyle.ts             แปลง GlobalStyle → CSS variables
    subdomain.ts               host → websiteId lookup
  types/
  server/actions/              server actions (create page, publish, ...)
prisma/
  schema.prisma
public/
  templates/                   ตัวอย่างรูปที่ template ใช้
```

---

## 5. Data Model (Prisma sketch)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  passwordHash String?
  role         Role     @default(OWNER)
  websites     Website[]
  posts        BlogPost[]
  createdAt    DateTime @default(now())
}

enum Role { OWNER ADMIN }

model Website {
  id            String   @id @default(cuid())
  name          String
  subdomain     String   @unique                    // brand.platform.com
  customDomain  String?  @unique
  ownerId       String
  owner         User     @relation(fields: [ownerId], references: [id])
  globalStyle   Json                                // colors, fonts, radius, logo
  status        SiteStatus @default(DRAFT)
  siteType      SiteType                            // LANDING | COMPANY | BLOG
  pages         Page[]
  posts         BlogPost[]
  media         MediaAsset[]
  menus         NavigationMenu[]
  createdAt     DateTime @default(now())
  publishedAt   DateTime?
}

enum SiteStatus { DRAFT PUBLISHED }
enum SiteType   { LANDING COMPANY BLOG }

model Page {
  id             String   @id @default(cuid())
  websiteId      String
  website        Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  name           String
  slug           String                             // "/" for home
  isHome         Boolean  @default(false)
  sections       Json                               // ordered SectionInstance[]
  seoTitle       String?
  seoDescription String?
  status         PageStatus @default(DRAFT)
  updatedAt      DateTime @updatedAt

  @@unique([websiteId, slug])
}

enum PageStatus { DRAFT PUBLISHED }

model PageVersion {                                 // เก็บย้อนกลับ ≥ 5 เวอร์ชัน
  id        String   @id @default(cuid())
  pageId    String
  snapshot  Json
  createdAt DateTime @default(now())
  createdBy String?
}

model BlogPost {
  id             String   @id @default(cuid())
  websiteId      String
  website        Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  title          String
  slug           String
  content        Json                               // Tiptap doc
  excerpt        String?
  coverImageId   String?
  authorId       String
  author         User     @relation(fields: [authorId], references: [id])
  categoryId     String?
  category       Category? @relation(fields: [categoryId], references: [id])
  tags           Tag[]    @relation("BlogPostTags")
  seoTitle       String?
  seoDescription String?
  status         PostStatus @default(DRAFT)
  publishedAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([websiteId, slug])
}

enum PostStatus { DRAFT PUBLISHED }

model Category { id String @id @default(cuid()) websiteId String name String slug String posts BlogPost[] }
model Tag      { id String @id @default(cuid()) websiteId String name String slug String posts BlogPost[] @relation("BlogPostTags") }

model MediaAsset {
  id         String   @id @default(cuid())
  websiteId  String
  website    Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  url        String
  filename   String
  mimeType   String
  size       Int
  width      Int?
  height     Int?
  uploadedAt DateTime @default(now())
}

model NavigationMenu {
  id         String   @id @default(cuid())
  websiteId  String
  website    Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  name       String                                 // "main" / "footer"
  items      Json                                   // [{label, href, children}]
}
```

**ทำไม `sections` เป็น JSON แทนที่จะเป็น table แยก:** อ่าน/เขียนหน้าเดียวเป็น atomic, versioning ทำง่าย (snapshot ทั้ง page), lookup ต่อ section ไม่จำเป็นใน MVP

---

## 6. Section Registry

หัวใจของระบบ — ทั้ง Builder และ Published site อ่านจากไฟล์เดียวกัน

```ts
// src/lib/sections/types.ts
export type SectionType =
  | "header" | "footer" | "hero" | "text" | "imageText"
  | "features" | "cards" | "gallery" | "testimonial"
  | "stats" | "faq" | "cta" | "contactInfo" | "contactForm" | "blogList";

export interface SectionInstance {
  id: string;                    // nanoid
  type: SectionType;
  variant: string;               // "left-image" | "center-bg" | ...
  content: Record<string, unknown>;   // ตรงกับ schema
  style: {
    background?: string;
    backgroundImage?: string;
    paddingY?: "sm" | "md" | "lg";
    hidden?: boolean;
  };
}
```

```ts
// src/lib/sections/registry.ts
export interface SectionDefinition<T> {
  type: SectionType;
  label: string;                              // "ส่วนแนะนำ (Hero)"
  variants: {
    id: string;
    label: string;                            // "ข้อความซ้าย รูปขวา"
    preview: string;                          // /templates/hero-left.png
  }[];
  defaultContent: (variant: string) => T;
  schema: z.ZodType<T>;
  Component: React.FC<{ content: T; style: SectionStyle; global: GlobalStyle }>;
  SettingsPanel: React.FC<{ content: T; onChange: (c: T) => void }>;
}
```

**ประโยชน์:**
- เพิ่ม section ใหม่ = แก้ไฟล์เดียว (registry + 1 component)
- Setting panel มา auto จาก schema (สำหรับ field ทั่วไป) + custom panel เมื่อจำเป็น
- Content validation ก่อน save

MVP มี 15 section (ตรงกับ spec):
Header, Footer, Hero, Text, ImageText, Features, Cards, Gallery, Testimonial, Stats, FAQ, CTA, ContactInfo, ContactForm, BlogList — แต่ละอันมี 2–4 variants

---

## 7. Publishing / Multi-tenant Strategy

**Middleware** อยู่ที่ `src/middleware.ts`:

```
Request Host: acme.platform.com
  → lookup Website by subdomain="acme"
  → rewrite /sites/acme/[...slug]

Request Host: shop.acme.co.th   (custom domain)
  → lookup Website by customDomain
  → rewrite /sites/{subdomain}/[...slug]

Request Host: platform.com / localhost
  → ผ่านตามปกติ (admin/builder/api)
```

**Draft vs Published:**
- Preview URL: `platform.com/preview/[websiteId]?token=...` — render จาก DB draft
- Published URL: `acme.platform.com/*` — render จาก DB published snapshot
- Publish = สแนป `page.sections` → `PageVersion` + `page.status = PUBLISHED` + `website.status = PUBLISHED`

**Custom domain:** ผู้ใช้ตั้ง CNAME ไปยัง `cname.platform.com` → เราตรวจ + activate ใน settings

---

## 8. UX Principles → Implementation

| Principle จาก spec | ทำอย่างไรในโค้ด |
|---|---|
| ภาษาคน ไม่ใช่ศัพท์เทคนิค | `messages.ts` centralize; ห้ามใช้ "margin/padding/container" ในหน้าจอ |
| แก้แล้วเห็นผลทันที | Builder เก็บ state ใน Zustand → preview iframe/panel re-render โดยไม่ save |
| Auto Save | debounce 800 ms → `PATCH /api/websites/:id/pages/:id` |
| Undo / Redo | history stack ใน Zustand (ไม่เกิน 50 step) |
| เก็บ ≥ 5 versions ก่อน publish | ทุกครั้ง publish สร้าง `PageVersion`; job cron ตัดที่เกิน N |
| แนะนำครั้งแรก (4 ขั้น) | onboarding tour ด้วย `driver.js` หรือ custom overlay, flag `user.completedTour` |
| ยืนยันก่อนลบ | Dialog reusable + type "ลบ" เพื่อยืนยันสำหรับ website/page |

---

## 9. Sprint Roadmap (6 sprints × ~2 สัปดาห์)

### Sprint 0 — Foundation ✅ (เสร็จ 2026-07-16)
- [x] Next.js + Tailwind + TS scaffold
- [x] Folder structure, section registry สเก็ต, design tokens, admin/builder skeleton

### Sprint 1 — Auth + Website CRUD ✅ (เสร็จ 2026-07-16)
- [x] Custom auth (jose + bcryptjs) + `/login`, `/register` + `proxy.ts` guard + logout
- [x] Prisma 7 + SQLite + migrate + seed (admin@example.com + เว็บ demo)
- [x] Dashboard จริง — ดึงจาก DB (สถานะ, จำนวนหน้า, แก้ไขล่าสุด)
- [x] Website: list / create wizard 2 ขั้น (ประเภท+template → ชื่อ+subdomain auto-slug)
- [x] Global Style panel (สีหลัก/สีรอง/logo URL/fonts/ปุ่ม/ความโค้ง) — apply ถึง public site
- [x] Section เพิ่ม 5 ตัว: header, footer, text, features, cta (รวมเป็น 6 กับ hero)
- [x] Builder โหลด/บันทึกจาก DB + auto-save debounce 800ms + สถานะบันทึก
- [x] Public site route render จาก DB (draft banner — publish flow จริงใน Sprint 5)
- [x] Deploy setup: `output: standalone` + Dockerfile + DEPLOY.md (Docker/VPS + Vercel)
- **ส่งมอบแล้ว:** register → wizard → builder แก้เนื้อหา → auto-save → เห็นผลบน `/sites/[subdomain]` (verify E2E ผ่าน browser แล้ว)

### Sprint 2 — Page CRUD + Builder Interactions ✅ (เสร็จ 2026-07-16)
- [x] SectionList: ลากเรียงด้วย dnd-kit (Pointer + Keyboard sensor, stable DndContext id)
- [x] Add Section modal — เลือก type + variant จาก registry (ตัวที่ยังไม่ implement ขึ้น disabled)
- [x] **ระบบ container 12 grid**: `SectionContainer` (เนื้อหากิน 12/10/8/6 ช่อง จัดกึ่งกลาง, มือถือเต็มจอเสมอ) + `SectionSplit` (แบ่งซ้าย/ขวา 6:6, 5:7, 7:5, 4:8, 8:4 สำหรับ hero) — ควบคุมผ่าน picker แบบ mini-grid ใน Settings panel ("ความกว้างของเนื้อหา" / "การแบ่งคอลัมน์ซ้าย/ขวา")
- [x] Pages CRUD: list/create (เลือก 5 layouts)/rename/delete (ห้ามลบหน้าแรก, confirm ก่อนลบ)
- [x] Page switcher dropdown ใน builder topbar (key reset state ตอนสลับหน้า)
- [x] Fix: stale-closure ใน onContent/onStyleChange (แก้หลายค่าติดกันแล้วค่าหาย)
- หมายเหตุ: sections state ใช้ useState ใน BuilderShell แทน Zustand — พอสำหรับ scope ปัจจุบัน จะย้ายเมื่อต้อง share state ข้าม component tree (undo/redo Sprint 6)
- **ส่งมอบแล้ว:** เพิ่ม/ลบ/เรียง/ซ่อน section, ปรับ 12-grid layout, สร้าง/จัดการหลายหน้า — verify E2E แล้ว

### Sprint 2.5 — Rework เป็น Row/Column/Component ✅ (เสร็จ 2026-07-16)
ตาม feedback: หน้า = หลาย rows → แต่ละ row มี 1-4 columns (12 grid) → แต่ละ column มีหลาย components
- [x] Data model v2 + component registry 6 ตัว (heading/text/button/image/navbar/siteFooter)
- [x] Row presets: Hero, จุดเด่น, รูปพร้อมข้อความ, ข้อความ, CTA, ติดต่อเรา + แถวเปล่า 1-4 คอลัมน์
- [x] Builder เลือกได้ 3 ระดับ (แถว → คอลัมน์ → ชิ้นส่วน) settings panel ต่อระดับ
- [x] Row: เปลี่ยนจำนวน/สัดส่วนคอลัมน์ (component เดิมไม่หาย), Column: จัดวาง/การ์ด/เพิ่มชิ้นส่วน, Component: form ต่อ type + ย้ายขึ้นลง/ลบ
- [x] Container query (@3xl:) แทน media query → device preview ตรงกับจริง
- [x] Converter ข้อมูล v1 → v2 ตอนอ่าน (ไม่ต้อง migrate DB)
- [x] Fix: column `items-*` ทำให้ component หดตามเนื้อหา → เปลี่ยนเป็น text-align + `.comp-flex` justify
- **Verify แล้ว:** แก้ component → canvas อัปเดต, เปลี่ยน 2↔3 คอลัมน์, เพิ่มชิ้นส่วนในคอลัมน์, เพิ่มแถวจาก preset (แทรกก่อน footer), reload persist, public site วัดสัดส่วน 5:7 เป๊ะ, build + lint ผ่าน

### Sprint 3 — Component Library + Feedback ✅ (เสร็จ 2026-07-16)
- [x] **Breadcrumbs ใน settings panel** — แถว › คอลัมน์ N › ชิ้นส่วน, คลิกระดับบนเพื่อไปตั้งค่าตัวแม่
- [x] **ปุ่ม v2** — เพิ่ม/ลบปุ่มเป็น list (สูงสุด 3), จัดแนวนอนเอง (ตามคอลัมน์/ซ้าย/กลาง/ขวา), ปุ่มทึบ/ขอบ ต่อปุ่ม + normalize ข้อมูลรุ่นเก่า
- [x] Component ใหม่ 8 ตัว: วิดีโอ (YouTube/Vimeo embed), แกลเลอรี่รูป, รีวิว/คำพูด, ตัวเลขสถิติ, FAQ (accordion ด้วย `<details>` ไม่ต้องใช้ JS), เส้นคั่น, ระยะเว้น, แบบฟอร์มติดต่อ (UI — ส่งจริง Sprint 5)
- [x] Preset ใหม่: แกลเลอรี่, รีวิวจากลูกค้า (การ์ด 3 ใบ), ตัวเลข/สถิติ (4 คอลัมน์), คำถามที่พบบ่อย + preset ติดต่อเราใส่ฟอร์มจริง
- [x] Canvas กัน link/iframe/input แย่งคลิก (`pointer-events-none`) — คลิกในตัวสร้าง = เลือกชิ้นส่วนเสมอ
- [x] LANDING template เพิ่มแถว FAQ
- เหลือของเดิมใน backlog: BlogList (ต้องมี Blog CMS — Sprint 4), inline contentEditable (Sprint 6 polish)
- **Verify แล้ว:** breadcrumb นำทาง 3 ระดับ, เพิ่มปุ่มถึง 3 + จัดกลาง (วัด justify-content: center), เพิ่มแถว FAQ จาก preset, accordion เปิด-ปิดบนเว็บจริง, build + lint ผ่าน

### Sprint 4 — Blog CMS + Media Library + Feedback ✅ (เสร็จ 2026-07-16)
**Feedback:**
- [x] **Header/Footer เป็น site-level** — เก็บที่ `Website.headerRow/footerRow`, โครงล็อกทุกหน้า, ใน builder แสดงล็อกไว้ (hover เห็นคำอธิบาย) คลิกแล้วเข้า **editor แยก** ที่ `/builder/[id]/site-header|site-footer` (ChromeShell), หน้าเก่าที่มี header/footer ค้างถูกตัดออกอัตโนมัติตอนอ่าน
- [x] **แกลเลอรี่โหมดสไลด์** — เลือก ตาราง/สไลด์ ได้, สไลด์ = scroll-snap ปัดได้บนมือถือ + ปุ่มลูกศร
- [x] **ตัวเลขสถิติแยก คำนำหน้า/ตัวเลข/หน่วย** + แอนิเมชั่นนับ 0→ค่า เมื่อ scroll มาเห็น (IntersectionObserver + rAF, เคารพ reduced-motion, SSR แสดงค่าจริงเพื่อ SEO) — ข้อมูลเก่า "100+" แปลงอัตโนมัติ

**Sprint 4:**
- [x] Media Library: อัปโหลด (≤8MB, รูปเท่านั้น) → `public/uploads`, ตาราง grid + คัดลอกลิงก์ + ลบ, `MediaAsset` model
- [x] MediaPicker modal ใช้ร่วม 3 ที่: component รูปภาพ, แกลเลอรี่, ภาพปกบทความ (+แทรกรูปใน editor)
- [x] Blog CMS: Tiptap editor (H2/H3, หนา/เอียง, ลิงก์, list, quote, รูปจากคลัง, YouTube embed), ชื่อ+auto-slug (รองรับไทย), คำโปรย, ภาพปก, หมวดหมู่ (สร้างใหม่ inline), แท็ก CSV, SEO title/description, บันทึกร่าง/เผยแพร่/ยกเลิกเผยแพร่/ลบ
- [x] `BlogPost` + `Category` models (แท็กเป็น CSV ใน POC — แยกตารางเมื่อต้อง filter)
- [x] Component `blogList` — การ์ดบทความจริงผ่าน `siteData` (ใน builder แสดง mock), preset "รายการบทความ"
- [x] หน้าบทความ public `/sites/[subdomain]/blog/[slug]` — header/footer กลาง + ปก + เนื้อหา (generateHTML) + แท็ก + SEO meta/OG
- [x] Fix: dynamic params มาแบบ URL-encoded → ต้อง decodeURIComponent ก่อนเทียบ slug ไทย
- [x] Dashboard นับบทความ/รูปจริง
- **Verify แล้ว:** แก้ header ใน chrome editor → ขึ้นทุกหน้า, อัปโหลดรูป → เลือกเป็นปก, เขียน+เผยแพร่บทความ → เปิดอ่านบนเว็บจริง, blogList แสดงบทความจริง, stat นับ 70+→100+ กลางทาง, สไลด์แสดงลูกศรทั้ง builder/public, build+lint ผ่าน

### Feedback รอบ Websites tree + Site hierarchy ✅ (เสร็จ 2026-07-16)
- [x] **หน้า "เว็บไซต์" เป็น tree collapse** — คลิกเว็บไซต์แล้วกางเห็น: รายการหน้า (+ เพิ่มหน้า modal), ส่วนหัว/ส่วนท้าย (ลิงก์เข้า chrome editor), และโดเมนย่อย
- [x] **เว็บหลัก → โดเมนย่อย** — `Website.parentId` (self-relation, onDelete cascade); เว็บหลัก parentId=null, โดเมนย่อยชี้กลับเว็บหลัก, subdomain ประกอบเป็น `{label}.{parentSub}` (เช่น `blog.mybrand` → `blog.mybrand.platform.com`)
- [x] `createSubdomain` action + modal (auto-slug จากชื่อ, พรีวิว full domain), โดเมนย่อยได้ home page + header/footer ของตัวเอง
- [x] โดเมนย่อยแสดงซ้อนใต้เว็บหลักใน tree (การ์ดรอง สีต่าง) กางเห็นหน้า/ส่วนหัว/ท้ายของมันเอง
- หมายเหตุ: routing ยัง resolve ด้วย `subdomain` column ตรง ๆ (โดเมนย่อยมีจุดในค่า) — เว็บย่อย publish/preview ได้เลย; เมนู dashboard/posts/media/settings ยังใช้ "เว็บล่าสุด" (จะเพิ่ม site switcher เมื่อจำเป็น)
- **Verify แล้ว:** กาง/ยุบ, สร้างโดเมนย่อย blog → ซ้อนใต้เว็บหลัก + เว็บย่อย public render 200, เพิ่มหน้าจาก tree เข้า builder ถูก websiteId, build+lint ผ่าน

### Sprint 5 — Publishing + Multi-tenant
- Middleware subdomain routing
- `/sites/[subdomain]/[[...slug]]` render จาก DB (SSG + ISR)
- Publish flow + PageVersion + rollback
- Custom domain setup UI (ตรวจ DNS)
- Navigation Menu editor
- SEO meta + Open Graph
- **ส่งมอบ:** เว็บไซต์ที่ publish ดูได้ที่ subdomain

### Sprint 6 — Polish + Onboarding + Usability Test
- Undo/Redo
- Confirm-to-delete dialog
- Onboarding tour (4 ขั้น)
- Preview URL + share
- Copy/paste section, save as template (ระดับ user)
- Empty-state ที่ดี (dashboard, media, posts)
- **Usability test 5 tasks × 5 คน** ตามเกณฑ์ในหัวข้อ 1
- **ส่งมอบ:** MVP release candidate

---

## 10. ⏸️ Deferred (ตาม spec ของผู้ใช้)

Free-form drag & drop, Plugin marketplace, E-commerce, ระบบสมาชิก, Workflow อนุมัติ, Multi-language, AI สร้างเว็บ, Custom code, Animation, A/B test, Analytics เชิงลึก

---

## 11. คำสั่งใช้งาน

```bash
npm install              # postinstall รัน prisma generate ให้
cp .env.example .env     # ตั้ง AUTH_SECRET
npm run db:migrate       # สร้าง SQLite + ตาราง
npm run db:seed          # admin@example.com / admin1234 + เว็บ demo
npm run dev              # http://localhost:3000
npm run build            # ตรวจว่า production build ผ่าน
npm run db:studio        # ดูข้อมูลใน DB
```

เส้นทางหลัก:
- `/` — landing (marketing)
- `/register`, `/login` — auth จริง (jose session)
- `/dashboard` — ภาพรวมจาก DB
- `/websites/new` — wizard สร้างเว็บไซต์จาก template
- `/builder/[websiteId]/[pageId]` — builder 3-panel + auto-save
- `/settings` — Global Style
- `/sites/[subdomain]` — เว็บไซต์ที่ render จาก DB

การ deploy → ดู [DEPLOY.md](DEPLOY.md)
