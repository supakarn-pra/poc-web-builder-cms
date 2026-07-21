"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export interface PopupActionState {
  error?: string;
  saved?: boolean;
}

// pageIds เก็บเป็น "ALL" หรือ JSON array ของ pageId (SQLite ไม่มี JSON column)
const popupSchema = z.object({
  title: z.string().max(120),
  text: z.string().max(2000),
  imageUrl: z.string().max(1000),
  target: z.enum(["ALL", "PAGES"]),
  pageIds: z.array(z.string().min(1)).max(50),
  enabled: z.boolean(),
  allowHideToday: z.boolean(),
});

async function requireWebsite(websiteId: string) {
  const user = await requireUser();
  const site = await db.website.findUnique({
    where: { id: websiteId },
    select: { id: true, ownerId: true },
  });
  if (!site || (site.ownerId !== user.id && user.role !== "ADMIN")) return null;
  return site;
}

/** สร้าง/แก้ไข popup — popupId ว่าง = สร้างใหม่ (ต่อท้ายลำดับเสมอ) */
export async function savePopup(
  _prev: PopupActionState,
  formData: FormData,
): Promise<PopupActionState> {
  const websiteId = String(formData.get("websiteId") ?? "");
  const popupId = String(formData.get("popupId") ?? "");

  let pageIds: string[];
  try {
    pageIds = JSON.parse(String(formData.get("pageIds") ?? "[]"));
  } catch {
    return { error: "ข้อมูลหน้าที่เลือกไม่ถูกต้อง" };
  }

  const parsed = popupSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    text: String(formData.get("text") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
    target: formData.get("target"),
    pageIds,
    enabled: formData.get("enabled") === "on",
    allowHideToday: formData.get("allowHideToday") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  if (!d.text && !d.imageUrl) {
    return { error: "ใส่ข้อความหรือรูปภาพอย่างน้อยหนึ่งอย่าง" };
  }
  if (d.target === "PAGES" && d.pageIds.length === 0) {
    return { error: "เลือกอย่างน้อย 1 หน้า หรือเปลี่ยนเป็นแสดงทุกหน้า" };
  }

  const site = await requireWebsite(websiteId);
  if (!site) return { error: "ไม่พบเว็บไซต์" };

  const data = {
    title: d.title || null,
    text: d.text,
    imageUrl: d.imageUrl || null,
    pageIds: d.target === "ALL" ? "ALL" : JSON.stringify(d.pageIds),
    enabled: d.enabled,
    allowHideToday: d.allowHideToday,
  };

  if (popupId) {
    const existing = await db.popup.findUnique({
      where: { id: popupId },
      select: { websiteId: true },
    });
    if (!existing || existing.websiteId !== site.id) {
      return { error: "ไม่พบ Pop-up นี้" };
    }
    await db.popup.update({ where: { id: popupId }, data });
  } else {
    // ตัวใหม่ต่อท้ายลำดับ — ผู้ใช้ลากจัดเองในหน้า list
    const last = await db.popup.findFirst({
      where: { websiteId: site.id },
      orderBy: { sortIndex: "desc" },
      select: { sortIndex: true },
    });
    await db.popup.create({
      data: { ...data, websiteId: site.id, sortIndex: (last?.sortIndex ?? -1) + 1 },
    });
  }

  revalidatePath("/administrator/popups");
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function deletePopup(
  _prev: PopupActionState,
  formData: FormData,
): Promise<PopupActionState> {
  const popupId = String(formData.get("popupId") ?? "");
  const popup = await db.popup.findUnique({
    where: { id: popupId },
    select: { websiteId: true },
  });
  if (!popup) return { error: "ไม่พบ Pop-up นี้" };

  const site = await requireWebsite(popup.websiteId);
  if (!site) return { error: "ไม่พบเว็บไซต์" };

  await db.popup.delete({ where: { id: popupId } });
  revalidatePath("/administrator/popups");
  revalidatePath("/", "layout");
  return { saved: true };
}

/** ลากจัดลำดับในหน้า list — sortIndex = ตำแหน่งใน array (เรียกตรงจาก client) */
export async function reorderPopups(
  websiteId: string,
  orderedIds: string[],
): Promise<PopupActionState> {
  if (!Array.isArray(orderedIds) || orderedIds.length > 100) {
    return { error: "ข้อมูลลำดับไม่ถูกต้อง" };
  }
  const site = await requireWebsite(websiteId);
  if (!site) return { error: "ไม่พบเว็บไซต์" };

  await db.$transaction(
    orderedIds.map((id, i) =>
      db.popup.updateMany({
        // updateMany + เช็ค websiteId — กันยัด id ของเว็บอื่นเข้ามา
        where: { id, websiteId: site.id },
        data: { sortIndex: i },
      }),
    ),
  );
  revalidatePath("/administrator/popups");
  revalidatePath("/", "layout");
  return { saved: true };
}

/** switch เปิด/ปิดจากหน้า list (เรียกตรงจาก client) */
export async function setPopupEnabled(
  popupId: string,
  enabled: boolean,
): Promise<PopupActionState> {
  const popup = await db.popup.findUnique({
    where: { id: popupId },
    select: { websiteId: true },
  });
  if (!popup) return { error: "ไม่พบ Pop-up นี้" };

  const site = await requireWebsite(popup.websiteId);
  if (!site) return { error: "ไม่พบเว็บไซต์" };

  await db.popup.update({ where: { id: popupId }, data: { enabled } });
  revalidatePath("/administrator/popups");
  revalidatePath("/", "layout");
  return { saved: true };
}
