"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseFooterRow, parseHeaderRow } from "@/lib/serialize";
import type { ComponentType, RowInstance } from "@/lib/page/types";
import { publishWebsiteById } from "./publish";

// เมนูหลัก = links ของ navbar ใน headerRow, เมนูส่วนท้าย = links ของ siteFooter
// ใน footerRow — แก้ที่นี่คือแก้ข้อมูลเดียวกับที่ builder แก้ (ฉบับร่าง)

const linksSchema = z
  .array(
    z.object({
      label: z.string().min(1, "กรอกชื่อเมนูให้ครบทุกอัน").max(60),
      href: z.string().min(1).max(500),
    }),
  )
  .max(10, "เมนูได้สูงสุด 10 อัน");

export interface MenuActionState {
  error?: string;
  saved?: boolean;
  published?: boolean;
}

/** ใส่ links ให้ component ตัวแรกของ type ที่ระบุในแถว — คืน false ถ้าไม่พบ */
function setComponentLinks(
  row: RowInstance,
  type: ComponentType,
  links: Array<{ label: string; href: string }>,
): boolean {
  for (const col of row.columns) {
    for (const comp of col.components) {
      if (comp.type === type) {
        comp.props = { ...comp.props, links };
        return true;
      }
    }
  }
  return false;
}

export async function saveMenus(
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

  const site = await db.website.findUnique({
    where: { id: websiteId },
    select: { id: true, ownerId: true, headerRow: true, footerRow: true },
  });
  if (!site || (site.ownerId !== user.id && user.role !== "ADMIN")) {
    return { error: "ไม่พบเว็บไซต์" };
  }

  const header = parseHeaderRow(site.headerRow);
  const footer = parseFooterRow(site.footerRow);

  if (!setComponentLinks(header, "navbar", mainLinks)) {
    return {
      error:
        "ส่วนหัวของเว็บนี้ไม่มีแถบเมนู — เพิ่มแถบเมนูในตัวแก้ไขส่วนหัวก่อน",
    };
  }
  if (!setComponentLinks(footer, "siteFooter", footerLinks)) {
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
