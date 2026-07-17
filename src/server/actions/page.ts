"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getPageLayout } from "@/lib/pageLayouts";
import { instantiateRows } from "@/lib/templates";

export interface PageActionState {
  error?: string;
}

function slugify(name: string) {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9฀-๿\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  return s || `page-${Date.now().toString(36)}`;
}

async function assertOwnership(websiteId: string) {
  const user = await requireUser();
  const website = await db.website.findUnique({
    where: { id: websiteId },
    select: { id: true, ownerId: true },
  });
  if (!website || (website.ownerId !== user.id && user.role !== "ADMIN")) {
    return null;
  }
  return website;
}

const createSchema = z.object({
  websiteId: z.string().min(1),
  name: z.string().min(1, "กรุณาตั้งชื่อหน้า").max(60),
  layout: z.string().min(1),
});

export async function createPage(
  _prev: PageActionState,
  formData: FormData,
): Promise<PageActionState> {
  const parsed = createSchema.safeParse({
    websiteId: formData.get("websiteId"),
    name: formData.get("name"),
    layout: formData.get("layout"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const website = await assertOwnership(parsed.data.websiteId);
  if (!website) return { error: "ไม่พบเว็บไซต์" };

  const layout = getPageLayout(parsed.data.layout);
  if (!layout) return { error: "ไม่พบ Layout ที่เลือก" };

  // slug ไม่ซ้ำภายในเว็บไซต์ — เติม suffix ถ้าชน
  const base = slugify(parsed.data.name);
  let slug = base;
  for (let i = 2; i <= 20; i++) {
    const dup = await db.page.findUnique({
      where: { websiteId_slug: { websiteId: website.id, slug } },
      select: { id: true },
    });
    if (!dup) break;
    slug = `${base}-${i}`;
  }

  const page = await db.page.create({
    data: {
      websiteId: website.id,
      name: parsed.data.name,
      slug,
      sections: JSON.stringify(instantiateRows(layout.rows)),
    },
    select: { id: true },
  });

  redirect(`/builder/${website.id}/${page.id}`);
}

const renameSchema = z.object({
  pageId: z.string().min(1),
  name: z.string().min(1, "กรุณาตั้งชื่อหน้า").max(60),
});

export async function renamePage(
  _prev: PageActionState,
  formData: FormData,
): Promise<PageActionState> {
  const parsed = renameSchema.safeParse({
    pageId: formData.get("pageId"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const page = await db.page.findUnique({
    where: { id: parsed.data.pageId },
    select: { websiteId: true },
  });
  if (!page || !(await assertOwnership(page.websiteId))) {
    return { error: "ไม่พบหน้านี้" };
  }

  await db.page.update({
    where: { id: parsed.data.pageId },
    data: { name: parsed.data.name },
  });
  revalidatePath("/admin/pages");
  return {};
}

export async function deletePage(
  _prev: PageActionState,
  formData: FormData,
): Promise<PageActionState> {
  const pageId = String(formData.get("pageId") ?? "");
  const page = await db.page.findUnique({
    where: { id: pageId },
    select: { websiteId: true, isHome: true },
  });
  if (!page || !(await assertOwnership(page.websiteId))) {
    return { error: "ไม่พบหน้านี้" };
  }
  if (page.isHome) {
    return { error: "ลบหน้าแรกไม่ได้ — เว็บไซต์ต้องมีหน้าแรกเสมอ" };
  }

  await db.page.delete({ where: { id: pageId } });
  revalidatePath("/admin/pages");
  return {};
}
