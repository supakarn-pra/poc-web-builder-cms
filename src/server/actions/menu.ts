"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseFooterRow, parseHeaderRow } from "@/lib/serialize";
import type { ComponentType, RowInstance } from "@/lib/page/types";
import { publishWebsiteById } from "./publish";

// หน้า "ส่วนหัว/ส่วนท้าย" ใน CMS — แก้ props ของ navbar (headerRow) และ
// siteFooter (footerRow) ซึ่งเป็นข้อมูลเดียวกับที่ builder แก้ (ฉบับร่าง)

const linksSchema = z
  .array(
    z.object({
      label: z.string().min(1, "กรอกชื่อเมนูให้ครบทุกอัน").max(60),
      href: z.string().min(1).max(500),
    }),
  )
  .max(10, "เมนูได้สูงสุด 10 อัน");

const chromeSchema = z.object({
  headerBrand: z.string().min(1, "กรอกชื่อแบรนด์ของส่วนหัว").max(60),
  ctaLabel: z.string().max(30, "ข้อความปุ่มยาวเกินไป"),
  ctaHref: z.string().max(500),
  footerBrand: z.string().min(1, "กรอกชื่อแบรนด์ของส่วนท้าย").max(60),
  footerDescription: z.string().max(300, "คำอธิบายยาวเกินไป"),
  footerCopyright: z.string().max(120, "ข้อความลิขสิทธิ์ยาวเกินไป"),
});

export interface MenuActionState {
  error?: string;
  saved?: boolean;
  published?: boolean;
}

/** merge props ให้ component ตัวแรกของ type ที่ระบุในแถว — คืน false ถ้าไม่พบ */
function patchComponent(
  row: RowInstance,
  type: ComponentType,
  patch: Record<string, unknown>,
): boolean {
  for (const col of row.columns) {
    for (const comp of col.components) {
      if (comp.type === type) {
        comp.props = { ...comp.props, ...patch };
        return true;
      }
    }
  }
  return false;
}

export async function saveSiteChrome(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const user = await requireUser();
  const websiteId = String(formData.get("websiteId") ?? "");
  const doPublish = formData.get("publish") === "1";

  let mainLinks, footerLinks;
  try {
    mainLinks = linksSchema.parse(JSON.parse(String(formData.get("mainLinks"))));
    footerLinks = linksSchema.parse(
      JSON.parse(String(formData.get("footerLinks"))),
    );
  } catch (e) {
    return {
      error: e instanceof z.ZodError ? e.issues[0].message : "ข้อมูลเมนูไม่ถูกต้อง",
    };
  }

  const parsed = chromeSchema.safeParse({
    headerBrand: String(formData.get("headerBrand") ?? "").trim(),
    ctaLabel: String(formData.get("ctaLabel") ?? "").trim(),
    ctaHref: String(formData.get("ctaHref") ?? "").trim(),
    footerBrand: String(formData.get("footerBrand") ?? "").trim(),
    footerDescription: String(formData.get("footerDescription") ?? "").trim(),
    footerCopyright: String(formData.get("footerCopyright") ?? "").trim(),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const site = await db.website.findUnique({
    where: { id: websiteId },
    select: { id: true, ownerId: true, headerRow: true, footerRow: true },
  });
  if (!site || (site.ownerId !== user.id && user.role !== "ADMIN")) {
    return { error: "ไม่พบเว็บไซต์" };
  }

  const header = parseHeaderRow(site.headerRow);
  const footer = parseFooterRow(site.footerRow);

  const headerOk = patchComponent(header, "navbar", {
    brandName: d.headerBrand,
    links: mainLinks,
    ctaLabel: d.ctaLabel || undefined,
    ctaHref: d.ctaLabel ? d.ctaHref || "#" : undefined,
  });
  if (!headerOk) {
    return {
      error:
        "ส่วนหัวของเว็บนี้ไม่มีแถบเมนู — เพิ่มแถบเมนูในตัวแก้ไขส่วนหัวก่อน",
    };
  }
  const footerOk = patchComponent(footer, "siteFooter", {
    brandName: d.footerBrand,
    description: d.footerDescription || undefined,
    copyright: d.footerCopyright || undefined,
    links: footerLinks,
  });
  if (!footerOk) {
    return {
      error:
        "ส่วนท้ายของเว็บนี้ไม่มีชิ้นส่วนส่วนท้าย — เพิ่มในตัวแก้ไขส่วนท้ายก่อน",
    };
  }

  await db.website.update({
    where: { id: websiteId },
    data: {
      headerRow: JSON.stringify(header),
      footerRow: JSON.stringify(footer),
    },
  });

  if (doPublish) {
    await publishWebsiteById(websiteId);
    revalidatePath("/", "layout");
  }

  revalidatePath("/administrator/menu");
  return { saved: true, published: doPublish };
}
