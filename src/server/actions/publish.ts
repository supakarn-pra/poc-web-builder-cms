"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export interface PublishState {
  error?: string;
  publishedAt?: string;
}

const KEEP_VERSIONS = 5;

/**
 * Copy ฉบับร่าง → snapshot เผยแพร่ ทั้งเว็บไซต์ (ทุกหน้า + ส่วนหัว/ท้าย)
 * เก็บ snapshot เดิมเข้า PageVersion ไว้กู้คืน (สูงสุด 5 เวอร์ชัน/หน้า)
 */
export async function publishWebsiteById(websiteId: string) {
  const site = await db.website.findUnique({
    where: { id: websiteId },
    include: { pages: { select: { id: true, sections: true, publishedSections: true } } },
  });
  if (!site) return null;

  const now = new Date();
  const ops = [];

  for (const page of site.pages) {
    // เก็บของเดิมเป็นเวอร์ชันก่อนทับ (เฉพาะที่เคยเผยแพร่และเนื้อหาต่างจากร่าง)
    if (page.publishedSections && page.publishedSections !== page.sections) {
      ops.push(
        db.pageVersion.create({
          data: { pageId: page.id, snapshot: page.publishedSections },
        }),
      );
    }
    ops.push(
      db.page.update({
        where: { id: page.id },
        data: { publishedSections: page.sections, status: "PUBLISHED" },
      }),
    );
  }

  ops.push(
    db.website.update({
      where: { id: websiteId },
      data: {
        publishedHeaderRow: site.headerRow,
        publishedFooterRow: site.footerRow,
        status: "PUBLISHED",
        publishedAt: now,
      },
    }),
  );

  await db.$transaction(ops);

  // ตัดเวอร์ชันเก่าให้เหลือหน้าละ KEEP_VERSIONS (นอก transaction — งานทำความสะอาด)
  for (const page of site.pages) {
    const excess = await db.pageVersion.findMany({
      where: { pageId: page.id },
      orderBy: { createdAt: "desc" },
      skip: KEEP_VERSIONS,
      select: { id: true },
    });
    if (excess.length > 0) {
      await db.pageVersion.deleteMany({
        where: { id: { in: excess.map((v) => v.id) } },
      });
    }
  }

  return now;
}

/** ปุ่ม "เผยแพร่" ใน builder */
export async function publishWebsite(
  _prev: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const user = await requireUser();
  const websiteId = String(formData.get("websiteId") ?? "");

  const site = await db.website.findUnique({
    where: { id: websiteId },
    select: { ownerId: true },
  });
  if (!site || (site.ownerId !== user.id && user.role !== "ADMIN")) {
    return { error: "ไม่พบเว็บไซต์" };
  }

  const at = await publishWebsiteById(websiteId);
  if (!at) return { error: "เผยแพร่ไม่สำเร็จ" };

  revalidatePath("/", "layout");
  revalidatePath("/administrator/websites");
  return { publishedAt: at.toISOString() };
}
