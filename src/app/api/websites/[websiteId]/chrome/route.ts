import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const patchSchema = z.object({
  part: z.enum(["header", "footer"]),
  row: z.object({
    id: z.string(),
    label: z.string().max(60),
    columns: z.array(z.unknown()).min(1).max(4),
    style: z.record(z.string(), z.unknown()),
  }),
});

/** Auto-save ของ editor ส่วนหัว/ท้ายเว็บไซต์ */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { websiteId } = await params;
  const website = await db.website.findUnique({
    where: { id: websiteId },
    select: { ownerId: true },
  });
  if (!website || (website.ownerId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  await db.website.update({
    where: { id: websiteId },
    data:
      parsed.data.part === "header"
        ? { headerRow: JSON.stringify(parsed.data.row) }
        : { footerRow: JSON.stringify(parsed.data.row) },
  });

  return NextResponse.json({ ok: true });
}
