"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getTemplate, instantiateRows } from "@/lib/templates";
import { makeFooterRow, makeHeaderRow } from "@/lib/page/presets";
import { defaultGlobalStyle } from "@/lib/page/types";

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
  redirect(homePageId ? `/builder/${website.id}/${homePageId}` : "/admin/dashboard");
}

// ── โดเมนย่อย ──────────────────────────────────────────────────────────────
// เว็บหลัก 1 เว็บ สร้างโดเมนย่อยแยกได้หลายอัน เช่น blog.mybrand.platform.com
// เก็บเป็น Website ที่ parentId ชี้กลับเว็บหลัก, subdomain = "{label}.{parentSub}"

const subdomainSchema = z.object({
  parentId: z.string().min(1),
  name: z.string().min(2, "ชื่อต้องยาวอย่างน้อย 2 ตัวอักษร").max(60),
  label: z
    .string()
    .min(1, "กรุณากรอกชื่อโดเมนย่อย")
    .max(30)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      message: "ใช้ได้เฉพาะ a-z, 0-9 และขีดกลาง (-)",
    }),
});

export async function createSubdomain(
  _prev: CreateWebsiteState,
  formData: FormData,
): Promise<CreateWebsiteState> {
  const user = await requireUser();

  const parsed = subdomainSchema.safeParse({
    parentId: formData.get("parentId"),
    name: formData.get("name"),
    label: formData.get("label"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const parent = await db.website.findUnique({
    where: { id: parsed.data.parentId },
    select: { id: true, ownerId: true, subdomain: true, parentId: true },
  });
  if (!parent || (parent.ownerId !== user.id && user.role !== "ADMIN")) {
    return { error: "ไม่พบเว็บหลัก" };
  }
  if (parent.parentId) {
    return { error: "สร้างโดเมนย่อยได้เฉพาะใต้เว็บหลักเท่านั้น" };
  }

  const subdomain = `${parsed.data.label}.${parent.subdomain}`;
  const existing = await db.website.findUnique({ where: { subdomain } });
  if (existing) {
    return { error: `${subdomain}.platform.com ถูกใช้แล้ว ลองชื่ออื่น` };
  }

  const site = await db.website.create({
    data: {
      name: parsed.data.name,
      subdomain,
      ownerId: user.id,
      parentId: parent.id,
      siteType: "COMPANY",
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
  redirect(homePageId ? `/builder/${site.id}/${homePageId}` : "/admin/websites");
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

  // public ได้ทีละอัน — ปลดอันเดิมก่อน แล้วตั้งอันนี้ + สถานะเป็นเผยแพร่
  await db.$transaction([
    db.website.updateMany({ where: { isPublic: true }, data: { isPublic: false } }),
    db.website.update({
      where: { id: websiteId },
      data: { isPublic: true, status: "PUBLISHED", publishedAt: new Date() },
    }),
  ]);

  revalidatePath("/admin/websites");
  revalidatePath("/", "layout");
}
