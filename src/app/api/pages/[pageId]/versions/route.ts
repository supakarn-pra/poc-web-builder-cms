import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * รายการเวอร์ชันของหน้า (สำหรับกู้คืน)
 * - "published": snapshot ที่เผยแพร่อยู่ตอนนี้
 * - versions: snapshot เก่าที่เก็บไว้ตอนเผยแพร่ทับ (สูงสุด 5)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { pageId } = await params;
  const page = await db.page.findUnique({
    where: { id: pageId },
    select: {
      publishedSections: true,
      website: { select: { ownerId: true, publishedAt: true } },
      versions: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, snapshot: true, createdAt: true },
      },
    },
  });
  if (!page || (page.website.ownerId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    published: page.publishedSections
      ? {
          snapshot: page.publishedSections,
          publishedAt: page.website.publishedAt?.toISOString() ?? null,
        }
      : null,
    versions: page.versions.map((v) => ({
      id: v.id,
      snapshot: v.snapshot,
      createdAt: v.createdAt.toISOString(),
    })),
  });
}
