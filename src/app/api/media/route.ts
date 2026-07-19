import { NextResponse, type NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

// POC: เก็บใน public/uploads (Docker: mount volume ที่ /app/public/uploads)
// Production จริงบน serverless → สลับเป็น S3/R2 (interface เดียวกัน: url ใน DB)
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function requireWebsite(user: { id: string; role: string }) {
  return db.website.findFirst({
    where: { parentId: null, ...(user.role === "ADMIN" ? {} : { ownerId: user.id }) }, // เมนู CMS อิงเว็บหลักเสมอ (landing ไม่แย่ง context)
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const website = await requireWebsite(user);
  if (!website) return NextResponse.json({ items: [] });

  const items = await db.mediaAsset.findMany({
    where: { websiteId: website.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const website = await requireWebsite(user);
  if (!website) {
    return NextResponse.json({ error: "สร้างเว็บไซต์ก่อนอัปโหลดรูป" }, { status: 400 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "รองรับเฉพาะรูปภาพ (JPG, PNG, WebP, GIF, SVG)" },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 8MB" }, { status: 400 });
  }

  const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
  const safeName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(
    path.join(UPLOAD_DIR, safeName),
    Buffer.from(await file.arrayBuffer()),
  );

  const asset = await db.mediaAsset.create({
    data: {
      websiteId: website.id,
      url: `/uploads/${safeName}`,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    },
  });

  return NextResponse.json({ asset });
}
