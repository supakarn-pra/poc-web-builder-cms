"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getTemplate, instantiateRows } from "@/lib/templates";
import { makeFooterRow, makeHeaderRow } from "@/lib/page/presets";
import { defaultGlobalStyle } from "@/lib/page/types";
import { isReservedSlug } from "@/lib/reserved";
import { publishWebsiteById } from "./publish";

export interface CreateWebsiteState {
  error?: string;
}

const createSchema = z.object({
  siteType: z.enum(["LANDING", "COMPANY", "BLOG"]),
  name: z.string().min(2, "ชื่อเว็บไซต์ต้องยาวอย่างน้อย 2 ตัวอักษร").max(60),
  subdomain: z
    .string()
    .min(3, "Subdomain ต้องยาวอย่างน้อย 3 ตัวอักษร")
    .max(30)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      message: "ใช้ได้เฉพาะ a-z, 0-9 และขีดกลาง (-)",
    }),
});

export async function createWebsite(
  _prev: CreateWebsiteState,
  formData: FormData,
): Promise<CreateWebsiteState> {
  const user = await requireUser();

  const parsed = createSchema.safeParse({
    siteType: formData.get("siteType"),
    name: formData.get("name"),
    subdomain: formData.get("subdomain"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const template = getTemplate(parsed.data.siteType);
  if (!template) {
    return { error: "ไม่พบ Template ที่เลือก" };
  }

  const existing = await db.website.findUnique({
    where: { subdomain: parsed.data.subdomain },
  });
  if (existing) {
    return { error: "Subdomain นี้ถูกใช้แล้ว ลองชื่ออื่น" };
  }

  const website = await db.website.create({
    data: {
      name: parsed.data.name,
      subdomain: parsed.data.subdomain,
      ownerId: user.id,
      siteType: parsed.data.siteType,
      globalStyle: JSON.stringify(defaultGlobalStyle),
      headerRow: JSON.stringify(
        makeHeaderRow(parsed.data.siteType === "LANDING"),
      ),
      footerRow: JSON.stringify(makeFooterRow()),
      pages: {
        create: template.pages.map((p) => ({
          name: p.name,
          slug: p.slug,
          isHome: p.isHome ?? false,
          sections: JSON.stringify(instantiateRows(p.rows)),
        })),
      },
    },
    include: { pages: { where: { isHome: true }, select: { id: true } } },
  });

  const homePageId = website.pages[0]?.id;
  redirect(homePageId ? `/builder/${website.id}/${homePageId}` : "/administrator/dashboard");
}

// ── Landing แยก (sub-path) ─────────────────────────────────────────────────
// เว็บหลัก 1 เว็บ มี landing สินค้าแยกได้หลายอัน เสิร์ฟที่ platform.com/{slug}
// (ไม่ใช่ subdomain) — เก็บเป็น Website ที่ parentId ชี้เว็บหลัก, subdomain = slug ล้วน

const landingSchema = z.object({
  parentId: z.string().min(1),
  name: z.string().min(2, "ชื่อต้องยาวอย่างน้อย 2 ตัวอักษร").max(60),
  slug: z
    .string()
    .min(1, "กรุณากรอกที่อยู่ (slug)")
    .max(30)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      message: "ใช้ได้เฉพาะ a-z, 0-9 และขีดกลาง (-)",
    }),
});

export async function createLanding(
  _prev: CreateWebsiteState,
  formData: FormData,
): Promise<CreateWebsiteState> {
  const user = await requireUser();

  const parsed = landingSchema.safeParse({
    parentId: formData.get("parentId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  if (isReservedSlug(parsed.data.slug)) {
    return { error: `"${parsed.data.slug}" เป็นคำสงวน ใช้เป็นที่อยู่ไม่ได้` };
  }

  const parent = await db.website.findUnique({
    where: { id: parsed.data.parentId },
    select: { id: true, ownerId: true, parentId: true },
  });
  if (!parent || (parent.ownerId !== user.id && user.role !== "ADMIN")) {
    return { error: "ไม่พบเว็บหลัก" };
  }
  if (parent.parentId) {
    return { error: "สร้าง Landing แยกได้เฉพาะใต้เว็บหลักเท่านั้น" };
  }

  // subdomain column เก็บ slug ล้วน (unique ทั้งระบบ) — ใช้เป็น sub-path /{slug}
  const existing = await db.website.findUnique({
    where: { subdomain: parsed.data.slug },
  });
  if (existing) {
    return { error: `ที่อยู่ /${parsed.data.slug} ถูกใช้แล้ว ลองชื่ออื่น` };
  }

  const site = await db.website.create({
    data: {
      name: parsed.data.name,
      subdomain: parsed.data.slug,
      ownerId: user.id,
      parentId: parent.id,
      siteType: "LANDING",
      globalStyle: JSON.stringify(defaultGlobalStyle),
      headerRow: JSON.stringify(makeHeaderRow(false)),
      footerRow: JSON.stringify(makeFooterRow()),
      pages: {
        create: [
          {
            name: "หน้าแรก",
            slug: "home",
            isHome: true,
            sections: JSON.stringify(instantiateRows(["hero", "cta"])),
          },
        ],
      },
    },
    include: { pages: { where: { isHome: true }, select: { id: true } } },
  });

  const homePageId = site.pages[0]?.id;
  redirect(homePageId ? `/builder/${site.id}/${homePageId}` : "/administrator/websites");
}

// ── โดเมนของคุณเอง (custom domain) ─────────────────────────────────────────
export interface DomainState {
  error?: string;
  saved?: boolean;
}

const domainSchema = z
  .string()
  .max(100)
  .regex(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/, {
    message: "รูปแบบโดเมนไม่ถูกต้อง เช่น mybrand.com",
  })
  .or(z.literal(""));

export async function updateCustomDomain(
  _prev: DomainState,
  formData: FormData,
): Promise<DomainState> {
  const user = await requireUser();
  const websiteId = String(formData.get("websiteId") ?? "");
  const parsed = domainSchema.safeParse(
    String(formData.get("customDomain") ?? "").trim().toLowerCase(),
  );
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const site = await db.website.findUnique({
    where: { id: websiteId },
    select: { ownerId: true },
  });
  if (!site || (site.ownerId !== user.id && user.role !== "ADMIN")) {
    return { error: "ไม่พบเว็บไซต์" };
  }

  await db.website.update({
    where: { id: websiteId },
    data: { customDomain: parsed.data || null },
  });
  revalidatePath("/administrator/settings");
  return { saved: true };
}

// ── ลบเวอร์ชัน/Landing ──────────────────────────────────────────────────────
// ลบทั้งเว็บ (หน้า บทความ รูป ฯลฯ cascade ตาม schema) — ห้ามลบตัวที่ใช้งานจริงอยู่

export interface DeleteWebsiteState {
  error?: string;
}

export async function deleteWebsite(
  _prev: DeleteWebsiteState,
  formData: FormData,
): Promise<DeleteWebsiteState> {
  const user = await requireUser();
  const websiteId = String(formData.get("websiteId") ?? "");

  const site = await db.website.findUnique({
    where: { id: websiteId },
    select: { id: true, ownerId: true, isPublic: true, parentId: true },
  });
  if (!site || (site.ownerId !== user.id && user.role !== "ADMIN")) {
    return { error: "ไม่พบเวอร์ชันนี้" };
  }
  if (site.isPublic) {
    return {
      error:
        "เวอร์ชันนี้ใช้งานเป็นเว็บจริงอยู่ — เลือกเวอร์ชันอื่นเป็นเว็บจริงก่อน แล้วค่อยลบ",
    };
  }

  await db.website.delete({ where: { id: websiteId } });

  revalidatePath("/administrator/websites");
  revalidatePath("/", "layout");
  return {};
}

// ── เลือกเวอร์ชันที่เสิร์ฟที่ root "/" ─────────────────────────────────────
export async function setPublicWebsite(formData: FormData) {
  const user = await requireUser();
  const websiteId = String(formData.get("websiteId") ?? "");

  const site = await db.website.findUnique({
    where: { id: websiteId },
    select: { id: true, ownerId: true },
  });
  if (!site || (site.ownerId !== user.id && user.role !== "ADMIN")) {
    return;
  }

  // public ได้ทีละอัน — ปลดอันเดิมก่อน แล้วตั้งอันนี้
  await db.$transaction([
    db.website.updateMany({ where: { isPublic: true }, data: { isPublic: false } }),
    db.website.update({
      where: { id: websiteId },
      data: { isPublic: true },
    }),
  ]);
  // ตั้งเป็นสาธารณะ = เผยแพร่สถานะปัจจุบันทันที (สร้าง snapshot)
  await publishWebsiteById(websiteId);

  revalidatePath("/administrator/websites");
  revalidatePath("/", "layout");
}
