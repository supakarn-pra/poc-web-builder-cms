import { NextResponse, type NextRequest } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { assetId } = await params;
  const asset = await db.mediaAsset.findUnique({
    where: { id: assetId },
    include: { website: { select: { ownerId: true } } },
  });
  if (!asset || (asset.website.ownerId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await db.mediaAsset.delete({ where: { id: assetId } });
  // ลบไฟล์จริง — พังก็ไม่เป็นไร (อาจโดนลบไปแล้ว)
  if (asset.url.startsWith("/uploads/")) {
    await unlink(path.join(process.cwd(), "public", asset.url)).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
