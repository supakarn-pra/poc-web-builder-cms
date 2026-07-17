import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const componentSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.string(), z.unknown()),
});

const columnSchema = z.object({
  id: z.string(),
  span: z.number().int().min(1).max(12),
  components: z.array(componentSchema).max(30),
  style: z
    .object({
      align: z.enum(["left", "center", "right"]).optional(),
      verticalAlign: z.enum(["top", "center", "bottom"]).optional(),
      card: z.boolean().optional(),
    })
    .optional(),
});

const rowSchema = z.object({
  id: z.string(),
  label: z.string().max(60),
  columns: z.array(columnSchema).min(1).max(4),
  style: z
    .object({
      background: z.string().optional(),
      paddingY: z.enum(["none", "sm", "md", "lg"]).optional(),
      hidden: z.boolean().optional(),
      contentWidth: z.enum(["normal", "wide", "full"]).optional(),
    })
    .passthrough(),
});

const patchSchema = z.object({
  rows: z.array(rowSchema).max(60),
});

/** Auto-save จาก Builder — บันทึกโครงสร้าง rows ของหน้า */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { pageId } = await params;
  const page = await db.page.findUnique({
    where: { id: pageId },
    select: { id: true, website: { select: { ownerId: true } } },
  });
  if (!page || (page.website.ownerId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const updated = await db.page.update({
    where: { id: pageId },
    data: { sections: JSON.stringify(parsed.data.rows) },
    select: { updatedAt: true },
  });

  return NextResponse.json({ savedAt: updated.updatedAt.toISOString() });
}
